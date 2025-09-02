// 사운드 시스템 (Web Audio API 사용)
export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.masterVolume = 0.7;
    this.sfxVolume = 0.8;
    this.musicVolume = 0.5;
    this.initialized = false;
  }

  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.createSounds();
      this.initialized = true;
    } catch (error) {
      console.warn('사운드 초기화 실패:', error);
    }
  }

  createSounds() {
    // 버블 발사 사운드
    this.sounds.shoot = this.createTone(440, 0.1, 'sine');
    
    // 버블 터지는 사운드
    this.sounds.pop = this.createTone(660, 0.15, 'square');
    
    // 콤보 사운드
    this.sounds.combo = this.createTone(880, 0.2, 'triangle');
    
    // 폭탄 폭발 사운드
    this.sounds.bomb = this.createNoise(0.3);
    
    // 레벨 완료 사운드
    this.sounds.levelComplete = this.createMelody([523, 659, 784], 0.5);
    
    // 게임 오버 사운드
    this.sounds.gameOver = this.createTone(220, 1, 'sawtooth');
  }

  createTone(frequency, duration, type = 'sine') {
    return () => {
      if (!this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.sfxVolume * this.masterVolume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    };
  }

  createNoise(duration) {
    return () => {
      if (!this.audioContext) return;

      const bufferSize = this.audioContext.sampleRate * duration;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      gainNode.gain.setValueAtTime(this.sfxVolume * this.masterVolume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      source.start(this.audioContext.currentTime);
    };
  }

  createMelody(frequencies, noteDuration) {
    return () => {
      if (!this.audioContext) return;

      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = this.audioContext.createOscillator();
          const gainNode = this.audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext.destination);

          oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
          oscillator.type = 'sine';

          gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(this.sfxVolume * this.masterVolume, this.audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + noteDuration * 0.8);

          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + noteDuration);
        }, index * noteDuration * 1000);
      });
    };
  }

  play(soundName) {
    if (!this.initialized || !this.sounds[soundName]) return;
    
    try {
      this.sounds[soundName]();
    } catch (error) {
      console.warn('사운드 재생 실패:', error);
    }
  }

  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
  }
}
