'use client';

import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { ActionType, Position, CollisionEvent } from '@/types';
import { MultiCharacterRenderer } from '@/engine/MultiCharacterRenderer';
import { SoundManager } from '@/engine/SoundManager';
import CharacterSwitcher from './CharacterSwitcher';
import styles from './CharacterStage.module.css';

export interface CharacterStageHandle {
  triggerAction: (action: ActionType) => void;
  updatePosition: (pos: Position) => void;
  getPosition: () => Position;
  setEyeDirection: (dir: -1 | 0 | 1) => void;
  setCharacterTypes: (types: string[]) => void;
  resetToCenter: () => void;
  setEyeTrack: (track: Position | null) => void;
}

interface CharacterStageProps {
  onPositionUpdate?: (pos: Position) => void;
  characterTypes?: string[];
  onCharacterTypesChange?: (types: string[]) => void;
  onCollision?: (event: CollisionEvent) => void;
}

const CharacterStage = forwardRef<CharacterStageHandle, CharacterStageProps>(
  function CharacterStage({ onPositionUpdate, characterTypes = ['cat'], onCharacterTypesChange, onCollision }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<MultiCharacterRenderer | null>(null);
    const soundManagerRef = useRef<SoundManager | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const soundManager = new SoundManager();
      soundManager.init();
      soundManagerRef.current = soundManager;

      const renderer = new MultiCharacterRenderer();
      renderer.init(canvas);
      renderer.setCharacters(characterTypes);
      renderer.setOnCollision((event) => {
        soundManager.playCollision();
        if (onCollision) onCollision(event);
      });
      renderer.start();
      rendererRef.current = renderer;

      return () => {
        renderer.destroy();
        soundManager.destroy();
        rendererRef.current = null;
        soundManagerRef.current = null;
      };
    }, []);

    useEffect(() => {
      if (rendererRef.current) {
        rendererRef.current.setCharacters(characterTypes);
      }
    }, [characterTypes]);

    useImperativeHandle(ref, () => ({
      triggerAction: (action: ActionType) => {
        if (rendererRef.current) {
          rendererRef.current.triggerAction(action);
        }
      },
      updatePosition: (pos: Position) => {
        if (rendererRef.current) {
          rendererRef.current.updateGroupTarget(pos);
        }
        if (onPositionUpdate) onPositionUpdate(pos);
      },
      getPosition: (): Position => {
        if (rendererRef.current) {
          return rendererRef.current.getFirstCharacterPosition();
        }
        return { x: 300, y: 200 };
      },
      setEyeDirection: (dir: -1 | 0 | 1) => {
        if (rendererRef.current) {
          rendererRef.current.setEyeDirection(dir);
        }
      },
      setCharacterTypes: (types: string[]) => {
        if (rendererRef.current) {
          rendererRef.current.setCharacters(types);
        }
      },
      resetToCenter: () => {
        if (rendererRef.current) {
          rendererRef.current.resetToCenter();
        }
      },
      setEyeTrack: (track: Position | null) => {
        if (rendererRef.current) {
          rendererRef.current.setEyeTrack(track);
        }
      },
    }), [onPositionUpdate, onCollision]);

    return (
      <div className={styles.stage}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={600}
          height={400}
        />
        <CharacterSwitcher selectedTypes={characterTypes} onSwitch={onCharacterTypesChange || (() => {})} />
      </div>
    );
  }
);

export default CharacterStage;
