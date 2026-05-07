'use client';

import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { ActionType, Position } from '@/types';
import { ResourceManager } from '@/engine/ResourceManager';
import { Animator } from '@/engine/Animator';
import { ActionSystem } from '@/engine/ActionSystem';
import { CharacterEngine } from '@/engine/CharacterEngine';
import styles from './CharacterStage.module.css';

export interface CharacterStageHandle {
  triggerAction: (action: ActionType) => void;
  updatePosition: (pos: Position) => void;
  getPosition: () => Position;
  getEngine: () => CharacterEngine | null;
}

interface CharacterStageProps {
  onPositionUpdate?: (pos: Position) => void;
}

const CharacterStage = forwardRef<CharacterStageHandle, CharacterStageProps>(
  function CharacterStage({ onPositionUpdate }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<CharacterEngine | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rm = new ResourceManager();
      const animator = new Animator();
      const actionSystem = new ActionSystem();
      const engine = new CharacterEngine(rm, animator, actionSystem);

      engine.initCharacter(canvas);
      engineRef.current = engine;

      rm.preloadAssets().then(() => {
        const spriteImage = rm.getAsset('sprite-sheet');
        const spriteData = rm.getSpriteData();
        if (spriteImage && spriteData) {
          animator.init(canvas, spriteImage, spriteData);
        }
      });

      return () => {
        engine.destroy();
        engineRef.current = null;
      };
    }, []);

    useImperativeHandle(ref, () => ({
      triggerAction: (action: ActionType) => {
        if (engineRef.current) {
          engineRef.current.triggerAction(action);
        }
      },
      updatePosition: (pos: Position) => {
        if (engineRef.current) {
          engineRef.current.setPosition(pos);
        }
        if (onPositionUpdate) onPositionUpdate(pos);
      },
      getPosition: (): Position => {
        if (engineRef.current) {
          return engineRef.current.getPosition();
        }
        return { x: 300, y: 200 };
      },
      getEngine: () => engineRef.current,
    }), [onPositionUpdate]);

    return (
      <div className={styles.stage}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={600}
          height={400}
        />
      </div>
    );
  }
);

export default CharacterStage;
