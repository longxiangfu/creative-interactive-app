'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Position } from '@/types';
import styles from './UserLoginPage.module.css';

type FocusField = 'none' | 'username' | 'password' | 'captcha';

interface UserLoginPageProps {
  onFocusFieldChange?: (field: FocusField, showPassword: boolean) => void;
  onCharacterJump?: () => void;
  onEyeTrack?: (track: Position | null) => void;
  onLoginResult?: (success: boolean) => void;
}

export default function UserLoginPage({ onFocusFieldChange, onCharacterJump, onEyeTrack, onLoginResult }: UserLoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const showPasswordRef = useRef(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captchaInputRef = useRef<HTMLInputElement>(null);
  const lastFocusField = useRef<FocusField>('none');

  const cancelBlur = useCallback(() => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
  }, []);

  const handleBlur = useCallback(() => {
    cancelBlur();
  }, [cancelBlur]);

  const notifyFocus = useCallback((field: FocusField) => {
    onFocusFieldChange?.(field, showPassword);
  }, [onFocusFieldChange, showPassword]);

  const generateCaptcha = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaCode(code);
    setCaptchaInput('');
    return code;
  }, []);

  useEffect(() => {
    const code = generateCaptcha();
    drawCaptcha(code);
  }, []);

  useEffect(() => {
    if (!onEyeTrack) return;
    if (showPassword) {
      onEyeTrack(null);
      return;
    }
    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const maxDist = Math.max(cx, cy);
      onEyeTrack({ x: dx / maxDist, y: dy / maxDist });
    };
    const handleMouseLeave = () => {
      onEyeTrack(null);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      onEyeTrack(null);
    };
  }, [showPassword, onEyeTrack]);

  const drawCaptcha = (code: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f0f1f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.font = `${16 + Math.random() * 6}px monospace`;
      ctx.fillStyle = `hsl(${Math.random() * 360}, 60%, 40%)`;
      const x = 8 + i * 22;
      const y = 24 + Math.random() * 6;
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillText(code[i], 0, 0);
      ctx.restore();
    }

    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.strokeStyle = `rgba(100,100,100,${0.2 + Math.random() * 0.3})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100,100,100,${0.3 + Math.random() * 0.4})`;
      ctx.fill();
    }
  };

  const handleRefreshCaptcha = () => {
    const code = generateCaptcha();
    drawCaptcha(code);
  };

  const handleLogin = () => {
    setMessage(null);

    if (!username.trim()) {
      setMessage({ type: 'error', text: '请输入用户名' });
      return;
    }
    if (!password.trim()) {
      setMessage({ type: 'error', text: '请输入密码' });
      return;
    }
    if (!captchaInput.trim()) {
      setMessage({ type: 'error', text: '请输入验证码' });
      return;
    }
    if (captchaInput.toLowerCase() !== captchaCode.toLowerCase()) {
      setMessage({ type: 'error', text: '验证码错误' });
      handleRefreshCaptcha();
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (username === 'admin' && password === '123456') {
        setMessage({ type: 'success', text: `登录成功，欢迎 ${username}！` });
        onLoginResult?.(true);
      } else {
        setMessage({ type: 'error', text: '用户名或密码错误' });
        onLoginResult?.(false);
      }
    }, 1500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>用户登录</h2>

        <div className={styles.field}>
          <label className={styles.label}>用户名</label>
          <input
            className={styles.input}
            type="text"
            placeholder="请输入用户名"
            value={username}
            onChange={(e) => { setUsername(e.target.value); onCharacterJump?.(); }}
            onFocus={() => { cancelBlur(); onFocusFieldChange?.('username', showPasswordRef.current); }}
            onBlur={handleBlur}
            maxLength={32}
            autoComplete="new-username"
            data-1p-ignore
            data-lpignore="true"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>密码</label>
          <div className={styles.passwordWrapper}>
            <input
              ref={passwordRef}
              className={styles.passwordInput}
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入密码"
              value={password}
              onChange={(e) => { setPassword(e.target.value); onCharacterJump?.(); }}
              onFocus={() => { cancelBlur(); onFocusFieldChange?.('password', showPasswordRef.current); }}
              onBlur={handleBlur}
              maxLength={64}
              autoComplete="new-password"
              data-1p-ignore
              data-lpignore="true"
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const next = !showPassword;
                setShowPassword(next);
                showPasswordRef.current = next;
                onFocusFieldChange?.('password', next);
                setTimeout(() => passwordRef.current?.focus(), 0);
              }}
              title={showPassword ? '隐藏密码' : '显示密码'}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>验证码</label>
          <div className={styles.captchaRow}>
            <input
              ref={captchaInputRef}
              className={styles.captchaInput}
              type="text"
              placeholder="请输入验证码"
              value={captchaInput}
              onChange={(e) => { setCaptchaInput(e.target.value); onCharacterJump?.(); }}
              onFocus={() => { cancelBlur(); onFocusFieldChange?.('captcha', showPasswordRef.current); }}
              onBlur={handleBlur}
              maxLength={4}
            />
            <canvas
              ref={canvasRef}
              className={styles.captchaCanvas}
              width={100}
              height={36}
              onClick={() => { handleRefreshCaptcha(); setTimeout(() => captchaInputRef.current?.focus(), 0); }}
              title="点击刷新验证码"
            />
          </div>
          <p className={styles.captchaHint}>点击图片刷新验证码</p>
        </div>

        <button
          className={styles.loginBtn}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? '登录中…' : '登 录'}
        </button>

        {message && (
          <p className={`${styles.message} ${message.type === 'success' ? styles.success : styles.error}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
