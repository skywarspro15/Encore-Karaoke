export class soundManager {
  soundBufs;
  audioContext;
  gainNode;

  constructor() {
    this.soundBufs = {};
    this.audioContext = new (window.AudioContext ||
      //@ts-ignore webkitAudioContext exists
      window.webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  async loadSound(arrayBuffer, name) {
    // console.log("[SfxManagerDebug]", name, arrayBuffer);
    try {
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.soundBufs[name] = audioBuffer;
    } catch (e) {
      console.warn(`Sound "${name}" encountered an issue while loading.`);
    }
  }

  playSound(name) {
    const soundBuffer = this.soundBufs[name];
    if (!soundBuffer) {
      console.error(`Sound "${name}" not found.`);
      return;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = soundBuffer;
    source.connect(this.gainNode);
    source.start();
  }

  setVolume(volume) {
    this.vol = volume;
    this.gainNode.gain.value = volume;
  }
}
