export type ActionType =
  | 'idle'
  | 'follow'
  | 'dodge'
  | 'clickReact'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'jump'
  | 'rotate'
  | 'wave'
  | 'clap'
  | 'think'
  | 'fear'
  | 'complete';

export enum ActionState {
  IDLE = 'idle',
  PLAYING = 'playing',
  TRANSITIONING = 'transitioning',
  INTERRUPTED = 'interrupted',
}

export type LoginSubMode = 'simple' | 'userLogin';

export type SceneType = 'login' | 'reading';

export interface Position {
  x: number;
  y: number;
}

export interface ActionFrames {
  startFrame: number;
  frameCount: number;
  duration: number;
  loop: boolean;
  interruptible: boolean;
}

export interface SpriteData {
  characterId: string;
  frameWidth: number;
  frameHeight: number;
  actions: Record<string, ActionFrames>;
}

export interface ActionDefinition {
  type: ActionType;
  label: string;
  duration: number;
  loop: boolean;
  interruptible: boolean;
  transitionDuration: number;
  priority: number;
}

export interface SemanticMapping {
  keywords: string[];
  actionType: ActionType;
  matchMode: 'exact' | 'contains';
}

export interface TextField {
  text: string;
  startIndex: number;
  endIndex: number;
  isHighlight: boolean;
}

export type ReadingState = 'idle' | 'reading' | 'paused' | 'completed';

export interface ReadingProgress {
  current: number;
  total: number;
  percentage: number;
}

export interface CharacterConfig {
  id: string;
  name: string;
  spriteSheetPath: string;
  spriteDataPath: string;
  fallbackPath: string;
  defaultWidth: number;
  defaultHeight: number;
}

export interface CharacterState {
  position: Position;
  currentAction: ActionType;
  actionState: ActionState;
  direction: Position;
}

export interface MouseInteractionConfig {
  dodgeThreshold: number;
  clickRadius: number;
  followSpeed: number;
  dodgeSpeed: number;
  maxJumpPerFrame: number;
}

export interface TextReadingConfig {
  maxTextLength: number;
  readingSpeed: number;
}

export interface SceneConfig {
  type: SceneType;
  label: string;
  description: string;
}

export interface ActionContext {
  currentAction: ActionType;
  currentState: ActionState;
  actionStartTime: number;
  transitionFrom: ActionType | null;
  transitionProgress: number;
}

export interface AppState {
  appReady: boolean;
  resourceLoadProgress: number;
  resourceLoadError: string | null;
  currentScene: SceneType;
  characterState: CharacterState;
  readingState: ReadingState;
  readingProgress: ReadingProgress;
  browserCompatible: boolean;
}

export interface AppContextValue extends AppState {
  switchScene: (scene: SceneType) => void;
  triggerAction: (action: ActionType) => void;
}

export interface ICharacterEngine {
  initCharacter(canvas: HTMLCanvasElement): void;
  triggerAction(action: ActionType): void;
  getPosition(): Position;
  setPosition(pos: Position): void;
  getCenter(): Position;
  resetToIdle(): void;
  destroy(): void;
  getState(): CharacterState;
}

export interface IActionSystem {
  playAction(action: ActionType): void;
  interruptAction(newAction: ActionType): boolean;
  transitionTo(action: ActionType, duration: number): void;
  getIdleAction(): ActionType;
  getContext(): ActionContext;
  canInterrupt(newAction: ActionType): boolean;
}

export interface ISemanticMapper {
  matchSemantic(field: string): ActionType | null;
  getActionForSemantic(keyword: string): ActionType | null;
  addMapping(mapping: SemanticMapping): void;
}

export interface IAnimator {
  start(): void;
  stop(): void;
  renderFrame(timestamp: number): void;
  interpolate(from: Position, to: Position, t: number): Position;
  getFPS(): number;
}

export interface IResourceManager {
  preloadAssets(): Promise<void>;
  getAsset(id: string): HTMLImageElement | null;
  getSpriteData(): SpriteData | null;
  getLoadProgress(): number;
  isReady(): boolean;
  handleLoadError(id: string): void;
}
