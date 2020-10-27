import {
  app,
  BrowserWindow,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  dialog, ipcMain, ipcRenderer, webContents
} from "electron";
import * as path from "path";
import * as fs from "fs";
import { IpcMainEvent } from "electron/main";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

interface IOriginator {
  getSnapshot(): JSON;
  restore(snapshot: JSON): void;
}

class Caretaker {
  private backups: Array<JSON> = new Array<JSON>();
  private frontups: Array<JSON> = new Array<JSON>();
  private originator: IOriginator = null;

  public constructor(originator: IOriginator) {
    this.originator = originator;
    this.backups = [];
    this.frontups = [];
  }

  Backup(state: JSON = null) {
    if (this.backups.length + 1 > 100)
      this.backups.shift();

    if (state === null)
      this.backups.push(this.originator.getSnapshot());
    else
      this.backups.push(state);
  }

  Frontup(state: JSON): void {
    if (this.frontups.length + 1 > 100)
      this.frontups.shift();

    this.frontups.push(state);

    console.log(this.frontups);
  }

  Undo() {
    if (this.backups.length === 0) return;

    let m = this.backups.pop();

    try {
      this.originator?.restore(m);
      this.Frontup(m);
    } catch (error) {
      this.Undo();
    }
  }

  Redo() {
    if (this.frontups.length === 0) return;

    let m = this.frontups.pop();

    try {
      this.originator?.restore(m);
      this.Backup(m);
    } catch (error) {
      this.Redo();
    }
  }
}

let webjson: WebJSON;
let caretaker: Caretaker;

//  Load Default Data
const IMG_DIR = "C:\\Development\\Web\\mali-and-family\\public\\images";
const JSON_DIR = "C:\\Development\\Web\\mali-and-family\\src\\data\\data.en.json";

class WebJSON implements IOriginator {
  private state: JSON;
  private loadedPath: string;
  private window: BrowserWindow;

  public constructor(window: BrowserWindow) {
    this.window = window;
    this.loadedPath = undefined;
  }

  getSnapshot = (): JSON => this.state;

  restore(snapshot: JSON) {
    this.setState(snapshot);
    this.window.webContents.send('website-data', snapshot);
  }

  setState(state: JSON) {
    this.state = state;
    caretaker.Backup();
    this.window.webContents.send('website-data', state);
  }

  private ReadAndLoadFile(path: string) {
    fs.readFile(path, "utf-8", (err, data) => {
      if (err) {
        dialog.showErrorBox(err.name, err.message);
        return;
      }
      this.loadedPath = path;
      this.restore(JSON.parse(data));
    });
  }

  loadState(window: BrowserWindow, defaultPath: string = undefined) {
    if (defaultPath !== undefined && defaultPath !== "") {
      this.ReadAndLoadFile(defaultPath);
    } else {
      const path = dialog.showOpenDialogSync(window, {
        title: "JSON File To Open",
        filters: [{ name: "Website JSON Data", extensions: ["json"] }],
        defaultPath: JSON_DIR,
        properties: ["openFile"],
      });
      if (path === undefined && path[0] === "") {
        dialog.showErrorBox(
          "File Not Selected or Found",
          "This is either the wrong file type and/or it cannot be loaded."
        );
        return;
      }
      this.ReadAndLoadFile(path[0]);
    }
  }

  saveStateAs(window: BrowserWindow) {
    const path = dialog.showSaveDialogSync(window, {
      title: "Save JSON File",
      filters: [{ name: "Website JSON Data", extensions: ["json"] }],
      defaultPath: JSON_DIR,
      properties: ["showOverwriteConfirmation"]
    });
    if (path === undefined) return;
    let json = JSON.stringify(this.state, null, 2);
    fs.writeFile(path[0], json, "utf-8", (err) => {
      if (err)
        dialog.showErrorBox(`Saving Error: ${err.name}`, err.message);
      else
        console.log("File was saved successfully.");
    });
  }

  saveState(window: BrowserWindow) {
    if (this.loadedPath !== undefined) {
      let json = JSON.stringify(this.state, null, 2);
      fs.writeFile(this.loadedPath, json, "utf-8", (err) => {
        if (err)
          dialog.showErrorBox(`Saving Error: ${err.name}`, err.message);
        else
          console.log("File was saved successfully.");
      });
    }
    else
      this.saveStateAs(window);
  }
}

const loadImageDir = (window: BrowserWindow, path: string = undefined): void => {
  if (path && path !== "") {
    window.webContents.send('img-dir', path);
  } else {
    let imageDirectory = dialog.showOpenDialogSync(window, {
      title: "Open Image Path",
      properties: ["openDirectory"],
      defaultPath: IMG_DIR,
    })[0];
    if (imageDirectory === undefined) {
      dialog.showErrorBox("DNF", "Directory not found.");
      return;
    }
    window.webContents.send('img-dir', imageDirectory);
  }
}

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1280,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    },
  });

  mainWindow.loadFile(path.join(__dirname, "../src/index.html"));

  //  Website JSON Data Handler
  webjson = new WebJSON(mainWindow);
  //  Memento State Handler
  caretaker = new Caretaker(webjson);
  //  Custom Menu Bar
  const template: Array<MenuItem | MenuItemConstructorOptions> = [
    //  File Menu
    {
      label: "File",
      submenu: [
        {
          label: "Open JSON File",
          accelerator: "CmdOrCtrl+O",
          click: () => webjson.loadState(mainWindow),
        },
        {
          label: "Open Image Directory",
          accelerator: "CmdOrCtrl+Shift+O",
          click: () => loadImageDir(mainWindow),
        },
        { type: "separator" },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: () => webjson.saveState(mainWindow)
        },
        {
          label: "Save JSON as",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => webjson.saveStateAs(mainWindow)
        },
        {type: "submenu", label: "Debug", submenu: [
          {
            label: "Open Default",
            accelerator: "CmdOrCtrl+Alt+O",
            click: () => {loadImageDir(mainWindow, IMG_DIR); webjson.loadState(mainWindow, JSON_DIR)} 
          }
        ]}
      ],
    },
    //  Edit Menu
    {
      label: "Edit",
      submenu: [
        {
          label: "Undo",
          accelerator: "CmdOrCtrl+Z",
          click: () => caretaker.Undo()
        },
        {
          label: "Redo",
          accelerator: "CmdOrCtrl+Shit+Z",
          click: () => caretaker.Redo()
        },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
      ],
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
      ],
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // loadImageDir(mainWindow, IMG_DIR);
  // webjson.loadState(mainWindow, JSON_DIR);

  //  Opens Dev Tools on Launch
  //mainWindow.webContents.openDevTools();

  mainWindow.maximize();

  mainWindow.on("close", () => webjson.saveState(mainWindow));
};

ipcMain.on('state-changed', (event: IpcMainEvent, state: JSON) => {
  console.log(state);
  webjson.setState(state);
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed
app.on("window-all-closed", () => {
  app.quit();
});