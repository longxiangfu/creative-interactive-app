'use client';

import { useState, useRef, useEffect } from 'react';
import { SceneType, LoginSubMode } from '@/types';
import styles from './SceneSelector.module.css';

interface SceneSelectorProps {
  activeScene: SceneType;
  activeLoginSubMode: LoginSubMode;
  onSwitchScene: (scene: SceneType) => void;
  onSwitchLoginSubMode: (mode: LoginSubMode) => void;
}

const LOGIN_SUB_MODES: { mode: LoginSubMode; label: string }[] = [
  { mode: 'simple', label: '简单' },
  { mode: 'userLogin', label: '用户登录' },
];

export default function SceneSelector({ activeScene, activeLoginSubMode, onSwitchScene, onSwitchLoginSubMode }: SceneSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLoginClick = () => {
    if (activeScene !== 'login') {
      onSwitchScene('login');
    }
    setDropdownOpen((prev) => !prev);
  };

  const handleSubModeSelect = (mode: LoginSubMode) => {
    onSwitchLoginSubMode(mode);
    setDropdownOpen(false);
  };

  const isLoginActive = activeScene === 'login';

  return (
    <nav className={styles.selector}>
      <div className={styles.loginWrapper} ref={dropdownRef}>
        <button
          className={`${styles.button} ${isLoginActive ? styles.active : ''}`}
          onClick={handleLoginClick}
        >
          <span className={styles.icon}>🐱</span>
          <span className={styles.label}>鼠标跟随</span>
          <span className={`${styles.arrow} ${dropdownOpen ? styles.arrowOpen : ''}`}>▾</span>
        </button>
        {dropdownOpen && (
          <div className={styles.dropdown}>
            {LOGIN_SUB_MODES.map((item) => (
              <button
                key={item.mode}
                className={`${styles.dropdownItem} ${activeLoginSubMode === item.mode ? styles.dropdownActive : ''}`}
                onClick={() => handleSubModeSelect(item.mode)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        className={`${styles.button} ${activeScene === 'reading' ? styles.active : ''}`}
        onClick={() => onSwitchScene('reading')}
        title="上传文本，动物根据语义做出创意性动作"
      >
        <span className={styles.icon}>📖</span>
        <span className={styles.label}>文本阅读</span>
      </button>

      <button
        className={`${styles.button} ${activeScene === 'audio' ? styles.active : ''}`}
        onClick={() => onSwitchScene('audio')}
        title="上传音频，动物根据音频内容做出各种表情和动作"
      >
        <span className={styles.icon}>🎵</span>
        <span className={styles.label}>音频赏析</span>
      </button>
    </nav>
  );
}
