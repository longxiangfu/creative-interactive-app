import { IResourceManager, SpriteData, ActionFrames } from '@/types';
import { DEFAULT_CHARACTER_CONFIG } from '@/config/appConfig';

export class ResourceManager implements IResourceManager {
  private spriteImage: HTMLImageElement | null = null;
  private fallbackImage: HTMLImageElement | null = null;
  private spriteData: SpriteData | null = null;
  private loadProgress = 0;
  private ready = false;
  private loadError: string | null = null;
  private readonly LOAD_TIMEOUT = 3000;

  async preloadAssets(): Promise<void> {
    try {
      const results = await Promise.allSettled([
        this.loadImage(DEFAULT_CHARACTER_CONFIG.spriteSheetPath),
        this.loadImage(DEFAULT_CHARACTER_CONFIG.fallbackPath),
        this.loadJson(DEFAULT_CHARACTER_CONFIG.spriteDataPath),
      ]);

      if (results[0].status === 'fulfilled') {
        this.spriteImage = results[0].value;
      } else {
        this.handleLoadError('sprite-sheet');
      }

      if (results[1].status === 'fulfilled') {
        this.fallbackImage = results[1].value;
      }

      if (results[2].status === 'fulfilled') {
        this.spriteData = results[2].value as SpriteData;
      }

      this.loadProgress = 1;
      this.ready = true;
    } catch {
      this.handleLoadError('preload');
      this.loadProgress = 1;
      this.ready = true;
    }
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        reject(new Error(`Load timeout: ${src}`));
      }, this.LOAD_TIMEOUT);
      img.onload = () => { clearTimeout(timeout); resolve(img); };
      img.onerror = () => { clearTimeout(timeout); reject(new Error(`Load failed: ${src}`)); };
      img.src = src;
    });
  }

  private async loadJson(src: string): Promise<unknown> {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('JSON load timeout')), this.LOAD_TIMEOUT)
    );
    const fetchPromise = fetch(src).then((r) => r.json());
    return Promise.race([fetchPromise, timeoutPromise]);
  }

  getAsset(id: string): HTMLImageElement | null {
    if (id === 'sprite-sheet') return this.spriteImage || this.fallbackImage;
    if (id === 'fallback') return this.fallbackImage;
    return this.spriteImage || this.fallbackImage;
  }

  getSpriteData(): SpriteData | null {
    return this.spriteData;
  }

  getLoadProgress(): number {
    return this.loadProgress;
  }

  isReady(): boolean {
    return this.ready;
  }

  handleLoadError(id: string): void {
    this.loadError = `Resource load error: ${id}`;
    console.warn(`[ResourceManager] Load error for: ${id}, using fallback`);
    if (!this.spriteImage && this.fallbackImage) {
      this.spriteImage = this.fallbackImage;
    }
  }

  getLoadError(): string | null {
    return this.loadError;
  }

  checkBrowserCompatibility(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      if (typeof CSS === 'undefined' || !CSS.supports) return true;
      return CSS.supports('animation', 'none');
    } catch {
      return false;
    }
  }
}
