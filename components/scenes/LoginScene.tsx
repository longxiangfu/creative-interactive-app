'use client';

import { useMouseInteraction } from '@/hooks/useMouseInteraction';
import { ActionType, Position } from '@/types';
import styles from './LoginScene.module.css';

interface LoginSceneProps {
  onTriggerAction: (action: ActionType) => void;
  onPositionUpdate: (pos: Position) => void;
  getCharacterPosition: () => Position;
}

export default function LoginScene({ onTriggerAction, onPositionUpdate, getCharacterPosition }: LoginSceneProps) {
  const { handleMouseMove, handleMouseClick, handleMouseLeave } = useMouseInteraction({
    onTriggerAction,
    onPositionUpdate,
    getCharacterPosition,
  });

  return (
    <div
      className={styles.container}
      onMouseMove={handleMouseMove}
      onClick={handleMouseClick}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.hint}>
        <span className={styles.hintIcon}>🖱️</span>
        <p>移动鼠标与角色互动</p>
        <p className={styles.subHint}>靠近角色 → 躲避 | 远离角色 → 跟随 | 点击角色 → 惊讶</p>
      </div>
    </div>
  );
}
