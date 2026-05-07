'use client';

import { useState } from 'react';
import { useTextReading } from '@/hooks/useTextReading';
import { ActionType } from '@/types';
import styles from './ReadingScene.module.css';

interface ReadingSceneProps {
  onTriggerAction: (action: ActionType) => void;
}

export default function ReadingScene({ onTriggerAction }: ReadingSceneProps) {
  const [inputText, setInputText] = useState('');
  const {
    textFields,
    readingState,
    readingProgress,
    errorMessage,
    lastSemanticAction,
    submitText,
    startReading,
    pauseReading,
    resumeReading,
    resetReading,
  } = useTextReading({ onTriggerAction });

  const handleSubmit = () => {
    if (submitText(inputText)) {
      setInputText('');
    }
  };

  const isIdle = readingState === 'idle';
  const isReading = readingState === 'reading';
  const isPaused = readingState === 'paused';
  const isCompleted = readingState === 'completed';
  const hasText = textFields.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.inputArea}>
        <textarea
          className={styles.textarea}
          placeholder="请输入待阅读的文本内容，例如：今天很开心，然后跳了一下，接着开始思考..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={!isIdle || isReading}
          rows={4}
          maxLength={10000}
        />
        {errorMessage && <p className={styles.error}>{errorMessage}</p>}
        <div className={styles.buttonRow}>
          <button
            className={styles.button}
            onClick={handleSubmit}
            disabled={!inputText.trim() || !isIdle}
          >
            提交文本
          </button>
        </div>
      </div>

      {hasText && (
        <div className={styles.readingArea}>
          <div className={styles.textFieldContainer}>
            {textFields.map((field, index) => (
              <span
                key={index}
                className={`${styles.textField} ${field.isHighlight ? styles.highlight : ''}`}
              >
                {field.text}
              </span>
            ))}
          </div>

          <div className={styles.controls}>
            {isIdle && (
              <button className={styles.button} onClick={startReading}>
                开始阅读
              </button>
            )}
            {isReading && (
              <button className={styles.button} onClick={pauseReading}>
                暂停
              </button>
            )}
            {isPaused && (
              <button className={styles.button} onClick={resumeReading}>
                继续
              </button>
            )}
            {(isPaused || isCompleted) && (
              <button className={`${styles.button} ${styles.secondary}`} onClick={resetReading}>
                重新阅读
              </button>
            )}
          </div>

          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${readingProgress.percentage}%` }} />
          </div>
          <p className={styles.progressText}>
            阅读进度：{readingProgress.current}/{readingProgress.total} ({readingProgress.percentage}%)
          </p>

          {lastSemanticAction && (
            <p className={styles.semanticHint}>{lastSemanticAction}</p>
          )}
        </div>
      )}
    </div>
  );
}
