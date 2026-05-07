import { IAnimator, Position, SpriteData, ActionFrames, ActionState } from '@/types';

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
        this.actionElapsed = 0;
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

  private drawFallback(): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const x = this.characterPos.x;
    const y = this.characterPos.y;
    const breathe = Math.sin(this.globalTime / 800) * 3;

    ctx.save();
    ctx.translate(0, breathe);

    if (this.currentAction === 'dodge' || this.currentAction === 'fear') {
      ctx.translate(x, y);
      ctx.scale(0.85, 1.15);
      ctx.translate(-x, -y);
    }
    if (this.currentAction === 'jump') {
      ctx.translate(0, -30 * Math.abs(Math.sin(this.globalTime / 200)));
    }
    if (this.currentAction === 'rotate') {
      ctx.translate(x, y);
      ctx.rotate((this.globalTime / 160) % (Math.PI * 2));
      ctx.translate(-x, -y);
    }

    ctx.beginPath();
    ctx.arc(x, y, 50, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y + 5, 35, 0, Math.PI);
    ctx.fillStyle = '#fef3c7';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x - 15, y - 12, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 17, y - 14, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + 15, y - 12, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 13, y - 14, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    if (this.currentAction === 'happy' || this.currentAction === 'clap' || this.currentAction === 'complete') {
      ctx.beginPath();
      ctx.arc(x, y + 10, 14, 0.1, Math.PI - 0.1);
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (this.currentAction === 'sad') {
      ctx.beginPath();
      ctx.arc(x, y + 20, 14, Math.PI + 0.1, -0.1);
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x - 22, y + 2, 3, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#60a5fa';
      ctx.fill();
    } else if (this.currentAction === 'surprised' || this.currentAction === 'clickReact') {
      ctx.beginPath();
      ctx.ellipse(x, y + 12, 8, 10, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (this.currentAction === 'angry') {
      ctx.beginPath();
      ctx.moveTo(x - 10, y + 12);
      ctx.lineTo(x + 10, y + 12);
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (this.currentAction === 'fear') {
      ctx.beginPath();
      ctx.ellipse(x, y + 10, 6, 8, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x - 8, y + 12);
      ctx.quadraticCurveTo(x, y + 18, x + 8, y + 12);
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (this.currentAction === 'angry') {
      ctx.beginPath();
      ctx.moveTo(x - 22, y - 24);
      ctx.lineTo(x - 8, y - 18);
      ctx.moveTo(x + 22, y - 24);
      ctx.lineTo(x + 8, y - 18);
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    if (this.currentAction === 'wave' || this.currentAction === 'complete') {
      const waveAngle = Math.sin(this.globalTime / 150) * 0.5;
      ctx.save();
      ctx.translate(x + 45, y - 10);
      ctx.rotate(waveAngle - 0.5);
      ctx.beginPath();
      ctx.roundRect(-5, -3, 10, 25, 5);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    if (this.currentAction === 'think') {
      ctx.font = '24px serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('\u{1F4AD}', x + 40, y - 35);
    }

    if (this.currentAction === 'follow') {
      ctx.beginPath();
      ctx.moveTo(x - 20, y + 22);
      ctx.quadraticCurveTo(x, y + 30, x + 20, y + 22);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();
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
