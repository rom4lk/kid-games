(function initializeGameSound(global) {
  let context;

  // One AudioContext per page. It is created lazily, on the first real user
  // gesture, because a browser refuses to start audio before that.
  function audioContext() {
    if (context) return context;
    const AudioContextClass = global.AudioContext || global.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
    return context;
  }

  // One note with a soft envelope, so no game has to repeat the oscillator and
  // gain wiring. Every game keeps its own sound vocabulary and calls this.
  function tone({ frequency, delay = 0, duration = 0.16, volume = 0.055, wave = "sine", bendTo }) {
    const active = audioContext();
    if (!active) return;
    if (active.state === "suspended") active.resume();

    const oscillator = active.createOscillator();
    const gain = active.createGain();
    const startTime = active.currentTime + delay;

    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    if (bendTo) oscillator.frequency.exponentialRampToValueAtTime(bendTo, startTime + duration);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gain).connect(active.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.04);
  }

  global.GameSound = Object.freeze({ audioContext, tone });
}(window));
