import { useRef, useEffect } from 'react';
import { Position, ActionType } from '@/types';
import { MOUSE_INTERACTION_CONFIG } from '@/config/appConfig';

interface MouseInteractionCallbacks {
  onTriggerAction: (action: ActionType) => void;
  onPositionUpdate: (pos: Position) => void;
  getCharacterPosition: () => Position;
}

export function useMouseInteraction(callbacks: MouseInteractionCallbacks) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const currentModeRef = useRef<'idle' | 'follow' | 'dodge'>('idle');
  const config = MOUSE_INTERACTION_CONFIG;

  const computeTarget = (mousePos: Position) => {
    const { getCharacterPosition, onPositionUpdate, onTriggerAction } = callbacksRef.current;
    const charPos = getCharacterPosition();
    const dx = mousePos.x - charPos.x;
    const dy = mousePos.y - charPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const isDodging = currentModeRef.current === 'dodge';
    const shouldDodge = isDodging
      ? distance < config.dodgeThreshold * 1.5
      : distance < config.dodgeThreshold;

    if (shouldDodge) {
      const safeDist = distance || 1;
      const dirX = (charPos.x - mousePos.x) / safeDist;
      const dirY = (charPos.y - mousePos.y) / safeDist;
      const dodgeDist = config.dodgeThreshold + 30;
      const targetX = mousePos.x + dirX * dodgeDist;
      const targetY = mousePos.y + dirY * dodgeDist;

      const jumpX = Math.max(-config.maxJumpPerFrame, Math.min(config.maxJumpPerFrame, targetX - charPos.x));
      const jumpY = Math.max(-config.maxJumpPerFrame, Math.min(config.maxJumpPerFrame, targetY - charPos.y));
      onPositionUpdate({ x: charPos.x + jumpX, y: charPos.y + jumpY });

      if (currentModeRef.current !== 'dodge') {
        currentModeRef.current = 'dodge';
        onTriggerAction('dodge');
      }
    } else {
      const targetX = charPos.x + dx * config.followSpeed;
      const targetY = charPos.y + dy * config.followSpeed;
      onPositionUpdate({ x: targetX, y: targetY });

      if (currentModeRef.current !== 'follow') {
        currentModeRef.current = 'follow';
        onTriggerAction('follow');
      }
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        currentModeRef.current = 'idle';
        callbacksRef.current.onTriggerAction('idle');
      }
    };
    const handleBlur = () => {
      currentModeRef.current = 'idle';
      callbacksRef.current.onTriggerAction('idle');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return {
    handleMouseMove: (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      computeTarget(mousePos);
    },
    handleMouseClick: (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const charPos = callbacksRef.current.getCharacterPosition();
      const distance = Math.sqrt(Math.pow(clickPos.x - charPos.x, 2) + Math.pow(clickPos.y - charPos.y, 2));
      if (distance <= config.clickRadius) {
        callbacksRef.current.onTriggerAction('clickReact');
      }
    },
    handleMouseLeave: () => {
      currentModeRef.current = 'idle';
      callbacksRef.current.onTriggerAction('idle');
    },
  };
}
