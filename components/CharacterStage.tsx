'use client';

import { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import { ActionType, Position, CollisionEvent } from '@/types';
import { MultiCharacterRenderer } from '@/engine/MultiCharacterRenderer';
import { SoundManager } from '@/engine/SoundManager';
import CharacterSwitcher from './CharacterSwitcher';
import styles from './CharacterStage.module.css';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

export interface CharacterStageHandle {
  triggerAction: (action: ActionType) => void;
  updatePosition: (pos: Position) => void;
  getPosition: () => Position;
  setEyeDirection: (dir: -1 | 0 | 1) => void;
  setCharacterTypes: (types: string[]) => void;
  resetToCenter: () => void;
  setEyeTrack: (track: Position | null) => void;
  updateMouseInteraction: (mousePos: Position) => void;
  triggerClickReaction: (clickPos: Position) => void;
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
    const [zoomLevel, setZoomLevel] = useState(1);
    const stageContainerRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
      const renderer = rendererRef.current;
      if (!renderer) return;
      renderer.setDrawScale(zoomLevel);
    }, [zoomLevel]);

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
      updateMouseInteraction: (mousePos: Position) => {
        if (rendererRef.current) {
          rendererRef.current.updateMouseInteraction(mousePos);
        }
      },
      triggerClickReaction: (clickPos: Position) => {
        if (rendererRef.current) {
          rendererRef.current.triggerClickReaction(clickPos);
        }
      },
    }), [onPositionUpdate, onCollision]);

    const handleZoomIn = useCallback(() => {
      setZoomLevel((prev) => Math.min(prev + 0.25, 1.75));
    }, []);

    const handleZoomOut = useCallback(() => {
      setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
    }, []);

    const handleZoomReset = useCallback(() => {
      setZoomLevel(1);
    }, []);

    return (
      <div className={styles.stage} ref={stageContainerRef}>
        <div className={styles.zoomControls}>
          <button className={styles.zoomBtn} onClick={handleZoomIn} title="放大">＋</button>
          <span className={styles.zoomLabel}>{Math.round(zoomLevel * 100)}%</span>
          <button className={styles.zoomBtn} onClick={handleZoomOut} title="缩小">－</button>
          {zoomLevel !== 1 && (
            <button className={styles.zoomResetBtn} onClick={handleZoomReset} title="重置">↺</button>
          )}
        </div>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        />
        <CharacterSwitcher selectedTypes={characterTypes} onSwitch={onCharacterTypesChange || (() => {})} />
      </div>
    );
  }
);

export default CharacterStage;
