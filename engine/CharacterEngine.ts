import { ICharacterEngine, CharacterState, ActionType, Position, ActionState } from '@/types';
import { ResourceManager } from './ResourceManager';
import { Animator } from './Animator';
import { ActionSystem } from './ActionSystem';
import { DEFAULT_CHARACTER_CONFIG } from '@/config/appConfig';
import { ACTION_DEFINITIONS } from '@/config/actions';

export class CharacterEngine implements ICharacterEngine {
  private resourceManager: ResourceManager;
  private animator: Animator;
  private actionSystem: ActionSystem;
  private state: CharacterState;
  private initialized = false;

  constructor(resourceManager: ResourceManager, animator: Animator, actionSystem: ActionSystem) {
    this.resourceManager = resourceManager;
    this.animator = animator;
    this.actionSystem = actionSystem;
    this.state = {
      position: { x: 0, y: 0 },
      currentAction: 'idle',
      actionState: ActionState.IDLE,
      direction: { x: 0, y: 0 },
    };

    this.actionSystem.setOnActionChange((action) => {
      this.state.currentAction = action;
      const def = ACTION_DEFINITIONS[action];
      if (def) {
        this.animator.setAction(action, def.transitionDuration);
      }
    });
  }

  initCharacter(canvas: HTMLCanvasElement): void {
    const spriteImage = this.resourceManager.getAsset('sprite-sheet');
    const spriteData = this.resourceManager.getSpriteData();

    this.animator.init(canvas, spriteImage, spriteData);
    this.state.position = { x: canvas.width / 2, y: canvas.height / 2 };
    this.animator.setCharacterPosition(this.state.position);

    this.actionSystem.resetToIdle();
    this.animator.start();
    this.initialized = true;
  }

  triggerAction(action: ActionType): void {
    if (!this.initialized) return;
    if (this.actionSystem.canInterrupt(action)) {
      this.actionSystem.interruptAction(action);
    } else {
      this.actionSystem.playAction(action);
    }
  }

  getPosition(): Position {
    return this.animator.getCharacterPosition();
  }

  setPosition(pos: Position): void {
    this.state.position = pos;
    this.animator.setCharacterPosition(pos);
  }

  getCenter(): Position {
    const config = DEFAULT_CHARACTER_CONFIG;
    return {
      x: this.state.position.x,
      y: this.state.position.y,
    };
  }

  resetToIdle(): void {
    this.actionSystem.resetToIdle();
    this.animator.setAction('idle');
  }

  destroy(): void {
    this.animator.stop();
    this.actionSystem.destroy();
    this.initialized = false;
  }

  getState(): CharacterState {
    return { ...this.state };
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
