"use strict";
exports.__esModule = true;
var electron_1 = require("electron");
var path = require("path");
var fs = require("fs");
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
    // eslint-disable-line global-require
    electron_1.app.quit();
}
var Caretaker = /** @class */ (function () {
    function Caretaker(originator) {
        this.backups = new Array();
        this.frontups = new Array();
        this.originator = null;
        this.originator = originator;
        this.backups = [];
        this.frontups = [];
    }
    Caretaker.prototype.Backup = function (state) {
        if (state === void 0) { state = null; }
        if (this.backups.length + 1 > 100)
            this.backups.shift();
        if (state === null)
            this.backups.push(this.originator.getSnapshot());
        else
            this.backups.push(state);
    };
    Caretaker.prototype.Frontup = function (state) {
        if (this.frontups.length + 1 > 100)
            this.frontups.shift();
        this.frontups.push(state);
        console.log(this.frontups);
    };
    Caretaker.prototype.Undo = function () {
        var _a;
        if (this.backups.length === 0)
            return;
        var m = this.backups.pop();
        try {
            (_a = this.originator) === null || _a === void 0 ? void 0 : _a.restore(m);
            this.Frontup(m);
        }
        catch (error) {
            this.Undo();
        }
    };
    Caretaker.prototype.Redo = function () {
        var _a;
        if (this.frontups.length === 0)
            return;
        var m = this.frontups.pop();
        try {
            (_a = this.originator) === null || _a === void 0 ? void 0 : _a.restore(m);
            this.Backup(m);
        }
        catch (error) {
            this.Redo();
        }
    };
    return Caretaker;
}());
var webjson;
var caretaker;
//  Load Default Data
var IMG_DIR = "C:\\Development\\Web\\mali-and-family\\public\\images";
var JSON_DIR = "C:\\Development\\Web\\mali-and-family\\src\\data\\data.en.json";
var WebJSON = /** @class */ (function () {
    function WebJSON(window) {
        var _this = this;
        this.getSnapshot = function () { return _this.state; };
        this.window = window;
        this.loadedPath = undefined;
    }
    WebJSON.prototype.restore = function (snapshot) {
        this.setState(snapshot);
        this.window.webContents.send('website-data', snapshot);
    };
    WebJSON.prototype.setState = function (state) {
        this.state = state;
        caretaker.Backup();
        this.window.webContents.send('website-data', state);
    };
    WebJSON.prototype.ReadAndLoadFile = function (path) {
        var _this = this;
        fs.readFile(path, "utf-8", function (err, data) {
            if (err) {
                electron_1.dialog.showErrorBox(err.name, err.message);
                return;
            }
            _this.loadedPath = path;
            _this.restore(JSON.parse(data));
        });
    };
    WebJSON.prototype.loadState = function (window, defaultPath) {
        if (defaultPath === void 0) { defaultPath = undefined; }
        if (defaultPath !== undefined && defaultPath !== "") {
            this.ReadAndLoadFile(defaultPath);
        }
        else {
            var path_1 = electron_1.dialog.showOpenDialogSync(window, {
                title: "JSON File To Open",
                filters: [{ name: "Website JSON Data", extensions: ["json"] }],
                defaultPath: JSON_DIR,
                properties: ["openFile"]
            });
            if (path_1 === undefined && path_1[0] === "") {
                electron_1.dialog.showErrorBox("File Not Selected or Found", "This is either the wrong file type and/or it cannot be loaded.");
                return;
            }
            this.ReadAndLoadFile(path_1[0]);
        }
    };
    WebJSON.prototype.saveStateAs = function (window) {
        var path = electron_1.dialog.showSaveDialogSync(window, {
            title: "Save JSON File",
            filters: [{ name: "Website JSON Data", extensions: ["json"] }],
            defaultPath: JSON_DIR,
            properties: ["showOverwriteConfirmation"]
        });
        if (path === undefined)
            return;
        var json = JSON.stringify(this.state, null, 2);
        fs.writeFile(path[0], json, "utf-8", function (err) {
            if (err)
                electron_1.dialog.showErrorBox("Saving Error: " + err.name, err.message);
            else
                console.log("File was saved successfully.");
        });
    };
    WebJSON.prototype.saveState = function (window) {
        if (this.loadedPath !== undefined) {
            var json = JSON.stringify(this.state, null, 2);
            fs.writeFile(this.loadedPath, json, "utf-8", function (err) {
                if (err)
                    electron_1.dialog.showErrorBox("Saving Error: " + err.name, err.message);
                else
                    console.log("File was saved successfully.");
            });
        }
        else
            this.saveStateAs(window);
    };
    return WebJSON;
}());
var loadImageDir = function (window, path) {
    if (path === void 0) { path = undefined; }
    if (path && path !== "") {
        window.webContents.send('img-dir', path);
    }
    else {
        var imageDirectory = electron_1.dialog.showOpenDialogSync(window, {
            title: "Open Image Path",
            properties: ["openDirectory"],
            defaultPath: IMG_DIR
        })[0];
        if (imageDirectory === undefined) {
            electron_1.dialog.showErrorBox("DNF", "Directory not found.");
            return;
        }
        window.webContents.send('img-dir', imageDirectory);
    }
};
var createWindow = function () {
    // Create the browser window.
    var mainWindow = new electron_1.BrowserWindow({
        height: 800,
        width: 1280,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });
    mainWindow.loadFile(path.join(__dirname, "../src/index.html"));
    //  Website JSON Data Handler
    webjson = new WebJSON(mainWindow);
    //  Memento State Handler
    caretaker = new Caretaker(webjson);
    //  Custom Menu Bar
    var template = [
        //  File Menu
        {
            label: "File",
            submenu: [
                {
                    label: "Open JSON File",
                    accelerator: "CmdOrCtrl+O",
                    click: function () { return webjson.loadState(mainWindow); }
                },
                {
                    label: "Open Image Directory",
                    accelerator: "CmdOrCtrl+Shift+O",
                    click: function () { return loadImageDir(mainWindow); }
                },
                { type: "separator" },
                {
                    label: "Save",
                    accelerator: "CmdOrCtrl+S",
                    click: function () { return webjson.saveState(mainWindow); }
                },
                {
                    label: "Save JSON as",
                    accelerator: "CmdOrCtrl+Shift+S",
                    click: function () { return webjson.saveStateAs(mainWindow); }
                },
                { type: "submenu", label: "Debug", submenu: [
                        {
                            label: "Open Default",
                            accelerator: "CmdOrCtrl+Alt+O",
                            click: function () { loadImageDir(mainWindow, IMG_DIR); webjson.loadState(mainWindow, JSON_DIR); }
                        }
                    ] }
            ]
        },
        //  Edit Menu
        {
            label: "Edit",
            submenu: [
                {
                    label: "Undo",
                    accelerator: "CmdOrCtrl+Z",
                    click: function () { return caretaker.Undo(); }
                },
                {
                    label: "Redo",
                    accelerator: "CmdOrCtrl+Shit+Z",
                    click: function () { return caretaker.Redo(); }
                },
                { type: "separator" },
                { role: "cut" },
                { role: "copy" },
                { role: "paste" },
            ]
        },
        //  View Menu
        {
            label: "View",
            submenu: [
                { role: "toggleDevTools" },
                { type: "separator" },
                { role: "resetZoom" },
                { role: "zoomIn" },
                { role: "zoomOut" },
                { type: "separator" },
                { role: "togglefullscreen" },
            ]
        }
    ];
    var menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
    // loadImageDir(mainWindow, IMG_DIR);
    // webjson.loadState(mainWindow, JSON_DIR);
    //  Opens Dev Tools on Launch
    //mainWindow.webContents.openDevTools();
    mainWindow.maximize();
    mainWindow.on("close", function () { return webjson.saveState(mainWindow); });
};
electron_1.ipcMain.on('state-changed', function (event, state) {
    console.log(state);
    webjson.setState(state);
});
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron_1.app.on("ready", createWindow);
// Quit when all windows are closed
electron_1.app.on("window-all-closed", function () {
    electron_1.app.quit();
});
//# sourceMappingURL=index.js.map