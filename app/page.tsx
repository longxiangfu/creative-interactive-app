'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { SceneType, ActionType, Position, LoginSubMode, CollisionEvent } from '@/types';
import { ResourceManager } from '@/engine/ResourceManager';
import SceneSelector from '@/components/SceneSelector';
import CharacterStage, { CharacterStageHandle } from '@/components/CharacterStage';
import LoginScene from '@/components/scenes/LoginScene';
import UserLoginPage from '@/components/scenes/UserLoginPage';
import ReadingScene from '@/components/scenes/ReadingScene';
import AudioScene from '@/components/scenes/AudioScene';
import VideoScene from '@/components/scenes/VideoScene';
import styles from './page.module.css';

export default function HomePage() {
  const [currentScene, setCurrentScene] = useState<SceneType>('login');
  const [loginSubMode, setLoginSubMode] = useState<LoginSubMode>('simple');
  const [appReady, setAppReady] = useState(false);
  const [browserCompatible, setBrowserCompatible] = useState(true);
  const [sceneKey, setSceneKey] = useState(0);
  const [characterTypes, setCharacterTypes] = useState<string[]>(['cat']);
  const stageRef = useRef<CharacterStageHandle>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jumpLockRef = useRef(false);

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
    if (stageRef.current) {
      stageRef.current.resetToCenter();
      stageRef.current.triggerAction('idle');
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

  const handleFocusFieldChange = useCallback((field: string, showPassword: boolean) => {
    if (!stageRef.current) return;
    if (field === 'none') {
      stageRef.current.setEyeDirection(0);
      stageRef.current.triggerAction('idle');
    } else if (showPassword) {
      stageRef.current.setEyeDirection(-1);
      stageRef.current.triggerAction('lookLeft');
    } else {
      stageRef.current.setEyeDirection(1);
      stageRef.current.triggerAction('lookRight');
    }
  }, []);

  const handleCharacterJump = useCallback(() => {}, []);

  const handleEyeTrack = useCallback((track: Position | null) => {
    if (stageRef.current) {
      stageRef.current.setEyeTrack(track);
    }
  }, []);

  const handleCharacterTypesChange = useCallback((types: string[]) => {
    setCharacterTypes(types);
    if (stageRef.current) {
      stageRef.current.setCharacterTypes(types);
    }
  }, []);

  const handleCollision = useCallback((event: CollisionEvent) => {
    console.log('碰撞事件:', event);
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
  const showUserLogin = currentScene === 'login' && loginSubMode === 'userLogin';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleIcon}>🐾</span>
          创意交互
        </h1>
      </header>

      <SceneSelector
        activeScene={currentScene}
        activeLoginSubMode={loginSubMode}
        onSwitchScene={handleSwitchScene}
        onSwitchLoginSubMode={handleSwitchLoginSubMode}
      />

      <main className={styles.main}>
        <div className={showUserLogin ? styles.splitArea : styles.stageArea}>
          <div className={showUserLogin ? styles.splitLeft : styles.stageFull}>
            <CharacterStage ref={stageRef} characterTypes={characterTypes} onCharacterTypesChange={handleCharacterTypesChange} onCollision={handleCollision} />
            {showLoginInteraction && (
              <LoginScene
                key={`login-${sceneKey}`}
                onTriggerAction={handleTriggerAction}
                onPositionUpdate={handlePositionUpdate}
                getCharacterPosition={handleGetPosition}
              />
            )}
          </div>
          {showUserLogin && (
            <div className={styles.splitRight}>
              <UserLoginPage onFocusFieldChange={handleFocusFieldChange} onCharacterJump={handleCharacterJump} onEyeTrack={handleEyeTrack} />
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
        {currentScene === 'audio' && (
          <div className={styles.scenePanel}>
            <AudioScene
              key={`audio-${sceneKey}`}
              onTriggerAction={handleTriggerAction}
            />
          </div>
        )}
        {currentScene === 'video' && (
          <div className={styles.scenePanel}>
            <VideoScene
              key={`video-${sceneKey}`}
              onTriggerAction={handleTriggerAction}
            />
          </div>
        )}
      </main>
    </div>
  );
}
