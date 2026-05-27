import { IAnimator, Position, SpriteData, ActionFrames, ActionState } from '@/types';
import { drawCatFace, drawDogFace, drawRabbitFace, drawRoosterFace, drawPigFace, drawCowFace, drawSheepFace, Emotion } from '@/utils/drawCharacter';

export class Animator implements IAnimator {
  private running = false;
  private animationFrameId: number | null = null;
  private lastTimestamp = 0;
  private frameCount = 0;
  private fpsAccumulator = 0;
  private currentFPS = 60;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private spriteImage: HTMLImageElement | null = null;
  private spriteData: SpriteData | null = null;
  private currentAction: string = 'idle';
  private currentFrameIndex = 0;
  private actionElapsed = 0;
  private actionState: ActionState = ActionState.IDLE;
  private transitionFrom: string | null = null;
  private transitionProgress = 0;
  private transitionDuration = 200;
  private characterPos: Position = { x: 300, y: 200 };
  private targetPos: Position = { x: 300, y: 200 };
  private positionSmoothing = 5;
  private onFrameCallback: ((pos: Position) => void) | null = null;
  private globalTime = 0;
  private eyeDirection: -1 | 0 | 1 = 0;
  private characterType: string = 'cat';
  private jumpElapsed: number | null = null;

  init(canvas: HTMLCanvasElement, spriteImage: HTMLImageElement | null, spriteData: SpriteData | null): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.spriteImage = spriteImage;
    this.spriteData = spriteData;
    this.characterPos = { x: canvas.width / 2, y: canvas.height / 2 };
    this.targetPos = { ...this.characterPos };
  }

  setCharacterPosition(pos: Position): void {
    this.targetPos = pos;
  }

  getCharacterPosition(): Position {
    return { ...this.characterPos };
  }

  setAction(action: string, transitionDuration = 200): void {
    if (this.currentAction === action && this.actionState === ActionState.PLAYING) return;
    if (this.currentAction !== action) {
      this.transitionFrom = this.currentAction;
      this.transitionProgress = 0;
      this.transitionDuration = Math.min(transitionDuration, 500);
    }
    this.currentAction = action;
    this.currentFrameIndex = 0;
    this.actionElapsed = 0;
    if (this.transitionFrom && this.transitionFrom !== action) {
      this.actionState = ActionState.TRANSITIONING;
    } else {
      this.actionState = ActionState.PLAYING;
      this.transitionFrom = null;
    }
  }

  setOnFrameCallback(cb: (pos: Position) => void): void {
    this.onFrameCallback = cb;
  }

  setEyeDirection(dir: -1 | 0 | 1): void {
    this.eyeDirection = dir;
  }

  setCharacterType(type: string): void {
    this.characterType = type;
  }

  triggerJump(): void {
    this.jumpElapsed = 0;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.actionState = ActionState.PLAYING;
    this.loop(this.lastTimestamp);
  }

  stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (timestamp: number): void => {
    if (!this.running) return;
    this.renderFrame(timestamp);
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  renderFrame(timestamp: number): void {
    if (!this.ctx || !this.canvas) return;
    const delta = Math.min(timestamp - this.lastTimestamp, 100);
    this.lastTimestamp = timestamp;
    this.globalTime += delta;

    const deltaSeconds = Math.min(delta, 100) / 1000;
    const lerpFactor = 1 - Math.exp(-this.positionSmoothing * deltaSeconds);
    this.characterPos.x += (this.targetPos.x - this.characterPos.x) * lerpFactor;
    this.characterPos.y += (this.targetPos.y - this.characterPos.y) * lerpFactor;

    if (this.jumpElapsed !== null) {
      this.jumpElapsed += delta;
      if (this.jumpElapsed >= 800) {
        this.jumpElapsed = null;
      }
    }

    this.frameCount++;
    this.fpsAccumulator += delta;
    if (this.fpsAccumulator >= 1000) {
      this.currentFPS = this.frameCount;
      this.frameCount = 0;
      this.fpsAccumulator = 0;
    }

    this.actionElapsed += delta;

    if (this.actionState === ActionState.TRANSITIONING) {
      this.transitionProgress += delta / this.transitionDuration;
      if (this.transitionProgress >= 1.0) {
        this.transitionProgress = 1.0;
        this.actionState = ActionState.PLAYING;
        this.transitionFrom = null;
      }
    }

    const frames = this.getCurrentActionFrames();
    if (frames) {
      const frameDuration = frames.duration / frames.frameCount;
      if (this.actionElapsed >= frameDuration) {
        this.actionElapsed = 0;
        this.currentFrameIndex++;
        if (this.currentFrameIndex >= frames.frameCount) {
          if (frames.loop) {
            this.currentFrameIndex = 0;
          } else {
            this.currentFrameIndex = frames.frameCount - 1;
            if (this.actionState === ActionState.PLAYING) {
              this.setAction('idle');
            }
          }
        }
      }
    } else {
      if (this.actionElapsed >= 500) {
        this.actionElapsed = 500;
        this.currentFrameIndex++;
      }
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawCurrentFrame();

    if (this.onFrameCallback) {
      this.onFrameCallback(this.characterPos);
    }
  }

  private getCurrentActionFrames(): ActionFrames | null {
    if (!this.spriteData) return null;
    return this.spriteData.actions[this.currentAction] || null;
  }

  private drawCurrentFrame(): void {
    if (!this.ctx || !this.canvas) return;

    if (this.spriteImage && this.spriteData) {
      const frames = this.spriteData.actions[this.currentAction];
      if (frames) {
        const sx = (frames.startFrame + this.currentFrameIndex) * this.spriteData.frameWidth;
        const sy = 0;
        const sw = this.spriteData.frameWidth;
        const sh = this.spriteData.frameHeight;
        const dx = this.characterPos.x - sw / 2;
        const dy = this.characterPos.y - sh / 2;

        if (this.actionState === ActionState.TRANSITIONING && this.transitionFrom) {
          const fromFrames = this.spriteData.actions[this.transitionFrom];
          if (fromFrames) {
            const fsx = (fromFrames.startFrame + 0) * this.spriteData.frameWidth;
            this.ctx.globalAlpha = 1.0 - this.transitionProgress;
            this.ctx.drawImage(this.spriteImage, fsx, sy, sw, sh, dx, dy, sw, sh);
          }
          this.ctx.globalAlpha = this.transitionProgress;
          this.ctx.drawImage(this.spriteImage, sx, sy, sw, sh, dx, dy, sw, sh);
          this.ctx.globalAlpha = 1.0;
          return;
        }
        this.ctx.drawImage(this.spriteImage, sx, sy, sw, sh, dx, dy, sw, sh);
        return;
      }
    }

    this.drawFallback();
  }

  private readonly CHARACTERS: Record<string, string> = {
    cat: '__draw__',
    dog: '__draw__',
    rabbit: '__draw__',
    rooster: '__draw__',
    pig: '__draw__',
    cow: '__draw__',
    sheep: '__draw__',
  };

  private getEmotion(): Emotion {
    if (this.currentAction === 'happy' || this.currentAction === 'clap' || this.currentAction === 'complete') return 'happy';
    if (this.currentAction === 'sad') return 'sad';
    if (this.currentAction === 'angry') return 'angry';
    if (this.currentAction === 'surprised' || this.currentAction === 'clickReact') return 'surprised';
    if (this.currentAction === 'fear' || this.currentAction === 'dodge') return 'fear';
    return 'neutral';
  }

  private drawCharacterFace(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const emotion = this.getEmotion();
    if (this.characterType === 'cat') drawCatFace(ctx, x, y, 1, emotion);
    else if (this.characterType === 'dog') drawDogFace(ctx, x, y, 1, emotion);
    else if (this.characterType === 'rabbit') drawRabbitFace(ctx, x, y, 1, emotion);
    else if (this.characterType === 'rooster') drawRoosterFace(ctx, x, y, 1, emotion);
    else if (this.characterType === 'pig') drawPigFace(ctx, x, y, 1, emotion);
    else if (this.characterType === 'cow') drawCowFace(ctx, x, y, 1, emotion);
    else if (this.characterType === 'sheep') drawSheepFace(ctx, x, y, 1, emotion);
    else drawCatFace(ctx, x, y, 1, emotion);
  }

  private drawFallback(): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const x = this.characterPos.x;
    const y = this.characterPos.y;
    const breathe = Math.sin(this.globalTime / 800) * 3;
    const emoji = this.CHARACTERS[this.characterType] || this.CHARACTERS.cat;

    if (this.currentAction === 'jump' && this.jumpElapsed === null) {
      this.jumpElapsed = 0;
    }

    ctx.save();
    ctx.translate(0, breathe);

    if (this.currentAction === 'dodge' || this.currentAction === 'fear') {
      ctx.translate(x, y);
      ctx.scale(0.85, 1.15);
      ctx.translate(-x, -y);
    }
    if (this.jumpElapsed !== null) {
      const t = Math.min(this.jumpElapsed / 800, 1);
      const jumpHeight = 30 * Math.sin(t * Math.PI) * (1 - t * 0.3);
      ctx.translate(0, -jumpHeight);
    }
    if (this.currentAction === 'rotate') {
      ctx.translate(x, y);
      ctx.rotate((this.globalTime / 160) % (Math.PI * 2));
      ctx.translate(-x, -y);
    }
    if (this.currentAction === 'lookRight') {
      ctx.translate(15, 0);
      ctx.translate(x, y);
      ctx.rotate(0.25);
      ctx.translate(-x, -y);
    }
    if (this.currentAction === 'lookLeft') {
      ctx.translate(-15, 0);
      ctx.translate(x, y);
      ctx.rotate(-0.25);
      ctx.translate(-x, -y);
    }

    if (emoji === '__draw__') {
      this.drawCharacterFace(ctx, x, y);
    } else {
      const fontSize = 90;
      ctx.font = `${fontSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, x, y);
    }

    if (this.currentAction === 'think') {
      ctx.font = '24px serif';
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('\u{1F4AD}', x + 50, y - 40);
    }

    if (this.currentAction === 'happy' || this.currentAction === 'clap' || this.currentAction === 'complete') {
      ctx.font = '20px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('✨', x + 35, y - 30);
      ctx.fillText('✨', x - 40, y - 25);
    }

    if (this.currentAction === 'sad') {
      ctx.font = '20px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('💧', x - 35, y - 5);
    }

    if (this.currentAction === 'angry') {
      ctx.font = '18px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('💢', x + 30, y - 35);
    }

    if (this.currentAction === 'surprised' || this.currentAction === 'clickReact') {
      ctx.font = '18px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('‼️', x + 35, y - 30);
    }

    if (this.currentAction === 'follow') {
      ctx.font = '18px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('💕', x + 30, y - 30);
    }

    if (this.currentAction === 'wave') {
      const waveOffset = Math.sin(this.globalTime / 150) * 15;
      ctx.translate(x + 40, y - 20);
      ctx.rotate(waveOffset * 0.05);
      ctx.translate(-x - 40, -(y - 20));
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👋', x + 40, y - 20);
    }

    if (this.currentAction === 'clap') {
      const clapScale = 1 + Math.sin(this.globalTime / 100) * 0.2;
      ctx.translate(x + 35, y - 25);
      ctx.scale(clapScale, clapScale);
      ctx.translate(-x - 35, -(y - 25));
    }

    ctx.restore();
  }

  interpolate(from: Position, to: Position, t: number): Position {
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    };
  }

  getFPS(): number {
    return this.currentFPS;
  }

  isActionFinished(): boolean {
    const frames = this.getCurrentActionFrames();
    if (!frames) return true;
    if (frames.loop) return false;
    return this.currentFrameIndex >= frames.frameCount - 1;
  }
}
