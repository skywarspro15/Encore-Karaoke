import { soundManager } from "/libs/soundManager.js";

let Data = undefined;
let SoundManager = new soundManager();

const pkg = {
  name: "Sounds Library",
  svcName: "SfxLib",
  type: "app",
  privs: 0,
  async start(Root) {
    console.log("[SfxLib] Started.");

    let sfxPack = await window.localforage.getItem("settings__sfxPack");

    if (sfxPack === null) {
      sfxPack = "/assets/audio/sfx_dreamy.zip";
    }

    console.log("[SfxLib] Loading sounds...");

    await this.data.init(sfxPack);
  },
  data: {
    async store(s) {
      await Promise.all(
        Object.keys(s)
          .filter((s) => s.trim() !== "")
          .map(async (k) => {
            await SoundManager.loadSound(s[k], k);
          }),
      );
      console.log("[SfxLib] Loaded new sounds.");
    },
    async init(url = "/assets/audio/sfx_dreamy.zip") {
      // Fetch the audio.zip file
      async function fetchAudioZip() {
        try {
          const response = await fetch(url);
          const blob = await response.blob();

          // Create a new zip file
          const reader = new window.zip.ZipReader(
            new window.zip.BlobReader(blob),
          );

          // Get all the entries in the zip file
          const entries = await reader.getEntries();
          const soundEffects = {}; // Object to store sound effects

          // Iterate over each entry in the zip file
          for (const entry of entries) {
            const name = extractFilename(entry.filename); // Extract the file name
            // Extract the file data as a Blob
            const blob = await entry.getData(new window.zip.Uint8ArrayWriter());
            soundEffects[name] = blob.buffer; // Add the audio to the soundEffects object with its name
          }

          // Now you can use the soundEffects object
          return { success: true, data: soundEffects };
        } catch (error) {
          // Handle any errors
          return { success: false, data: error };
        }
      }

      // Helper function to extract the filename from its path
      function extractFilename(path) {
        return path.substr(path.lastIndexOf("/") + 1);
      }

      console.log("[SfxLib] Working...");
      const result = await fetchAudioZip();

      if (!result.success) {
        console.log(
          "[SfxLib] Failed to extract sound effects. Error..",
          result.data,
        );
        return;
      }

      await this.store(result.data);

      console.log("done loading sfx");
    },
    setVolume: (v) => {
      SoundManager.setVolume(v);
    },
    getVolume: (v) => {
      return SoundManager.vol ?? 1;
    },
    playSfx(s) {
      SoundManager.playSound(s);
    },
  },
  end: async function () {
    console.log("[SfxLib] Exiting.");
  },
};

export default pkg;
