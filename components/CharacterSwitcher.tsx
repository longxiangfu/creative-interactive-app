'use client';

import { useState, useRef, useEffect } from 'react';
import { drawCatFace, drawDogFace, drawRabbitFace, drawRoosterFace, drawPigFace, drawCowFace, drawSheepFace } from '@/utils/drawCharacter';
import styles from './CharacterSwitcher.module.css';

const CHARACTERS = [
  { type: 'cat', label: '猫' },
  { type: 'dog', label: '狗' },
  { type: 'rabbit', label: '兔子' },
  { type: 'rooster', label: '大公鸡' },
  { type: 'pig', label: '猪' },
  { type: 'cow', label: '牛' },
  { type: 'sheep', label: '羊' },
];

function CharacterIcon({ type, size }: { type: string; size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = size / 100;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (type === 'cat') drawCatFace(ctx, cx, cy, scale, 'neutral');
    else if (type === 'dog') drawDogFace(ctx, cx, cy, scale, 'neutral');
    else if (type === 'rabbit') drawRabbitFace(ctx, cx, cy, scale, 'neutral');
    else if (type === 'rooster') drawRoosterFace(ctx, cx, cy, scale, 'neutral');
    else if (type === 'pig') drawPigFace(ctx, cx, cy, scale, 'neutral');
    else if (type === 'cow') drawCowFace(ctx, cx, cy, scale, 'neutral');
    else if (type === 'sheep') drawSheepFace(ctx, cx, cy, scale, 'neutral');
  }, [type, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={styles.canvasIcon}
    />
  );
}

interface CharacterSwitcherProps {
  selectedTypes: string[];
  onSwitch: (types: string[]) => void;
}

export default function CharacterSwitcher({ selectedTypes, onSwitch }: CharacterSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        onSwitch(selectedTypes.filter(t => t !== type));
      }
    } else {
      onSwitch([...selectedTypes, type]);
    }
  };

  const selectedCount = selectedTypes.length;

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={styles.btn}
        onClick={() => setOpen((v) => !v)}
        title="选择角色（可多选）"
      >
        {selectedTypes.slice(0, 3).map((type) => (
          <CharacterIcon key={type} type={type} size={22} />
        ))}
        {selectedCount > 3 && (
          <span className={styles.moreCount}>+{selectedCount - 3}</span>
        )}
        <span className={styles.arrow}>▾</span>
      </button>
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.hint}>点击选择角色（可多选）</div>
          {CHARACTERS.map((c) => {
            const isSelected = selectedTypes.includes(c.type);
            return (
              <button
                key={c.type}
                className={`${styles.item} ${isSelected ? styles.active : ''}`}
                onClick={() => handleToggle(c.type)}
              >
                <CharacterIcon type={c.type} size={22} />
                <span className={styles.itemLabel}>{c.label}</span>
                {isSelected && <span className={styles.checkmark}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
