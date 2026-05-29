import { CharacterInstance, Position, ActionState, ActionType, CollisionEvent } from '@/types';
import { drawCatFace, drawDogFace, drawRabbitFace, drawRoosterFace, drawPigFace, drawCowFace, drawSheepFace, Emotion, EyeTrack } from '@/utils/drawCharacter';
import { CollisionEngine } from './CollisionEngine';
import { ACTION_DEFINITIONS } from '@/config/actions';

export class MultiCharacterRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private running = false;
  private animationFrameId: number | null = null;
  private lastTimestamp = 0;
  private globalTime = 0;
  private characters: Map<string, CharacterInstance> = new Map();
  private collisionEngine: CollisionEngine;
  private onCollisionCallback: ((event: CollisionEvent) => void) | null = null;
  private homePositions: Map<string, Position> = new Map();
  private homeOffsets: Map<string, Position> = new Map();
  private groupCenter: Position = { x: 300, y: 200 };
  private friction = 0.985;
  private characterRadius = 80;
  private attractStrength = 0.008;

  constructor() {
    this.collisionEngine = new CollisionEngine();
    this.collisionEngine.setOnCollision((e) => {
      if (this.onCollisionCallback) this.onCollisionCallback(e);
    });
  }

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  setOnCollision(cb: (event: CollisionEvent) => void): void {
    this.onCollisionCallback = cb;
  }

  setCharacters(types: string[]): void {
    if (!this.canvas) return;
    const newTypesSet = new Set(types);
    for (const [id, char] of this.characters) {
      if (!newTypesSet.has(char.type)) {
        this.characters.delete(id);
        this.homePositions.delete(id);
      }
    }
    const currentTypes = Array.from(this.characters.values()).map(c => c.type);
    const count = types.length;
    for (let i = 0; i < count; i++) {
      const type = types[i];
      if (!currentTypes.includes(type)) {
        const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const angle = (i / count) * Math.PI * 2;
        const dist = count === 1 ? 0 : (120 + i * 40);
        const offsetX = Math.cos(angle) * dist;
        const offsetY = Math.sin(angle) * dist;
        const homeX = this.groupCenter.x + offsetX;
        const homeY = this.groupCenter.y + offsetY;
        this.characters.set(id, {
          id,
          type,
          position: { x: homeX, y: homeY },
          velocity: { x: 0, y: 0 },
          currentAction: 'idle',
          actionState: ActionState.IDLE,
          actionElapsed: 0,
          jumpElapsed: null,
          eyeDirection: 0,
          eyeTrack: null,
          collisionCooldown: 0,
          radius: this.characterRadius,
          freeBounceUntil: 0,
        });
        this.homePositions.set(id, { x: homeX, y: homeY });
        this.homeOffsets.set(id, { x: offsetX, y: offsetY });
      }
    }
  }

  triggerAction(action: ActionType): void {
    for (const char of this.characters.values()) {
      char.currentAction = action;
      char.actionState = ActionState.PLAYING;
      char.actionElapsed = 0;
      if (action === 'jump') char.jumpElapsed = 0;
    }
  }

  triggerActionForCharacter(id: string, action: ActionType): void {
    const char = this.characters.get(id);
    if (char) {
      char.currentAction = action;
      char.actionState = ActionState.PLAYING;
      char.actionElapsed = 0;
      if (action === 'jump') char.jumpElapsed = 0;
    }
  }

  setTargetPosition(id: string, pos: Position): void {
    const char = this.characters.get(id);
    if (char) {
      this.homePositions.set(id, { ...pos });
    }
  }

  updateGroupTarget(center: Position): void {
    this.groupCenter = { ...center };
    for (const [id, offset] of this.homeOffsets) {
      this.homePositions.set(id, {
        x: center.x + offset.x,
        y: center.y + offset.y,
      });
    }
  }

  setEyeDirection(dir: -1 | 0 | 1): void {
    for (const char of this.characters.values()) {
      char.eyeDirection = dir;
    }
  }

  setEyeTrack(track: Position | null): void {
    for (const char of this.characters.values()) {
      char.eyeTrack = track;
    }
  }

  getCharacterPositions(): Map<string, Position> {
    const result = new Map<string, Position>();
    for (const [id, char] of this.characters) {
      result.set(id, { ...char.position });
    }
    return result;
  }

  getFirstCharacterPosition(): Position {
    const first = this.characters.values().next().value;
    return first ? { ...first.position } : { x: 300, y: 200 };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();
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

  private renderFrame(timestamp: number): void {
    if (!this.ctx || !this.canvas) return;
    const delta = Math.min(timestamp - this.lastTimestamp, 100);
    this.lastTimestamp = timestamp;
    this.globalTime += delta;

    for (const [id, char] of this.characters) {
      const isFreeBouncing = char.freeBounceUntil === -1 || this.globalTime < char.freeBounceUntil;
      const speed = Math.sqrt(char.velocity.x * char.velocity.x + char.velocity.y * char.velocity.y);

      if (isFreeBouncing && speed < 0.5) {
        char.freeBounceUntil = 0;
      }

      const home = this.homePositions.get(id);
      if (home && !isFreeBouncing) {
        const dx = home.x - char.position.x;
        const dy = home.y - char.position.y;
        char.velocity.x += dx * this.attractStrength;
        char.velocity.y += dy * this.attractStrength;
      }

      const friction = isFreeBouncing ? 0.998 : this.friction;
      char.velocity.x *= friction;
      char.velocity.y *= friction;
      const maxSpeed = 15;
      const speed2 = Math.sqrt(char.velocity.x * char.velocity.x + char.velocity.y * char.velocity.y);
      if (speed2 > maxSpeed) {
        char.velocity.x = (char.velocity.x / speed2) * maxSpeed;
        char.velocity.y = (char.velocity.y / speed2) * maxSpeed;
      }
      char.position.x += char.velocity.x;
      char.position.y += char.velocity.y;
      char.actionElapsed += delta;
      if (char.jumpElapsed !== null) {
        char.jumpElapsed += delta;
        if (char.jumpElapsed >= 800) char.jumpElapsed = null;
      }
      const def = ACTION_DEFINITIONS[char.currentAction];
      if (def && !def.loop && char.actionElapsed >= def.duration) {
        char.currentAction = 'idle';
        char.actionState = ActionState.IDLE;
        char.actionElapsed = 0;
      }
    }

    const charArray = Array.from(this.characters.values());
    const collisions = this.collisionEngine.detectCollisions(charArray);
    this.collisionEngine.resolveCollisions(charArray, collisions, this.globalTime);
    this.collisionEngine.separateOverlapping(charArray);
    this.collisionEngine.clampToBounds(charArray, this.canvas.width, this.canvas.height);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const char of this.characters.values()) {
      this.drawCharacter(char);
    }
  }

  private getEmotion(action: ActionType): Emotion {
    if (action === 'happy' || action === 'clap' || action === 'complete') return 'happy';
    if (action === 'sad') return 'sad';
    if (action === 'angry') return 'angry';
    if (action === 'surprised' || action === 'clickReact') return 'surprised';
    if (action === 'fear' || action === 'dodge') return 'fear';
    return 'neutral';
  }

  private drawCharacter(char: CharacterInstance): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const x = char.position.x;
    const y = char.position.y;
    const emotion = this.getEmotion(char.currentAction);
    const eyeTrack: EyeTrack | undefined = char.eyeTrack ? { x: Math.max(-1, Math.min(1, char.eyeTrack.x)), y: Math.max(-1, Math.min(1, char.eyeTrack.y)) } : undefined;
    const breathe = Math.sin(this.globalTime / 800) * 3;

    ctx.save();
    ctx.translate(0, breathe);

    if (char.currentAction === 'dodge' || char.currentAction === 'fear') {
      ctx.translate(x, y);
      ctx.scale(0.85, 1.15);
      ctx.translate(-x, -y);
    }
    if (char.jumpElapsed !== null) {
      const t = Math.min(char.jumpElapsed / 800, 1);
      const jumpHeight = 30 * Math.sin(t * Math.PI) * (1 - t * 0.3);
      ctx.translate(0, -jumpHeight);
    }
    if (char.currentAction === 'rotate') {
      ctx.translate(x, y);
      ctx.rotate((this.globalTime / 160) % (Math.PI * 2));
      ctx.translate(-x, -y);
    }
    if (char.currentAction === 'lookRight') {
      ctx.translate(15, 0);
      ctx.translate(x, y);
      ctx.rotate(0.25);
      ctx.translate(-x, -y);
    }
    if (char.currentAction === 'lookLeft') {
      ctx.translate(-15, 0);
      ctx.translate(x, y);
      ctx.rotate(-0.25);
      ctx.translate(-x, -y);
    }

    if (char.type === 'cat') drawCatFace(ctx, x, y, 2, emotion, eyeTrack);
    else if (char.type === 'dog') drawDogFace(ctx, x, y, 2, emotion, eyeTrack);
    else if (char.type === 'rabbit') drawRabbitFace(ctx, x, y, 2, emotion, eyeTrack);
    else if (char.type === 'rooster') drawRoosterFace(ctx, x, y, 2, emotion, eyeTrack);
    else if (char.type === 'pig') drawPigFace(ctx, x, y, 2, emotion, eyeTrack);
    else if (char.type === 'cow') drawCowFace(ctx, x, y, 2, emotion, eyeTrack);
    else if (char.type === 'sheep') drawSheepFace(ctx, x, y, 2, emotion, eyeTrack);
    else drawCatFace(ctx, x, y, 2, emotion, eyeTrack);

    if (char.currentAction === 'think') {
      ctx.font = '48px serif';
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('\u{1F4AD}', x + 100, y - 80);
    }
    if (char.currentAction === 'happy' || char.currentAction === 'clap' || char.currentAction === 'complete') {
      ctx.font = '40px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('✨', x + 70, y - 60);
      ctx.fillText('✨', x - 80, y - 50);
    }
    if (char.currentAction === 'sad') {
      ctx.font = '40px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('💧', x - 70, y - 10);
    }
    if (char.currentAction === 'angry') {
      ctx.font = '36px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('💢', x + 60, y - 70);
    }
    if (char.currentAction === 'surprised' || char.currentAction === 'clickReact') {
      ctx.font = '36px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('‼️', x + 70, y - 60);
    }
    if (char.currentAction === 'follow') {
      ctx.font = '36px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('💕', x + 60, y - 60);
    }
    if (char.currentAction === 'wave') {
      const waveOffset = Math.sin(this.globalTime / 150) * 15;
      ctx.translate(x + 80, y - 40);
      ctx.rotate(waveOffset * 0.05);
      ctx.translate(-x - 80, -(y - 40));
      ctx.font = '48px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👋', x + 80, y - 40);
    }
    if (char.currentAction === 'clap') {
      const clapScale = 1 + Math.sin(this.globalTime / 100) * 0.2;
      ctx.translate(x + 70, y - 50);
      ctx.scale(clapScale, clapScale);
      ctx.translate(-x - 70, -(y - 50));
    }

    ctx.restore();
  }

  updateGroupCenter(): void {
    if (!this.canvas) return;
    this.groupCenter = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
    for (const [id, offset] of this.homeOffsets) {
      this.homePositions.set(id, {
        x: this.groupCenter.x + offset.x,
        y: this.groupCenter.y + offset.y,
      });
    }
  }

  resetToCenter(): void {
    this.updateGroupCenter();
    for (const [id, char] of this.characters) {
      const home = this.homePositions.get(id);
      if (home) {
        char.position.x = home.x;
        char.position.y = home.y;
        char.velocity.x = 0;
        char.velocity.y = 0;
      }
    }
  }

  destroy(): void {
    this.stop();
    this.characters.clear();
    this.homePositions.clear();
    this.homeOffsets.clear();
  }
}
