import { useState, useCallback, useRef } from 'react';
import { SceneType } from '@/types';

export function useSceneController() {
  const [currentScene, setCurrentScene] = useState<SceneType>('login');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSceneChangeRef = useRef<((scene: SceneType) => void) | null>(null);

  const setOnSceneChange = useCallback((cb: (scene: SceneType) => void) => {
    onSceneChangeRef.current = cb;
  }, []);

  const switchScene = useCallback((target: SceneType) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setCurrentScene((prev) => {
        if (prev === target) return prev;
        if (onSceneChangeRef.current) {
          onSceneChangeRef.current(target);
        }
        return target;
      });
    }, 500);
  }, []);

  const resetCurrentScene = useCallback(() => {
    setCurrentScene('login');
    if (onSceneChangeRef.current) {
      onSceneChangeRef.current('login');
    }
  }, []);

  return {
    currentScene,
    switchScene,
    resetCurrentScene,
    setOnSceneChange,
  };
}
