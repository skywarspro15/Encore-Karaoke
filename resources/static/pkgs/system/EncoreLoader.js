import Html from "/libs/html.js";

let wrapper, Ui, Pid, Sfx;
let root;
let statusP;

const pkg = {
  name: "Encore Loader",
  type: "app",
  privs: 0,

  // Add the loading sequence function
  async startLoadingSequence() {
    let forte = root.Processes.getService("ForteSvc").data;
    let fsSvc = root.Processes.getService("FsSvc").data;
    statusP.text("Loading Forte Sound Engine...");
    // let forteDevices = await forte.getVocalDevices();
    // console.log("vocal devices", forteDevices);
    // await forte.startVocalEngine({
    //   input_device: forteDevices.inputs[0],
    //   output_device: forteDevices.outputs[0],
    //   buffer_size: 1024,
    // });

    try {
      const config = await window.desktopIntegration.ipc.invoke("getConfig");
      console.log(config);
      if (!config.setupComplete) {
        // await forte.loadTrack("/assets/audio/demo_futari.mp3");
        await forte.playTrack();
        await root.Libs.startPkg("system:EncoreSetup", []);
        this.end();
      } else {
        statusP.text("Loading Library...");
        document.addEventListener("CherryTree.FsSvc.SongList.Progress", (e) => {
          statusP.text(
            `Loading library...\n${e.detail.current}/${e.detail.total} (${e.detail.percentage}%)`,
          );
        });
        fsSvc.buildSongList(config.libraryPath);
        document.addEventListener(
          "CherryTree.FsSvc.SongList.Ready",
          async () => {
            const settings = {
              input_device: config.audioConfig.mix.vocal.inputDevice,
              output_device: config.audioConfig.mix.vocal.outputDevice,
              buffer_size: config.audioConfig.bufferSize,
            };
            await forte.startVocalEngine(settings);
            await root.Libs.startPkg("system:EncoreHome", []);
          },
          { once: true },
        );
      }
    } catch (error) {
      // Assume config is corrupted
      console.error("Failed to load config:", error);
      // await forte.loadTrack("/assets/audio/demo_futari.mp3");
      await forte.playTrack();
      await root.Libs.startPkg("system:EncoreSetup", []);
      this.end();
    }
  },

  start: async function (Root) {
    root = Root;
    // --- Existing Setup ---
    window.desktopIntegration !== undefined &&
      window.desktopIntegration.ipc.send("setRPC", {
        details: "Booting up...",
      });

    Pid = Root.Pid;
    Ui = Root.Processes.getService("UiLib").data;
    Sfx = Root.Processes.getService("SfxLib").data; // Get SfxLib earlier

    // --- Create UI Elements ---
    wrapper = new Html("div").class("full-ui").appendTo("body").styleJs({
      backgroundColor: "white",
      color: "black",
      opacity: 0, // Start fully transparent for our master fade-in
    });

    let imgContainer = new Html("div")
      .styleJs({
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      })
      .appendTo(wrapper);

    // Store the image element in a variable to target it with anime.js
    let mascotImg = new Html("img")
      .attr({ src: "assets/img/oobe/hoshi_hi.png" })
      .styleJs({
        position: "absolute",
        top: "0",
        left: "-250px",
        width: "100%",
        height: "100%",
        objectFit: "cover",
      })
      .appendTo(imgContainer);

    let elementContainer = new Html("div")
      .styleJs({
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        padding: "80px",
      })
      .appendTo(wrapper);

    new Html("div")
      .styleJs({ height: "100%", width: "50%" })
      .appendTo(elementContainer);

    let right = new Html("div")
      .styleJs({
        height: "100%",
        width: "50%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "right",
      })
      .appendTo(elementContainer);

    // --- Store Text Elements in Variables to Animate Them ---
    let telebiText = new Html("p")
      .styleJs({
        fontSize: "2rem",
        textAlign: "right",
        margin: "0",
        padding: "0",
        fontWeight: "500",
      })
      .text("テレビ")
      .appendTo(right);

    let encoreH1 = new Html("h1")
      .styleJs({
        fontFamily: "Rajdhani",
        fontSize: "10rem",
        lineHeight: "9rem",
        fontWeight: "bold",
        textAlign: "right",
        margin: "0",
        padding: "0",
        // Hide overflow to contain the letter animations
        overflow: "hidden",
      })
      .appendTo(right);

    // ** ANIMATION PREP for "ENCORE" **
    // We split the word into spans so we can animate each letter individually.
    encoreH1.html(
      "ENCORE"
        .split("")
        .map(
          (letter) =>
            `<span class="encore-letter" style="display: inline-block;">${letter}</span>`,
        )
        .join(""),
    );

    let karaokeH2 = new Html("h2")
      .styleJs({
        margin: "0",
        padding: "0",
        fontFamily: "Rajdhani",
        fontSize: "3.5rem",
        lineHeight: "2rem",
        fontWeight: "bold",
        textAlign: "right",
      })
      .text("KARAOKE")
      .appendTo(right);

    new Html("br").appendTo(right);
    new Html("br").appendTo(right);

    statusP = new Html("p")
      .text("Booting up...")
      .appendTo(right)
      .styleJs({ textAlign: "right", fontSize: "2rem" });

    Ui.becomeTopUi(Pid, wrapper);

    // --- ANIMATION SEQUENCE ---
    // Create a timeline to control the sequence of animations.
    const tl = anime.timeline({
      easing: "easeInOutExpo", // A smooth, professional easing for all animations
    });

    // 1. Master Fade-In for the whole screen
    tl.add({
      targets: wrapper.elm,
      opacity: [0, 1],
      duration: 500,
    });

    // 2. Mascot slides in from the left
    tl.add(
      {
        targets: mascotImg.elm,
        translateX: ["-50%", 0], // Move from off-screen to its final position
        opacity: [0, 1],
        duration: 1200,
      },
      "-=300",
    ); // Start this animation 300ms before the previous one ends

    // 3. "ENCORE" letters fly in, staggered
    tl.add(
      {
        targets: ".encore-letter",
        translateY: ["100%", 0], // Move up from below
        opacity: [0, 1],
        delay: anime.stagger(70), // Each letter starts 70ms after the previous one
      },
      "-=1000",
    ); // Start this relative to the mascot animation

    // 4. "テレビ" and "KARAOKE" fade and slide in
    tl.add(
      {
        targets: [telebiText.elm, karaokeH2.elm],
        translateY: [-20, 0], // Move down slightly
        opacity: [0, 1],
        duration: 800,
      },
      "-=600",
    ); // Start this as the "ENCORE" letters are settling

    // 5. "Booting up..." text fades in last
    tl.add(
      {
        targets: statusP.elm,
        opacity: [0, 1],
        duration: 1000,
      },
      "-=500",
    ).complete = () => {
      // Add pulsing animation to the loading text after timeline completes
      anime({
        targets: statusP.elm,
        opacity: [1, 0.3],
        duration: 1000,
        direction: "alternate",
        loop: true,
        easing: "easeInOutSine",
      });

      // Start the loading sequence
      this.startLoadingSequence();
    };

    Ui.init(Pid, "horizontal", []);
  },
  end: async function () {
    // Exit this UI when the process is exited
    Ui.cleanup(Pid);
    // Sfx.playSfx("deck_ui_out_of_game_detail.wav");

    // You can also create a nice exit animation here!
    await Ui.transition("fadeOut", wrapper, 500);

    Ui.giveUpUi(Pid);
    wrapper.cleanup();
  },
};

export default pkg;
