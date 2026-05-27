'use client';

import { useRef } from 'react';
import { useAudioAnalysis } from '@/hooks/useAudioAnalysis';
import { ActionType } from '@/types';
import styles from './AudioScene.module.css';

interface AudioSceneProps {
  onTriggerAction: (action: ActionType) => void;
}

export default function AudioScene({ onTriggerAction }: AudioSceneProps) {
  const {
    audioState,
    audioName,
    duration,
    currentTime,
    progress,
    errorMessage,
    lastActionHint,
    handleFileSelect,
    startPlaying,
    pausePlaying,
    resumePlaying,
    replayAudio,
    resetAudio,
  } = useAudioAnalysis({ onTriggerAction });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleChangeAudio = () => {
    resetAudio();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isIdle = audioState === 'idle';
  const isPlaying = audioState === 'playing';
  const isPaused = audioState === 'paused';
  const isCompleted = audioState === 'completed';
  const hasAudio = !!audioName;

  return (
    <div className={styles.container}>
      <div
        className={`${styles.dropZone} ${hasAudio ? styles.hasAudio : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !hasAudio && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        {hasAudio ? (
          <div className={styles.audioInfo}>
            <span className={styles.audioIcon}>🎵</span>
            <span className={styles.audioName}>{audioName}</span>
            <span className={styles.audioDuration}>{formatTime(duration)}</span>
          </div>
        ) : (
          <div className={styles.dropHint}>
            <span className={styles.dropIcon}>🎶</span>
            <p>点击或拖拽上传音频文件</p>
            <p className={styles.dropSubHint}>支持 MP3 / WAV / OGG / M4A 等格式</p>
          </div>
        )}
      </div>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      {hasAudio && (
        <div className={styles.controls}>
          {(isIdle || isCompleted) && (
            <button className={styles.button} onClick={isCompleted ? replayAudio : startPlaying}>
              {isCompleted ? '重新播放' : '开始播放'}
            </button>
          )}
          {isPlaying && (
            <button className={styles.button} onClick={pausePlaying}>暂停</button>
          )}
          {isPaused && (
            <>
              <button className={styles.button} onClick={resumePlaying}>继续</button>
              <button className={`${styles.button} ${styles.secondary}`} onClick={replayAudio}>重新播放</button>
            </>
          )}
          <button className={`${styles.button} ${styles.secondary}`} onClick={handleChangeAudio} disabled={isPlaying}>
            更换音频
          </button>
        </div>
      )}

      {hasAudio && !isIdle && (
        <div className={styles.progressArea}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <p className={styles.progressText}>
            {formatTime(currentTime)} / {formatTime(duration)} ({progress}%)
          </p>
        </div>
      )}

      {lastActionHint && (
        <p className={styles.actionHint}>{lastActionHint}</p>
      )}
    </div>
  );
}
