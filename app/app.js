const remote = require('electron').remote;
const os = require('os');
const fs = require('fs');
const fsUtils = require('fs');
const fsExtra = require('fs-extra');
const fsPath = require('path');

const saveFile = require('electron').remote.require('electron-save-file');
const dialogUtils = require('electron').remote.dialog 
const shell = require('electron').shell; 
const electronShortcut = require('electron').remote.require('electron-localshortcut');

//Loading other libs
const handleBars = require('handlebars');
const hashMD5 = require('md5');
const moment = require("moment");

//LIBS
const appUI=require("./app/assets/js/app-ux.js");
const appAPI=require("./app/assets/js/app-validator.js");
const appUtils=require("./app/assets/js/app-utils.js");
const appData=require("./app/assets/js/app-data.js");

var isWin = /^win/.test(process.platform);

var APPCONFIG={};

var macAddress="FF:FF:FF:FF:FF:FF";
var deviceID=null;

var logger = null;

$(function() {
    try {
        netAdd=os.networkInterfaces();
        netKeys=Object.keys(netAdd);
        macAddress=netAdd[netKeys[netKeys.length-1]][0]['mac'];
        macAddress=macAddress.toUpperCase();
    } catch(e) {
        console.log("MAC Address Not Found");
    }
    deviceID=hashMD5(macAddress);

    //Disable all Std <a> Links
    $("body").delegate("a[href]:not([data-toggle])","click",function() {
        href=$(this).attr('href');
        if(href=="#" || href=="##" || href.substr(0,2)=="##") return true;
        return false;
    });

    //Start normal process
    $.ajax("./app/app.json").done(function(data) {
        data=$.parseJSON(data);
        APPCONFIG=data;

        // APPCONFIG.DEBUG=appUtils.isDev();

        if(appUtils.isDev()) {
            APPCONFIG=$.extend(APPCONFIG,APPCONFIG.SETTINGS.DEV);
        } else {
            APPCONFIG=$.extend(APPCONFIG,APPCONFIG.SETTINGS.PROD);
        }

        if(APPCONFIG.HOME==null) APPCONFIG.HOME="#home";

        if(APPCONFIG.UICONFIG==null) APPCONFIG.UICONFIG={};
        if(APPCONFIG.POLICIES==null) APPCONFIG.POLICIES={};

        checkAppPaths();

        // initLoggers();

        //Start Debugger
        // appDebugger();

        initUI(initEvents);

        loadAppShell();

        // setTimeout(function() {
        //     appAPI.checkAlerts();
        // },appData.getConfig('NOTIFICATION_INTERVAL'));
    });
});

function initUI(callBack) {
    appUI.generateMenu();
    appUI.showTray();
    
    if(callBack!=null && typeof callBack=="function") {
        callBack();
    }
}

function initEvents() {
    $("body").delegate("a[href].pageLink","click",function() {
        href=$(this).attr('href');
        appUI.navigatePage(href, this);
        return false;
    });
    $("body").delegate("a[href].browserLink","click",function() {
        href=$(this).attr('href');
        remote.shell.openItem(href);
        return false;
    });
    $("body").delegate("*.actioncmd[cmd]","click",function() {
        cmd=$(this).attr('cmd');
        if(window[cmd]!=null) window[cmd](this);
        return false;
    });

    $("body").delegate("*.actionchange[cmd],*.actionChange[cmd]","change",function() {
        cmd=$(this).attr('cmd');
        if(window[cmd]!=null) window[cmd](this);
        return false;
    });
    
    $("body").delegate(".searchPage input[type=search]","keyup",function(e) {
        appUtils.searchPage("#albumList",$(this).val(),".albumUnit",".searchText");
    });
    
}

function registerShortcut(key, callBack) {//'Ctrl+A'
// electronShortcut.register(remote.getCurrentWindow(),key,function(e) {
    // electronShortcut.register(remote.getGlobal("getMainWindow")(),key,function(e) {
    //     // console.log("CTRL+A");
    //     if(typeof callBack=="function") callBack(e);
    // });
}

function loadAppShell() {
    $("body").load("./app/app.html");
}

/*Other Supporting Functions*/
function logoutApp() {
    appSecure.doLogout(function() {
        appUI.navigatePage("login");
    },function() {
        appUI.navigatePage("login");
    });
    
}

function maximize() {
    if(remote.getCurrentWindow().isMaximized()) {
        remote.getCurrentWindow().restore();
    } else {
        remote.getCurrentWindow().maximize();
    }
}

function fullScreen() {
    if(remote.getCurrentWindow().isFullScreen()) {
        remote.getCurrentWindow().setFullScreen(false);
    } else {
        remote.getCurrentWindow().setFullScreen(true);
    }
}

function closeApp() {
    remote.app.exit();
}
function reloadApp() {
    window.location.reload();
}

function appDebugger() {
    if(APPCONFIG.DEBUG!=true) return;

    //Page Change Watcher
    fsUtils.watch(__dirname+"/app/pages/",function (event, filename) {
        fileHashlink=filename.replace(".html","");
        switch(event) {
            case "change":
                if(appUI.CURRENT_PAGE==fileHashlink) {
                    appUI.reloadPage();
                } else {
                    appUI.navigatePage(fileHashlink);
                }
            break;
            case "rename":

            break;
            case "delete":

            break;
        }
    });
}
