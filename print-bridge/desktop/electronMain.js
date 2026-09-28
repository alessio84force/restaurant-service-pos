"use strict";

function avviaElectron() {
  const {
    app,
    BrowserWindow,
    session,
    dialog
  } = require("electron");

  const { avviaDesktop } = require("./server");

  let server = null;
  let finestra = null;

  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }

  app.on("second-instance", () => {
    if (finestra) {
      if (finestra.isMinimized()) finestra.restore();
      finestra.focus();
    }
  });

  app.on("before-quit", () => {
    if (server && server.listening) {
      server.close();
    }
  });

  app.on("window-all-closed", () => {
    app.quit();
  });

  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler(
      (_webContents, _permission, callback) => {
        callback(false);
      }
    );

    server = avviaDesktop();

    server.once("error", () => {
      dialog.showErrorBox(
        "Restaurant Service Print Bridge",
        "Impossibile avviare il servizio locale."
      );

      app.quit();
    });

    server.once("listening", () => {
      const url =
        "http://127.0.0.1:" +
        server.address().port +
        "/";

      finestra = new BrowserWindow({
        width: 980,
        height: 760,
        minWidth: 780,
        minHeight: 620,
        autoHideMenuBar: true,
        backgroundColor: "#0b1430",
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          webviewTag: false,
          webSecurity: true
        }
      });

      finestra.webContents.setWindowOpenHandler(() => ({
        action: "deny"
      }));

      finestra.webContents.on(
        "will-navigate",
        (evento, destinazione) => {
          if (destinazione !== url) {
            evento.preventDefault();
          }
        }
      );

      finestra.on("closed", () => {
        finestra = null;
      });

      finestra.loadURL(url).catch(() => {
        dialog.showErrorBox(
          "Restaurant Service Print Bridge",
          "Impossibile caricare la finestra Desktop."
        );

        app.quit();
      });
    });
  }).catch(() => app.quit());
}

if (require.main === module) {
  avviaElectron();
}

module.exports = {
  avviaElectron
};
