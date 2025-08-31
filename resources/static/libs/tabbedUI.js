import Html from "./html.js";
import controllerStatusBar from "./controllerStatusBar.js";
import langManager from "./l10n/manager.js";

class TabbedUI {
  constructor(obj) {
    let tabs = obj.tabs;
    let wrapper = obj.wrapper;
    let Ui = obj.ui;
    let Sfx = obj.sfx;
    let callback = obj.callback;
    let Pid = obj.pid;
    this.csb = new controllerStatusBar(
      { type: "any-dir", label: langManager.getString("actions.move") },
      {
        type: "confirm",
        label: langManager.getString("actions.confirm"),
      },
      { type: "back", label: langManager.getString("actions.cancel") },
    );

    wrapper.styleJs({
      display: "flex",
      gap: "1.25rem",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    });

    let tabsList = new Html("div")
      .styleJs({
        height: "calc(100% - 12rem)",
        width: "max-content",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--background-light)",
        borderRadius: "5px",
        gap: "0.5rem",
        padding: "1.25rem 0",
        width: "11.25rem",
      })
      .appendTo(wrapper);

    let tabContents = new Html("div")
      .styleJs({
        height: "calc(100% - 12rem)",
        width: "75%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--background-light)",
        borderRadius: "5px",
      })
      .appendTo(wrapper);

    let tabButtons = [];
    let tabContentButtons = [];

    let uiFuncs = {
      add: (elm) => {
        tabContentButtons.push(elm);
        console.log("Added to list", tabContentButtons);
      },
      update: (elms) => {
        tabContentButtons = elms;
        console.log("Updated element list", tabContentButtons);
      },
    };

    let first;
    Object.keys(tabs).forEach((tab) => {
      if (!first) {
        first = tab;
      }
      let tabDiv = new Html("div").appendTo(tabsList).styleJs({
        width: "calc(100% - 1.5rem)",
        alignSelf: "center",
      });
      let tabElement = new Html("button").styleJs({
        height: "3.5rem",
        minWidth: "9.75rem",
        padding: "0 1.25rem",
        textAlign: "left",
        width: "9.75rem",
      });
      tabElement.on("click", () => {
        tabContents.clear();
        tabContentButtons = [];
        tabs[tab](tabContents, uiFuncs);
        Sfx.playSfx("deck_ui_tab_transition_01.wav");

        for (const button of tabButtons) {
          if (button[0]) {
            button[0].classList.remove("pressed");
            if (button[0] === tabElement.elm) {
              button[0].classList.add("pressed");
            }
          }
        }
      });
      tabElement.text(tab);
      tabElement.appendTo(tabDiv);
      tabButtons.push(tabDiv.elm.children);
    });

    let focusedOnTab = false;
    let prevValue = 0;
    let hoverValue = 0;

    let isPlaying = false;

    function handleTabFocus(e) {
      console.log(e);
      console.log(prevValue);
      if (!focusedOnTab) {
        hoverValue = e.y;
      }
      if (
        focusedOnTab == false &&
        e.x === 0 &&
        prevValue == 0 &&
        e.button == "right"
      ) {
        Ui.update(Pid, tabContentButtons);
        Ui.updateParentCallback(handleTabFocus);
        focusedOnTab = true;
      } else if (
        focusedOnTab == true &&
        e.x === 0 &&
        prevValue == 0 &&
        e.button == "left"
      ) {
        Ui.update(Pid, tabButtons);
        Ui.updateParentCallback(handleTabFocus);
        Ui.updatePos(Pid, { x: 0, y: hoverValue });
        focusedOnTab = false;
      } else {
        // loud sound fix by avoiding duplicates
        if (isPlaying === true) return;
        Sfx.playSfx(window.uiInfo[Pid].customSfx.hover);
        isPlaying = true;
        setTimeout(() => {
          isPlaying = false;
        }, 150);
      }
      prevValue = e.x;
      callback(e);
      return false;
    }

    tabContents.clear();
    tabContentButtons = [];
    tabsList.qs("button").elm.click();
    // tabs[first](tabContents, uiFuncs);

    Ui.init(Pid, "horizontal", tabButtons, handleTabFocus);
  }
  cleanup() {
    this.csb.cleanup();
  }
}

export default TabbedUI;
