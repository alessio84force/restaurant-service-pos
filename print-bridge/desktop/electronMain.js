"use strict";

function avviaElectron() {
  const {
    app,
    BrowserWindow,
    session,
    dialog,
    utilityProcess
  } = require("electron");

  const { avviaDesktop } = require("./server");
  const {
    creaControlloreServizio
  } = require("./controlloServizio");

  let server = null;
  let finestra = null;
  let controllore = null;
  let chiusuraInCorso = false;
  let chiusuraConsentita = false;

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

  app.on("before-quit", evento => {
    if (chiusuraConsentita) return;

    evento.preventDefault();

    if (chiusuraInCorso) return;
    chiusuraInCorso = true;

    try {
      if (controllore) controllore.arresta();
    } catch (_) {
      chiusuraInCorso = false;
      dialog.showErrorBox(
        "Restaurant Service Print Bridge",
        "Impossibile arrestare il servizio."
      );
      return;
    }

    Promise.resolve()
      .then(() =>
        controllore
          ? controllore.attendiArresto()
          : undefined
      )
      .then(() => new Promise(resolve => {
        if (server && server.listening) {
          server.close(resolve);
        } else {
          resolve();
        }
      }))
      .then(() => {
        chiusuraConsentita = true;
        app.quit();
      })
      .catch(() => {
        chiusuraInCorso = false;
        dialog.showErrorBox(
          "Restaurant Service Print Bridge",
          "Arresto non completato. Il servizio non è stato interrotto forzatamente."
        );
      });
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

    controllore = creaControlloreServizio({
      lancia: (workerFile, opzioni) =>
        utilityProcess.fork(workerFile, [], opzioni)
    });

    server = avviaDesktop({ controllore });

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
