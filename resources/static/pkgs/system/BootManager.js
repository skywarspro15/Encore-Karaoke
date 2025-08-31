import Html from "/libs/html.js";
import langManager from "../../libs/l10n/manager.js";

let wrapper;

const pkg = {
  name: "Boot Manager",
  type: "app",
  privs: 1,
  start: async function (Root) {
    console.log("[BootManager] Started", Root);
    const loadingScreen = document.querySelector("#loading");
    if (loadingScreen) loadingScreen.remove();

    wrapper = new Html("div")
      .class("flex")
      .styleJs({
        width: "100%",
        height: "100%",
        position: "absolute",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        top: 0,
        left: 0,
        opacity: 0,
      })
      .html(
        `<svg width="15%" height="15%" viewBox="0 0 234 234" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M109.773 42.176C109.773 42.176 138.096 107.194 109.773 137.753C85.0659 164.411 62.3095 150.106 62.3095 150.106" stroke="url(#paint0_linear_236_11)" stroke-width="10" stroke-linecap="round"/><path d="M143.582 15.519C143.582 15.519 113.024 30.4732 118.875 44.7773C126.892 64.3734 153.215 57.9214 172.841 49.9787C199.498 38.275 206 15.519 206 15.519H187.145C170.133 15.519 159.837 7.06618 143.582 15.519Z" fill="url(#paint1_linear_236_11)"/><path d="M128.628 40.2254C128.628 40.2254 144.233 40.2254 160.487 35.0239C176.742 29.8225 192.346 22.0203 192.346 22.0203" stroke="url(#paint2_linear_236_11)" stroke-width="3" stroke-linecap="round"/><path d="M109.773 42.176C109.773 42.176 159.837 61.6815 161.788 134.502C161.788 178.064 129.278 175.464 129.278 175.464" stroke="url(#paint3_linear_236_11)" stroke-width="10" stroke-linecap="round"/><circle cx="68.8114" cy="160.509" r="40.3114" fill="url(#paint4_linear_236_11)"/><mask id="mask0_236_11" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="28" y="120" width="82" height="81"><circle cx="68.8114" cy="160.509" r="40.3114" fill="url(#paint5_linear_236_11)"/></mask><g mask="url(#mask0_236_11)"><mask id="mask1_236_11" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="28" y="120" width="82" height="81"><circle cx="68.8114" cy="160.509" r="40.3114" fill="url(#paint6_linear_236_11)"/></mask><g mask="url(#mask1_236_11)"><g style="mix-blend-mode:plus-lighter" opacity="0.56"><path d="M38.9434 152.707C38.4409 144.905 42.4106 129.301 62.3095 129.301" stroke="white" stroke-opacity="0.1" stroke-width="5" stroke-linecap="round"/></g><g style="mix-blend-mode:plus-lighter" opacity="0.56"><circle cx="38.2527" cy="162.46" r="3.25092" fill="white" fill-opacity="0.1"/></g><g style="mix-blend-mode:overlay"><path fill-rule="evenodd" clip-rule="evenodd" d="M62.3095 190.418C85.291 190.418 103.921 171.788 103.921 148.806C103.921 145.29 103.485 141.876 102.664 138.615C106.75 144.919 109.123 152.437 109.123 160.509C109.123 182.773 91.0747 200.821 68.8113 200.821C52.676 200.821 38.7548 191.341 32.3136 177.647C39.8845 185.519 50.5249 190.418 62.3095 190.418Z" fill="url(#paint7_linear_236_11)"/></g></g></g><circle cx="132.529" cy="181.315" r="40.3114" fill="url(#paint8_linear_236_11)"/><mask id="mask2_236_11" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="92" y="141" width="81" height="81"><circle cx="132.529" cy="181.315" r="40.3114" fill="url(#paint9_linear_236_11)"/></mask><g mask="url(#mask2_236_11)"><g style="mix-blend-mode:plus-lighter" opacity="0.56"><path d="M102.661 173.513C102.159 165.711 106.129 150.106 126.027 150.106" stroke="white" stroke-opacity="0.1" stroke-width="5" stroke-linecap="round"/></g><g style="mix-blend-mode:plus-lighter" opacity="0.56"><circle cx="101.971" cy="183.266" r="3.25092" fill="white" fill-opacity="0.1"/></g><g style="mix-blend-mode:overlay"><path fill-rule="evenodd" clip-rule="evenodd" d="M126.027 211.224C149.009 211.224 167.639 192.593 167.639 169.612C167.639 166.096 167.203 162.682 166.382 159.42C170.468 165.725 172.841 173.243 172.841 181.315C172.841 203.579 154.793 221.627 132.529 221.627C116.394 221.627 102.473 212.147 96.0316 198.453C103.602 206.325 114.243 211.224 126.027 211.224Z" fill="url(#paint10_linear_236_11)"/></g></g><defs><linearGradient id="paint0_linear_236_11" x1="92.3351" y1="42.176" x2="92.3351" y2="153.939" gradientUnits="userSpaceOnUse"><stop stop-color="#57A34B"/><stop offset="1" stop-color="#448239"/></linearGradient><linearGradient id="paint1_linear_236_11" x1="165.039" y1="12.2676" x2="165.039" y2="51.2786" gradientUnits="userSpaceOnUse"><stop stop-color="#3B8F49"/><stop offset="1" stop-color="#256730"/></linearGradient><linearGradient id="paint2_linear_236_11" x1="128.628" y1="21.3701" x2="128.628" y2="43.4763" gradientUnits="userSpaceOnUse"><stop stop-color="#2B6C35"/><stop offset="1" stop-color="#215028"/></linearGradient><linearGradient id="paint3_linear_236_11" x1="135.78" y1="42.176" x2="135.78" y2="175.493" gradientUnits="userSpaceOnUse"><stop stop-color="#62B255"/><stop offset="1" stop-color="#3C7733"/></linearGradient><linearGradient id="paint4_linear_236_11" x1="68.8114" y1="120.198" x2="68.8114" y2="200.821" gradientUnits="userSpaceOnUse"><stop stop-color="#B5102E"/><stop offset="1" stop-color="#930C24"/></linearGradient><linearGradient id="paint5_linear_236_11" x1="68.8114" y1="120.198" x2="68.8114" y2="200.821" gradientUnits="userSpaceOnUse"><stop stop-color="#B5102E"/><stop offset="1" stop-color="#930C24"/></linearGradient><linearGradient id="paint6_linear_236_11" x1="68.8114" y1="120.198" x2="68.8114" y2="200.821" gradientUnits="userSpaceOnUse"><stop stop-color="#C91939"/><stop offset="1" stop-color="#9B0F28"/></linearGradient><linearGradient id="paint7_linear_236_11" x1="74.0128" y1="195.619" x2="107.822" y2="166.361" gradientUnits="userSpaceOnUse"><stop stop-opacity="0.16"/><stop offset="1" stop-opacity="0.3"/></linearGradient><linearGradient id="paint8_linear_236_11" x1="132.529" y1="141.004" x2="132.529" y2="221.627" gradientUnits="userSpaceOnUse"><stop stop-color="#C91939"/><stop offset="1" stop-color="#9B0F28"/></linearGradient><linearGradient id="paint9_linear_236_11" x1="132.529" y1="141.004" x2="132.529" y2="221.627" gradientUnits="userSpaceOnUse"><stop stop-color="#C91939"/><stop offset="1" stop-color="#9B0F28"/></linearGradient><linearGradient id="paint10_linear_236_11" x1="137.731" y1="216.425" x2="171.54" y2="187.167" gradientUnits="userSpaceOnUse"><stop stop-opacity="0.16"/><stop offset="1" stop-opacity="0.4"/></linearGradient></defs></svg>`,
      )
      .appendTo("body");

    let startupSound = new Audio("/assets/audio/startup.wav");
    let hasLoaded = false;
    startupSound.addEventListener("loadeddata", () => {
      if (hasLoaded === true) return;
      hasLoaded = true;
      beginAnimation();
    });
    setTimeout(() => {
      startupSound.load();
    }, 16);

    console.log("waiting for load");

    function beginAnimation() {
      wrapper.style({ opacity: 1 });
      console.log("LOADED");
      let animation = "logoAnimate";

      wrapper.classOn(`${animation}In`);

      setTimeout(() => {
        startupSound.volume = 1;
        startupSound.play();
      }, 1000);

      setTimeout(() => {
        wrapper.classOff(`${animation}In`).classOn(`${animation}Out`);
        setTimeout(() => {
          wrapper.cleanup();
          doEverythingElse();
        }, 1000);
      }, 1000);
    }

    await Root.Core.pkg.run("services:SfxLib", [], true);
    await Root.Core.pkg.run("services:UiLib", [], true);
    await Root.Core.pkg.run("services:Forte", [], true);
    await Root.Core.pkg.run("services:FsSvc", [], true);

    async function doEverythingElse() {
      // define the tv's name, used for casting
      let tvName = "Encore Karaoke";
      Root.Security.setSecureVariable("TV_NAME", tvName);

      await Root.Core.pkg.run("system:EncoreLoader", [], true);
      wrapper.class("popOut");

      let mvT;

      window.addEventListener("mousemove", (e) => {
        clearTimeout(mvT);
        document.body.classList.remove("mouse-disabled");
        window.mouseDisabled = false;
        mvT = setTimeout(() => {
          window.mouseDisabled = true;
          document.body.classList.add("mouse-disabled");
          console.log("Mouse is inactive");
        }, 4000);
      });

      return;
    }
  },
  end: async function () {
    wrapper.cleanup();
  },
};

export default pkg;
