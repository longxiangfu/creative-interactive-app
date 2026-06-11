'use client';

import { Position } from '@/types';
import styles from './LoginScene.module.css';

interface LoginSceneProps {
  onMouseInteraction: (mousePos: Position) => void;
  onClickReaction: (clickPos: Position) => void;
  onIdle: () => void;
}

export default function LoginScene({ onMouseInteraction, onClickReaction, onIdle }: LoginSceneProps) {
  return (
    <div
      className={styles.container}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onMouseInteraction({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onClickReaction({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseLeave={onIdle}
    >
      <div className={styles.hint}>
        <span className={styles.hintIcon}>🖱️</span>
        <p>移动鼠标与角色互动</p>
        <p className={styles.subHint}>靠近角色 → 躲避 | 远离角色 → 跟随 | 点击角色 → 惊讶</p>
      </div>
    </div>
  );
}
