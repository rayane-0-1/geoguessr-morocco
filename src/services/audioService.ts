import { MonumentSoundCategory } from "../types";

class AudioService {
  private players: Map<MonumentSoundCategory, HTMLAudioElement> = new Map();
  private currentCategory: MonumentSoundCategory | null = null;
  private fadeInterval: any = null;
  private userInteracted = false;

  private readonly SOUND_URLS: Record<MonumentSoundCategory, string> = {
    coastal: "https://www.soundjay.com/nature/sounds/ocean-waves-1.mp3",
    medina: "https://www.soundjay.com/misc/sounds/busy-street-1.mp3",
    desert: "https://www.soundjay.com/transportation/sounds/desert-wind-1.mp3",
    nature: "https://www.soundjay.com/nature/sounds/river-1.mp3"
  };

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("click", () => {
        this.userInteracted = true;
      }, { once: true });
    }
  }

  private getPlayer(category: MonumentSoundCategory): HTMLAudioElement {
    let player = this.players.get(category);
    if (!player) {
      player = new Audio(this.SOUND_URLS[category]);
      player.loop = true;
      player.volume = 0;
      this.players.set(category, player);
    }
    return player;
  }

  public async play(category: MonumentSoundCategory) {
    if (this.currentCategory === category) return;
    if (!this.userInteracted) return;

    const oldCategory = this.currentCategory;
    this.currentCategory = category;

    const nextPlayer = this.getPlayer(category);
    
    try {
      await nextPlayer.play();
      this.fade(nextPlayer, 0.15, true); // Target volume 0.15 for subtle ambience

      if (oldCategory) {
        const prevPlayer = this.players.get(oldCategory);
        if (prevPlayer) {
          this.fade(prevPlayer, 0, false);
        }
      }
    } catch (error) {
      console.warn("Audio playback failed (interaction required):", error);
    }
  }

  public stop() {
    if (this.currentCategory) {
      const player = this.players.get(this.currentCategory);
      if (player) {
        this.fade(player, 0, false);
      }
      this.currentCategory = null;
    }
  }

  private fade(player: HTMLAudioElement, targetVolume: number, shouldKeepPlaying: boolean) {
    const step = 0.01;
    const interval = 50;
    
    if (this.fadeInterval) clearInterval(this.fadeInterval);

    this.fadeInterval = setInterval(() => {
      if (player.volume < targetVolume) {
        player.volume = Math.min(targetVolume, player.volume + step);
      } else if (player.volume > targetVolume) {
        player.volume = Math.max(targetVolume, player.volume - step);
      }

      if (player.volume === targetVolume) {
        clearInterval(this.fadeInterval);
        if (targetVolume === 0 && !shouldKeepPlaying) {
          player.pause();
        }
      }
    }, interval);
  }
}

export const audioService = new AudioService();
