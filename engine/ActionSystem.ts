import { IActionSystem, ActionType, ActionContext, ActionState } from '@/types';
import { ACTION_DEFINITIONS } from '@/config/actions';

export class ActionSystem implements IActionSystem {
  private context: ActionContext = {
    currentAction: 'idle',
    currentState: ActionState.IDLE,
    actionStartTime: 0,
    transitionFrom: null,
    transitionProgress: 0,
  };
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private onActionChange: ((action: ActionType) => void) | null = null;

  setOnActionChange(cb: (action: ActionType) => void): void {
    this.onActionChange = cb;
  }

  playAction(action: ActionType): void {
    const def = ACTION_DEFINITIONS[action];
    if (!def) return;

    if (this.context.currentAction === action && this.context.currentState === ActionState.PLAYING) return;

    if (this.context.currentState === ActionState.PLAYING || this.context.currentState === ActionState.TRANSITIONING) {
      if (!this.canInterrupt(action)) return;
      this.context.currentState = ActionState.INTERRUPTED;
    }

    this.clearTimeout();
    this.context.currentAction = action;
    this.context.currentState = ActionState.PLAYING;
    this.context.actionStartTime = performance.now();
    this.context.transitionFrom = null;
    this.context.transitionProgress = 1;

    if (this.onActionChange) this.onActionChange(action);

    if (!def.loop) {
      this.timeoutTimer = setTimeout(() => {
        if (this.context.currentAction === action) {
          this.resetToIdle();
        }
      }, def.duration * 2);
    }
  }

  interruptAction(newAction: ActionType): boolean {
    if (!this.canInterrupt(newAction)) return false;
    this.context.currentState = ActionState.INTERRUPTED;
    this.playAction(newAction);
    return true;
  }

  transitionTo(action: ActionType, duration: number): void {
    const clampedDuration = Math.min(duration, 500);
    this.context.transitionFrom = this.context.currentAction;
    this.context.transitionProgress = 0;
    this.context.currentState = ActionState.TRANSITIONING;
    this.playAction(action);
    this.context.transitionProgress = 0;

    const startTime = performance.now();
    const tick = () => {
      const elapsed = performance.now() - startTime;
      this.context.transitionProgress = Math.min(elapsed / clampedDuration, 1);
      if (this.context.transitionProgress < 1) {
        requestAnimationFrame(tick);
      } else {
        this.context.currentState = ActionState.PLAYING;
        this.context.transitionFrom = null;
      }
    };
    requestAnimationFrame(tick);
  }

  canInterrupt(newAction: ActionType): boolean {
    const newDef = ACTION_DEFINITIONS[newAction];
    const curDef = ACTION_DEFINITIONS[this.context.currentAction];
    if (!newDef || !curDef) return false;
    if (!curDef.interruptible) return false;
    return newDef.priority <= curDef.priority;
  }

  getIdleAction(): ActionType {
    return 'idle';
  }

  getContext(): ActionContext {
    return { ...this.context };
  }

  resetToIdle(): void {
    this.clearTimeout();
    this.context.currentAction = 'idle';
    this.context.currentState = ActionState.IDLE;
    this.context.actionStartTime = performance.now();
    this.context.transitionFrom = null;
    this.context.transitionProgress = 1;
    if (this.onActionChange) this.onActionChange('idle');
  }

  private clearTimeout(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  destroy(): void {
    this.clearTimeout();
    this.onActionChange = null;
  }
}
