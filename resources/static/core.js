////////////////////////
//  Cherry Tree Core  //
//  By kat21 and lap  //
////////////////////////

import Html from "./libs/html.js";
import Ws from "./libs/windowSystem.js";
import Modal from "./libs/modal.js";
import Keyboard from "./libs/keyboard.js";
import vfs from "./libs/vfs.js";
import notify from "./libs/notify.js";
import controllerMapping from "./libs/controllerMapping.js";
import "./libs/gamecontroller.js";

(async () => {
  if (typeof window["gameControl"] !== "undefined") {
    console.log("gc found!!");
    gameControl.on("connect", (gamepad) => {
      console.log("gp found!!");
      controllerMapping.setup(gamepad);
    });

    gameControl.on("disconnect", (gamepad) => {
      console.log("Gp disconnected!");
      window.gps.splice(gamepad, 1);
    });
  }
  let Security = {
    vars: new Map(),
    getSecureVariable(key) {
      return this.vars.get(key);
    },
    setSecureVariable(key, value) {
      return this.vars.set(key, value);
    },
    async setToken(token) {
      await vfs.importFS();
      await vfs.writeFile("Root/CherryTree/user/.token", token);
    },
    async getToken() {
      await vfs.importFS();
      return await vfs.readFile("Root/CherryTree/user/.token");
    },
  };
  let Libs = {
    Html,
    startPkg(pkgName, args) {
      return Core.pkg.run(pkgName, args, false);
    },
    Modal,
    Window: Ws.data.win,
    ControllerSupported: () => !(typeof window["gameControl"] === "undefined"),
  };
  let Processes = {
    list: [],

    get(id) {
      const i = Processes.list[id];
      if (i) {
        return {
          name: i.name,
          pid: i.pid,
          type: i.type,
        };
      }
    },
    getService(name) {
      const p = Processes.list
        .filter((p) => p !== null)
        .filter((p) => p.type === "svc")
        .find((p) => p.svcName === name);
      if (p !== undefined) return { data: p.data };
    },
  };
  let Core = {
    process: {
      findEmptyPid: function () {
        let r = Processes.list.findIndex((p) => p === null);
        return r !== -1 ? r : Processes.list.length;
      },

      cleanup: function (pid) {
        if (Processes.list[pid]) Processes.list[pid] = null;
        return;
      },
    },
    pkg: {
      startFromUrl: async function (
        url,
        Arguments,
        RunWithoutSecurity = false,
      ) {
        const pkg = await import(url);
        const pkgData = pkg.default;
        let privs = false;

        // Validate package information
        if (!pkgData || typeof pkgData !== "object") return false;
        if (!pkgData.start || typeof pkgData.start !== "function") return false;
        if (!pkgData.end || typeof pkgData.end !== "function") return false;
        if (!pkgData.name || typeof pkgData.name !== "string") return false;
        if (!pkgData.type || typeof pkgData.type !== "string") return false;
        if (
          pkgData.svcName !== undefined &&
          typeof pkgData.svcName !== "string"
        )
          return false;
        if (pkgData.data !== undefined && typeof pkgData.data !== "object")
          return false;
        if (pkgData.privs === undefined || typeof pkgData.privs !== "number")
          return false;

        // Bypass security checks (For system apps)
        if (RunWithoutSecurity === false) {
          if (pkgData.privs === 1) {
            if (
              confirm(
                `The app ${pkgData.name} wants to start with privileges. Confirm or deny?`,
              ) === true
            ) {
              privs = true;
            }
          }
        } else {
          privs = pkgData.privs === 1 ? true : false;
        }

        // Look into the package data
        const pkgHasData = pkgData.data !== undefined;
        let data = undefined;

        // Assign package type (usually "app")
        let pkgType = pkgData.type;
        let svcName = pkgData.svcName;

        if (pkgHasData) {
          data = pkgData.data;
          pkgType = "svc"; // Service means it does have accessible data
        }

        const pid = Core.process.findEmptyPid();

        Processes.list[pid] = {
          pid,
          name: pkgData.name,
          type: pkgType,
          privs: pkgData.privs,
          data,
          async end() {
            console.log("Attempting to end pkg:", pkgData.name);

            const result = await pkgData.end();

            // If the process doesn't want to end it can return false
            if (result !== false) Core.process.cleanup(pid);

            document.dispatchEvent(
              new CustomEvent("CherryTree.Core.ProcessExit", {
                detail: { url, name: pkgData.name, pid },
              }),
            );
          },
        };

        if (svcName !== undefined) Processes.list[pid].svcName = svcName;

        const Root = {
          Arguments,
          Libs,
          Security,
          Input,
          Core: privs === true ? Core : undefined,
          Pid: pid,
          end: Processes.list[pid].end,
          Processes: {
            list: privs === true ? Processes.list : undefined,
            get: Processes.get,
            getService: Processes.getService,
          },
        };

        pkg.default.start(Root);

        document.dispatchEvent(
          new CustomEvent("CherryTree.Core.ProcessStart", {
            detail: { url, name: pkgData.name, pid },
          }),
        );

        return Processes.list[pid];
      },

      run: async function (url, args, rwp) {
        const appCat = url.split(":");
        const cat = appCat[0];
        const nam = appCat[1];
        const securedCats = ["system", "ui"];
        return await this.startFromUrl(
          `/pkgs/${cat}/${nam}.js`,
          args,
          rwp !== true ? securedCats.includes(cat) : true,
        );
      },
    },
  };

  const Input = {
    listen: function (what, listener, pid) {
      if (this.listeners[what] !== undefined)
        this.listeners[what][pid] = listener;
    },
    unListen: function (what, pid) {
      this.listeners[what][pid] = undefined;
    },
    /*
    +--------+--------+-------------+
    | Input  | Button | Key         |
    | ------ | ------ | ----------- |
    | left   | <-     | ArrowLeft   |
    | right  | ->     | ArrowRight  |
    | up     | ^      | ArrowUp     |
    | down   | v      | ArrowDown   |
    | confirm| A      | Space/Enter |
    | back   | B      | Backspace   |
    | act    | X      | Ctrl        |
    | alt    | Y      | Backslash   |
    | menu   | Select | Escape      |
    +--------+--------+-------------+
    */
    listeners: {
      left: {},
      right: {},
      up: {},
      down: {},
      confirm: {},
      back: {},
      act: {},
      alt: {},
      menu: {},
    },
    /**
     * Pop the input
     * @param {InputType} type Input type
     */
    pop: function (type, playerId = 0) {
      // console.log("Input:", type);
      this.listeners[type][this.focusedApp] &&
        this.listeners[type][this.focusedApp](playerId);
      window.currentPlayerId = playerId;
      window.gpListeners[type].forEach((l) => l());
      // this.listeners[type].forEach((l) => l(this.focusedApp));
    },
    // Focused app determines which menu is on top and should be controllable
    // (PID-based)
    focusedApp: null,
  };

  window.gpListeners = {
    left: [],
    right: [],
    up: [],
    down: [],
    confirm: [],
    back: [],
    act: [],
    alt: [],
    menu: [],
  };

  window.onkeydown = function (e) {
    switch (e.code) {
      // Left
      case "ArrowLeft":
        Libs.Input.pop("left", 4);
        break;
      // Right
      case "ArrowRight":
        Libs.Input.pop("right", 4);
        break;
      // Up
      case "ArrowUp":
        Libs.Input.pop("up", 4);
        break;
      // Down
      case "ArrowDown":
        Libs.Input.pop("down", 4);
        break;
      // Confirm
      case "Enter":
      case "Space":
        Libs.Input.pop("confirm", 4);
        break;
      // Back
      case "Backspace":
        if (e.target.tagName.toLowerCase() === "input") return;
        Libs.Input.pop("back", 4);
        break;
      // Action
      case "ControlLeft":
      case "ControlRight":
        Libs.Input.pop("act", 4);
        break;
      // Menu
      case "Escape":
        Libs.Input.pop("menu", 4);
        break;
      // Alternate
      case "Backslash":
        Libs.Input.pop("alt", 4);
        break;
    }
  };

  window.gps = [];

  Libs.Input = Input;
  Libs.Notify = notify;

  // For debugging purposes
  window.Core = Core;
  window.Processes = Processes;
  window.Security = Security;
  window.Libs = Libs;
  window.vfs = vfs;

  Ws.init(Core);
  Modal.init(Processes);
  Keyboard.init(Processes);
  await Core.pkg.run("system:BootManager", {
    time: performance.now(),
  });
  notify.init(Processes);
  controllerMapping.init(notify.show);
  if (typeof window["gameControl"] === "undefined") {
    setTimeout(() => {
      Modal.Show({
        title: "Gamepad support is not available",
        description:
          "Gamepad support will be unavailable in this session. Use keyboard, mouse or touch instead.",
        parent: document.body,
        pid: -1,
        buttons: [{ type: "primary", text: "OK" }],
      });
    }, 5000);
  }

  document.body.style.opacity = 1;
  setTimeout((_) => {
    document.getElementById("TEMP_STYLE").remove();
  }, 1000);
})();
