// Procedural Web Audio API Sound Engine for "Leader Murgi Chur"
// Zero external audio files required — ultra fast, punchy, and arcade-responsive!

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    }
    return this.isMuted;
  }

  // Chicken squawk / cluck ("কক কক ককক!")
  playCluck() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    // FM modulation for chicken squawk
    osc.type = 'sawtooth';
    const baseFreq = 500 + Math.random() * 200;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.05);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, t + 0.14);

    mod.type = 'square';
    mod.frequency.setValueAtTime(45 + Math.random() * 20, t);
    modGain.gain.setValueAtTime(280, t);
    modGain.gain.exponentialRampToValueAtTime(10, t + 0.14);

    mod.connect(modGain);
    modGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    mod.start(t);
    osc.start(t);
    mod.stop(t + 0.15);
    osc.stop(t + 0.15);
  }

  // Jump spring whoosh ("হুইশ / লাফ!")
  playJump() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.22);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Comic flying kick impact ("ঠাস! / DISHOOM!")
  playKick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Sub-bass thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.2);
    oscGain.gain.setValueAtTime(0.45, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.22);

    // Punchy noise crack ("ঠাস!")
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.Q.setValueAtTime(1.5, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(t);
  }

  // Blocker flying away yell / whoosh
  playVillagerFly() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320 + Math.random() * 100, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.35);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  // Roadside energy drink gulp + uplifting power chime ("ঢক ঢক! লিডার পাওয়ার!")
  playGulp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Gulp pop
    const gulpOsc = this.ctx.createOscillator();
    const gulpGain = this.ctx.createGain();
    gulpOsc.type = 'sine';
    gulpOsc.frequency.setValueAtTime(350, t);
    gulpOsc.frequency.exponentialRampToValueAtTime(180, t + 0.08);
    gulpGain.gain.setValueAtTime(0.3, t);
    gulpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    gulpOsc.connect(gulpGain);
    gulpGain.connect(this.ctx.destination);
    gulpOsc.start(t);
    gulpOsc.stop(t + 0.09);

    // Power-up ascending major arpeggio (C5 - E5 - G5 - C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const noteOsc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      const noteStart = t + 0.08 + idx * 0.06;

      noteOsc.type = 'triangle';
      noteOsc.frequency.setValueAtTime(freq, noteStart);

      noteGain.gain.setValueAtTime(0.2, noteStart);
      noteGain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.18);

      noteOsc.connect(noteGain);
      noteGain.connect(this.ctx.destination);

      noteOsc.start(noteStart);
      noteOsc.stop(noteStart + 0.18);
    });
  }

  // Stumble on obstacle / hit by front villager
  playStumble() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.28);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Soft rhythmic footstep
  playFootstep() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(130 + Math.random() * 30, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.04);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Gono Pituni / Mob Brawl Chaotic comic sound
  playGonoPituni() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Rapid random cartoon hit sounds over 1.2 seconds
    for (let i = 0; i < 9; i++) {
      const hitTime = t + i * 0.11 + Math.random() * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'sawtooth';
      const f = 120 + Math.random() * 300;
      osc.frequency.setValueAtTime(f, hitTime);
      osc.frequency.exponentialRampToValueAtTime(f * 0.4, hitTime + 0.09);

      gain.gain.setValueAtTime(0.25, hitTime);
      gain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(hitTime);
      osc.stop(hitTime + 0.1);
    }
  }

  // Double jump chicken wing flap boost ("ফড়ফড়!")
  playDoubleJump() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [0, 0.07].forEach((delay, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startT = t + delay;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340 + idx * 120, startT);
      osc.frequency.exponentialRampToValueAtTime(880 + idx * 150, startT + 0.14);

      gain.gain.setValueAtTime(0.22, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startT);
      osc.stop(startT + 0.16);
    });
  }

  // Bangladeshi CNG / Motorbike double-beep horn ("পিঁপ পিঁপ!")
  playBikeHorn() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [0, 0.16].forEach((delay) => {
      const startT = t + delay;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(440, startT);
      osc2.frequency.setValueAtTime(554.37, startT); // Major third dual horn

      gain.gain.setValueAtTime(0.18, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.11);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(startT);
      osc2.start(startT);
      osc1.stop(startT + 0.12);
      osc2.stop(startT + 0.12);
    });
  }

  // Mud puddle splash sound ("ছপাৎ!")
  playMudSplash() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.22;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(220, t + 0.22);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
  }

  // Mob dialogue audio removed as requested (comic speech bubbles retained visually on canvas)
  speakMobShout() {
    // No-op
  }

  // Game over sting / sad comedy horn
  playGameOver() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [330, 311.13, 293.66, 261.63]; // E4, Eb4, D4, C4
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteStart = t + idx * 0.18;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, noteStart);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.95, noteStart + 0.22);

      gain.gain.setValueAtTime(0.22, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + 0.25);
    });
  }

  // Upbeat rural Bengali arcade folk groove synthesized loop
  startBGM() {
    if (this.bgmPlaying || this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    this.bgmPlaying = true;
    this.bgmStep = 0;

    // Tempo ~ 138 BPM (16th note ~ 108ms)
    const stepDuration = 0.11;

    // Bassline notes (C minor pentatonic energetic run)
    const bassline = [
      130.81, 0, 130.81, 155.56,
      130.81, 0, 196.00, 174.61,
      130.81, 130.81, 155.56, 0,
      174.61, 196.00, 233.08, 196.00
    ];

    const playStep = () => {
      if (!this.bgmPlaying || this.isMuted || !this.ctx) return;

      const t = this.ctx.currentTime;
      const note = bassline[this.bgmStep % bassline.length];

      // Bass note
      if (note > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, t);
        filter.frequency.exponentialRampToValueAtTime(150, t + 0.09);

        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.1);
      }

      // Folk dholak / percussion tap (hi-hat / woodblock style)
      if (this.bgmStep % 2 === 0) {
        const percOsc = this.ctx.createOscillator();
        const percGain = this.ctx.createGain();
        percOsc.type = this.bgmStep % 4 === 0 ? 'triangle' : 'sine';
        percOsc.frequency.setValueAtTime(this.bgmStep % 4 === 0 ? 180 : 380, t);
        percOsc.frequency.exponentialRampToValueAtTime(60, t + 0.04);

        percGain.gain.setValueAtTime(0.06, t);
        percGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        percOsc.connect(percGain);
        percGain.connect(this.ctx.destination);

        percOsc.start(t);
        percOsc.stop(t + 0.05);
      }

      this.bgmStep++;
      this.bgmTimer = setTimeout(playStep, stepDuration * 1000);
    };

    playStep();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  // App-facing compatibility aliases
  start() {
    this.startBGM();
  }

  playDefeat() {
    this.playGameOver();
  }
}

export const sound = new SoundEngine();

// Auto-unlock Web Audio on first user interaction across modern desktop & mobile browsers
if (typeof window !== 'undefined') {
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Safe fallback
    }
  }

  const unlockAudio = () => {
    sound.init();
    ['click', 'touchstart', 'touchend', 'keydown'].forEach((evt) => {
      window.removeEventListener(evt, unlockAudio);
    });
  };
  ['click', 'touchstart', 'touchend', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, unlockAudio, { passive: true, once: true });
  });
}

export default sound;
