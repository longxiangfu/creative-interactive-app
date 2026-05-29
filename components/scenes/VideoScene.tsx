'use client';

import { useRef, useEffect } from 'react';
import { useVideoAnalysis } from '@/hooks/useVideoAnalysis';
import { ActionType } from '@/types';
import styles from './VideoScene.module.css';

interface VideoSceneProps {
  onTriggerAction: (action: ActionType) => void;
}

export default function VideoScene({ onTriggerAction }: VideoSceneProps) {
  const {
    videoState,
    videoName,
    duration,
    currentTime,
    progress,
    errorMessage,
    lastActionHint,
    handleFileSelect,
    startPlaying,
    pausePlaying,
    resumePlaying,
    replayVideo,
    resetVideo,
    videoElementRef,
  } = useVideoAnalysis({ onTriggerAction });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (displayRef.current) {
      videoElementRef.current = displayRef.current;
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleChangeVideo = () => {
    resetVideo();
    if (displayRef.current) {
      displayRef.current.src = '';
    }
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

  const isIdle = videoState === 'idle';
  const isPlaying = videoState === 'playing';
  const isPaused = videoState === 'paused';
  const isCompleted = videoState === 'completed';
  const hasVideo = !!videoName;

  return (
    <div className={styles.container}>
      <div className={`${styles.videoWrapper} ${!hasVideo ? styles.videoHidden : ''}`}>
        <video
          ref={displayRef}
          className={styles.video}
          playsInline
        />
      </div>

      <div
        className={`${styles.dropZone} ${hasVideo ? styles.hasVideo : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !hasVideo && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        {hasVideo ? (
          <div className={styles.videoInfo}>
            <span className={styles.videoIcon}>🎬</span>
            <span className={styles.videoName}>{videoName}</span>
            <span className={styles.videoDuration}>{formatTime(duration)}</span>
          </div>
        ) : (
          <div className={styles.dropHint}>
            <span className={styles.dropIcon}>🎥</span>
            <p>点击或拖拽上传视频文件</p>
            <p className={styles.dropSubHint}>支持 MP4 / WebM / OGG / MOV 等格式</p>
          </div>
        )}
      </div>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      {hasVideo && (
        <div className={styles.controls}>
          {(isIdle || isCompleted) && (
            <button className={styles.button} onClick={isCompleted ? replayVideo : startPlaying}>
              {isCompleted ? '重新播放' : '开始播放'}
            </button>
          )}
          {isPlaying && (
            <button className={styles.button} onClick={pausePlaying}>暂停</button>
          )}
          {isPaused && (
            <>
              <button className={styles.button} onClick={resumePlaying}>继续</button>
              <button className={`${styles.button} ${styles.secondary}`} onClick={replayVideo}>重新播放</button>
            </>
          )}
          <button className={`${styles.button} ${styles.secondary}`} onClick={handleChangeVideo} disabled={isPlaying}>
            更换视频
          </button>
        </div>
      )}

      {hasVideo && !isIdle && (
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
