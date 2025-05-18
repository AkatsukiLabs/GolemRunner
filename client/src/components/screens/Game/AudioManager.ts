class AudioManager {
    private backgroundMusic: HTMLAudioElement | null = null;
    private gameOverSound: HTMLAudioElement | null = null;
    private clickSound: HTMLAudioElement | null = null;
    private jumpSound: HTMLAudioElement | null = null;
  
    private soundsEnabled: boolean = true; 
  
    constructor() {
      if (typeof Audio !== 'undefined') {
        this.backgroundMusic = new Audio('/assets/audio/background_music.mp3'); 
        this.backgroundMusic.loop = true;
  
        this.gameOverSound = new Audio('/assets/audio/game_over.wav'); 
        this.clickSound = new Audio('/assets/audio/click.wav'); 
        this.jumpSound = new Audio('/assets/audio/jump.wav');
      } else {
        console.warn("Web Audio API not available. Sounds will be disabled.");
        this.soundsEnabled = false;
      }
    }
  
    playBackgroundMusic() {
      if (this.soundsEnabled && this.backgroundMusic && this.backgroundMusic.paused) {
        this.backgroundMusic.play().catch(e => console.error("Error playing background music:", e));
      }
    }
  
    stopBackgroundMusic() {
      if (this.soundsEnabled && this.backgroundMusic) {
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
      }
    }
  
    playGameOverSound() {
      if (this.soundsEnabled && this.gameOverSound) {
        this.gameOverSound.currentTime = 0;
        this.gameOverSound.play().catch(e => console.error("Error playing game over sound:", e));
      }
    }
  
    playClickSound() {
      if (this.soundsEnabled && this.clickSound) {
        this.clickSound.currentTime = 0;
        this.clickSound.play().catch(e => console.error("Error playing click sound:", e));
      }
    }
  
    playJumpSound() {
      if (this.soundsEnabled && this.jumpSound) {
        this.jumpSound.currentTime = 0;
        this.jumpSound.play().catch(e => console.error("Error playing jump sound:", e));
      }
    }
  
    setSoundsEnabled(enabled: boolean) {
      this.soundsEnabled = enabled;
      if (!enabled) {
        this.stopBackgroundMusic();
      }
    }
  }
  
  // Export a singleton instance of AudioManager
  const audioManager = new AudioManager();
  export default audioManager;
  