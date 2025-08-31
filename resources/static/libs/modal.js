import controllerStatusBar from "./controllerStatusBar.js";
import langManager from "./l10n/manager.js";
import Html from "./html.js";
import Keyboard from "./keyboard.js";

let Processes, Ui;
let Sfx = { playSfx() {} };

let numb = -1;

const Modal = {
  init(p) {
    Processes = p;

    // stall for a bit for UiLib to become available (hacky)

    let x = setInterval(() => {
      if (Processes.getService("UiLib") !== undefined) {
        Ui = Processes.getService("UiLib").data;
        clearInterval(x);

        // Modal.js will overwrite alert() for you
        (function () {
          window.alert = function () {
            Modal.Show({
              title: langManager.getString("status.alert"),
              description: arguments[0],
              parent: document.body,
              pid: Ui.getTopUi(),
              buttons: [
                {
                  type: "primary",
                  text: langManager.getString("actions.ok"),
                },
              ],
            });
            return;
          };
        })(window.alert);
      }
    }, 1000);
  },
  Show(data) {
    return new Promise((resolve, reject) => {
      // Validate data using guard clauses . . .
      if (!data) {
        throw new Error("Data is required");
      }

      if (!data.parent) {
        throw new Error("Parent element is required");
      }

      if (!data.pid) {
        throw new Error("Parent topUI must be known");
      }

      if (typeof data.title !== "string") {
        throw new Error("Title must be a string");
      }

      if (typeof data.description !== "string") {
        data.description = JSON.stringify(data.description);
        // throw new Error("Description must be a string");
      }

      if (data.type !== "custom" && !Array.isArray(data.buttons)) {
        throw new Error("Buttons must be an array");
      }

      if (data.type === "custom" && !data.customType) {
        throw new Error("customType is required");
      }

      if (data.csbInfo !== undefined && !data.customType) {
        throw new Error("customType is required for csbInfo");
      }

      let csb;
      try {
        function initCsb() {
          let csbInfo = [
            { type: "any-dir", label: langManager.getString("actions.move") },
            {
              type: "confirm",
              label: langManager.getString("actions.confirm"),
            },
            { type: "back", label: langManager.getString("actions.cancel") },
          ];
          if (data.csbInfo !== undefined && Array.isArray(data.csbInfo)) {
            csbInfo = data.csbInfo;
          }
          csb = new controllerStatusBar(...csbInfo);
        }
        if (data.type === "custom") {
          initCsb();
        } else if (data.buttons.length > 0) {
          initCsb();
        }
      } catch (e) {
        if (csb) {
          csb.cleanup();
        }
      }

      numb--;
      let num = numb;

      if (data.type !== "custom")
        data.buttons.forEach((button) => {
          if (typeof button.type !== "string") {
            throw new Error("Button type must be a string");
          }

          if (typeof button.text !== "string") {
            throw new Error("Button text must be a string");
          }
        });

      // - - - - - - -

      async function killModal(result) {
        // Disable UI input
        Ui.unListenAll(num);

        // Wait for transition to complete before
        // giving up Top UI control to the parent.
        Sfx.playSfx("deck_ui_hide_modal.wav");
        Ui.transition("fadeOut", modalContainer);
        if (csb) csb.cleanup();
        await Ui.transition("popOut", modalContent);
        await Ui.giveUpUi(num, false);
        Ui.becomeTopUi(data.pid);
        resolve(result);
        modalContainer.cleanup();
      }

      // - - - - - - -

      // Create modal container
      const modalContainer = new Html("div").class("modal-container");

      // Mouse click-off support
      modalContainer.on("click", (e) => {
        if (e.target.closest(".modal-content")) return;
        return killModal({ canceled: true, text: null, id: -1 });
      });

      if (data.customType) {
        modalContainer.classOn(data.customType);
      }

      // Create modal content
      const modalContent = new Html("div").class("modal-content");

      // Create modal title
      new Html("h2").text(data.title).appendTo(modalContent);

      // Create modal description
      new Html("p").text(data.description).appendTo(modalContent);

      let modalButtons;
      if (data.type !== "custom") {
        // Create modal buttons
        modalButtons = new Html("div")
          .class("modal-buttons", "ui-box")
          .appendTo(modalContent);

        data.buttons.forEach((button, i) => {
          new Html("button")
            .class(button.type)
            .text(button.text)
            .appendTo(modalButtons)
            .on("click", async (e) => {
              await killModal({ canceled: false, text: button.text, id: i });
            });
        });
      } else {
        modalContent.append(data.customData);
      }

      // Append modal to parent element
      modalContent.appendTo(modalContainer);
      modalContainer.appendTo(data.parent);

      // Make modal controllable
      Ui = Processes.getService("UiLib").data;
      Sfx = Processes.getService("SfxLib").data;

      // Apply animation effects to modal
      Ui.transition("fadeIn", modalContainer);
      Ui.transition("popIn", modalContent);

      if (data.lists === undefined && data.type !== "custom")
        data.lists = [modalButtons.elm.children];
      else if (data.lists === undefined && data.type === "custom")
        data.lists = Array.from(
          data.customData.elm.querySelector(".buttons").children,
        ).map((s) => Array.from(s.children));

      Sfx.playSfx("deck_ui_show_modal.wav");

      // -1 is just so that we don't use an actual process ID
      Ui.becomeTopUi(num);

      if (data.dataHandler) {
        data.dataHandler(function (result) {
          killModal(result);
        });
      }

      // Make the list controllable
      Ui.init(
        num,
        "horizontal",
        data.lists,
        async function (t) {
          if (data.ephemeral !== true)
            if (t === "back" || t === "menu") {
              // Cancel
              return await killModal({ canceled: true, text: null, id: -1 });
            }
          data.buttonCallback !== undefined && data.buttonCallback(t);
        },
        data.customSfx,
      );

      if (data.ephemeral === true) return resolve({ killModal });
    });
  },
  async showWithoutButtons(title, description, parent, pid, endCallback) {
    let result = await this.Show({
      title,
      description,
      parent,
      pid,
      ephemeral: true,
      buttons: [],
    });
    endCallback(async function () {
      return await result.killModal({ canceled: true, label: null, id: -1 });
    });
  },
  async showKeyboard(options, layout = "keys_en_US_QWERTY") {
    // WIP: Implement keyboard into modal functionality.
    let ContainerDiv = new Html("div").class("flex-col");

    let inputBox = new Html("div")
      .class("input")
      .attr({ type: "text" })
      .text(
        options.type === "password"
          ? "•".repeat(options.value.length)
          : options.value || "",
      )
      .appendTo(ContainerDiv);

    let text = options.value || "";

    let cb;

    // probably dangerous to have to guess the modal pid
    let num = numb - 1;

    const keyboard = await Keyboard.new(
      function (e) {
        switch (e.type) {
          case "key":
            text += e.data;
            if (options.type === "password") {
              inputBox.elm.textContent += "•";
            } else {
              if (e.data === " ") {
                inputBox.elm.innerHTML += "&nbsp;";
              } else {
                inputBox.elm.textContent += e.data;
              }
            }
            break;
          case "special":
            switch (e.data) {
              case "backspace":
                text = text.substring(0, text.length - 1);
                if (options.type === "password") {
                  inputBox.elm.textContent = "•".repeat(text.length);
                } else {
                  inputBox.elm.textContent = text;
                }
                break;
              case "complete":
                cb({
                  canceled: false,
                  text: inputBox.elm.textContent,
                  id: -1,
                });
                break;
              case "cancel":
                cb({
                  canceled: true,
                  text: options.value,
                  id: -1,
                });
                break;
            }
            break;
        }
      },
      layout,
      num,
    );

    // input list
    new Html("div")
      .appendTo(ContainerDiv)
      .class("flex-col-small", "buttons")
      .appendMany(
        ...keyboard.keysListHtml,
        // new Html("div").class("flex-row-small").appendMany(
        //   new Html("button").text("Confirm").on("click", (e) => {
        //     cb({
        //       canceled: false,
        //       text: inputBox.elm.textContent,
        //       id: -1,
        //     });
        //   }),
        //   new Html("button").text("Cancel").on("click", (e) => {
        //     cb({ canceled: true, text: null, id: -1 });
        //   })
        // )
      );

    document.dispatchEvent(
      new CustomEvent("CherryTree.Input.ShowKeyboardPrompt", {
        detail: {
          title: options.title,
          description: options.description,
          type: options.type,
          value: options.value,
        },
      }),
    );

    document.addEventListener("CherryTree.Input.FinishKeyboard", (e) => {});

    document.addEventListener("CherryTree.Input.TypeInKeyboard", (e) => {
      console.log(e.detail);

      text = e.detail.text;
      inputBox.elm.textContent = "";
      if (options.type === "password") {
        for (let i = 0; i < text.length; i++) {
          inputBox.elm.textContent += "•";
        }
      } else {
        for (let i = 0; i < text.length; i++) {
          if (text.charAt(i) === " ") {
            inputBox.elm.innerHTML += "&nbsp;";
          } else {
            inputBox.elm.textContent += text.charAt(i);
          }
        }
      }
    });

    const result = await this.Show({
      parent: options.parent,
      pid: options.pid,
      title: options.title,
      description: options.description,
      type: "custom",
      customSfx: {
        hover: "deck_ui_navigation.wav",
        activate: "deck_ui_typing.wav",
      },
      customData: ContainerDiv,
      customType: "keyboard",
      csbInfo: [
        { type: "any-dir", label: langManager.getString("actions.move") },
        {
          type: "confirm",
          label: langManager.getString("actions.confirm"),
        },
        { type: "back", label: langManager.getString("actions.cancel") },
        {
          type: "act",
          label: langManager.getString("actions.delete"),
        },
        {
          type: "alt",
          label: langManager.getString("actions.space"),
        },
      ],
      buttonCallback: function (btn) {
        keyboard.buttonHandler(btn);
      },
      dataHandler: function (clb) {
        // Callback the callback
        cb = clb;
      },
      // buttons: [{ type: "primary", text: "Label" }],
    });

    return Object.assign({ value: text }, result);
  },
};

export default Modal;
