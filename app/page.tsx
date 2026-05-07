'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { SceneType, ActionType, Position, LoginSubMode } from '@/types';
import { ResourceManager } from '@/engine/ResourceManager';
import SceneSelector from '@/components/SceneSelector';
import CharacterStage, { CharacterStageHandle } from '@/components/CharacterStage';
import LoginScene from '@/components/scenes/LoginScene';
import ReadingScene from '@/components/scenes/ReadingScene';
import styles from './page.module.css';

export default function HomePage() {
  const [currentScene, setCurrentScene] = useState<SceneType>('login');
  const [loginSubMode, setLoginSubMode] = useState<LoginSubMode>('simple');
  const [appReady, setAppReady] = useState(false);
  const [browserCompatible, setBrowserCompatible] = useState(true);
  const [sceneKey, setSceneKey] = useState(0);
  const stageRef = useRef<CharacterStageHandle>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const rm = new ResourceManager();
    if (!rm.checkBrowserCompatibility()) {
      setBrowserCompatible(false);
      return;
    }
    setAppReady(true);
  }, []);

  const handleSwitchScene = useCallback((target: SceneType) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentScene((prev) => {
        if (prev === target) return prev;
        if (stageRef.current) {
          stageRef.current.triggerAction('idle');
        }
        setSceneKey((k) => k + 1);
        return target;
      });
    }, 500);
  }, []);

  const handleSwitchLoginSubMode = useCallback((mode: LoginSubMode) => {
    setLoginSubMode(mode);
    if (currentScene !== 'login') {
      setCurrentScene('login');
    }
  }, [currentScene]);

  const handleTriggerAction = useCallback((action: ActionType) => {
    if (stageRef.current) {
      stageRef.current.triggerAction(action);
    }
  }, []);

  const handlePositionUpdate = useCallback((pos: Position) => {
    if (stageRef.current) {
      stageRef.current.updatePosition(pos);
    }
  }, []);

  const handleGetPosition = useCallback((): Position => {
    if (stageRef.current) {
      return stageRef.current.getPosition();
    }
    return { x: 300, y: 200 };
  }, []);

  if (!browserCompatible) {
    return (
      <div className={styles.errorScreen}>
        <h2>浏览器不兼容</h2>
        <p>当前浏览器版本过低，请升级后使用</p>
      </div>
    );
  }

  const showLoginInteraction = currentScene === 'login' && loginSubMode === 'simple';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleIcon}>🐾</span>
          创意交互应用
        </h1>
      </header>

      <SceneSelector
        activeScene={currentScene}
        activeLoginSubMode={loginSubMode}
        onSwitchScene={handleSwitchScene}
        onSwitchLoginSubMode={handleSwitchLoginSubMode}
      />

      <main className={styles.main}>
        <div className={styles.stageArea}>
          <CharacterStage ref={stageRef} />
          {showLoginInteraction && (
            <LoginScene
              key={`login-${sceneKey}`}
              onTriggerAction={handleTriggerAction}
              onPositionUpdate={handlePositionUpdate}
              getCharacterPosition={handleGetPosition}
            />
          )}
          {currentScene === 'login' && loginSubMode === 'userLogin' && (
            <div className={styles.placeholder}>
              <p>用户登录功能开发中…</p>
            </div>
          )}
        </div>
        {currentScene === 'reading' && (
          <div className={styles.scenePanel}>
            <ReadingScene
              key={`reading-${sceneKey}`}
              onTriggerAction={handleTriggerAction}
            />
          </div>
        )}
      </main>
    </div>
  );
}
