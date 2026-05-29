import { useState, useCallback, useRef, useEffect } from 'react';
import { ActionType } from '@/types';

interface VideoAnalysisCallbacks {
  onTriggerAction: (action: ActionType) => void;
}

type VideoState = 'idle' | 'playing' | 'paused' | 'completed';

export function useVideoAnalysis(callbacks: VideoAnalysisCallbacks) {
  const [videoState, setVideoState] = useState<VideoState>('idle');
  const [videoName, setVideoName] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastActionHint, setLastActionHint] = useState('');

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const prevEnergyRef = useRef(0);
  const prevBassRef = useRef(0);
  const actionCooldownRef = useRef(0);
  const prevBrightnessRef = useRef(128);

  const cleanup = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (videoElementRef.current) {
      videoElementRef.current.pause();
      videoElementRef.current.onended = null;
      videoElementRef.current.onerror = null;
    }
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch {}
      sourceRef.current = null;
    }
  }, []);

  const analyzeAndReact = useCallback(() => {
    const video = videoElementRef.current;
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!video || !canvas) return;

    let energy = 0;
    let bass = 0;

    if (analyser) {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);
      const bassEnd = Math.floor(bufferLength * 0.1);
      const midEnd = Math.floor(bufferLength * 0.5);
      for (let i = 0; i < bassEnd; i++) bass += dataArray[i];
      bass /= bassEnd;
      let mid = 0;
      for (let i = bassEnd; i < midEnd; i++) mid += dataArray[i];
      mid /= (midEnd - bassEnd);
      let high = 0;
      for (let i = midEnd; i < bufferLength; i++) high += dataArray[i];
      high /= (bufferLength - midEnd);
      energy = bass * 0.5 + mid * 0.35 + high * 0.15;
    }

    const ctx = canvas.getContext('2d');
    let brightness = prevBrightnessRef.current;
    let motion = 0;
    if (ctx && video.readyState >= 2) {
      const w = 64;
      const h = 48;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      let totalBright = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalBright += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      }
      brightness = totalBright / (w * h);
      motion = Math.abs(brightness - prevBrightnessRef.current);
      prevBrightnessRef.current = brightness;
    }

    const prevEnergy = prevEnergyRef.current;
    const prevBass = prevBassRef.current;
    prevEnergyRef.current = energy;
    prevBassRef.current = bass;

    const now = performance.now();
    if (now < actionCooldownRef.current) {
      animFrameRef.current = requestAnimationFrame(analyzeAndReact);
      return;
    }

    const energyDelta = energy - prevEnergy;
    const bassDelta = bass - prevBass;

    if (bass > 160 && bassDelta > 30) {
      callbacks.onTriggerAction('jump');
      setLastActionHint('低音节拍 → 跳跃');
      actionCooldownRef.current = now + 500;
    } else if (motion > 20 || (energy > 180 && energyDelta > 40)) {
      callbacks.onTriggerAction('surprised');
      setLastActionHint('画面骤变 → 惊讶');
      actionCooldownRef.current = now + 600;
    } else if (brightness < 60) {
      callbacks.onTriggerAction('fear');
      setLastActionHint('画面昏暗 → 害怕');
      actionCooldownRef.current = now + 800;
    } else if (brightness > 200 && bass > 100) {
      callbacks.onTriggerAction('happy');
      setLastActionHint('明亮欢快 → 开心');
      actionCooldownRef.current = now + 800;
    } else if (energy > 120 && bass > 80) {
      callbacks.onTriggerAction('clap');
      setLastActionHint('节奏稳定 → 鼓掌');
      actionCooldownRef.current = now + 800;
    } else if (motion > 8) {
      callbacks.onTriggerAction('follow');
      setLastActionHint('画面运动 → 跟随');
      actionCooldownRef.current = now + 700;
    } else if (energy > 80) {
      callbacks.onTriggerAction('think');
      setLastActionHint('舒缓画面 → 思考');
      actionCooldownRef.current = now + 1000;
    } else if (energy < 30 && motion < 3) {
      callbacks.onTriggerAction('idle');
      setLastActionHint('');
      actionCooldownRef.current = now + 1200;
    } else {
      callbacks.onTriggerAction('wave');
      setLastActionHint('轻柔画面 → 挥手');
      actionCooldownRef.current = now + 900;
    }

    setCurrentTime(video.currentTime);
    if (!video.paused && !video.ended) {
      animFrameRef.current = requestAnimationFrame(analyzeAndReact);
    }
  }, [callbacks]);

  const handleFileSelect = useCallback((file: File) => {
    setErrorMessage('');
    cleanup();

    if (audioContextRef.current) {
      if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch {}
        sourceRef.current = null;
      }
      if (analyserRef.current) {
        try { analyserRef.current.disconnect(); } catch {}
        analyserRef.current = null;
      }
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    const validExts = /\.(mp4|webm|ogg|mov|avi|mkv|m4v)$/i;
    if (!file.type.startsWith('video/') && !validExts.test(file.name)) {
      setErrorMessage('不支持的视频格式，请上传 MP4/WebM/OGG/MOV 等格式');
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoName(file.name);
    setVideoState('idle');
    setDuration(0);
    setCurrentTime(0);
    setLastActionHint('');

    if (videoElementRef.current) {
      const video = videoElementRef.current;
      video.src = url;

      video.onloadedmetadata = () => {
        setDuration(video.duration);
      };

      video.onerror = () => {
        setErrorMessage('视频加载失败，请尝试其他文件');
        setVideoState('idle');
      };

      video.onended = () => {
        setVideoState('completed');
        callbacks.onTriggerAction('complete');
        setLastActionHint('播放完成');
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
      };
    }
  }, [cleanup, callbacks]);

  const startPlaying = useCallback(() => {
    const video = videoElementRef.current;
    if (!video) return;

    if (!audioContextRef.current) {
      try {
        const ctx = new AudioContext();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;
        const source = ctx.createMediaElementSource(video);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        sourceRef.current = source;
      } catch {}
    }

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        setVideoState('playing');
        prevEnergyRef.current = 0;
        prevBassRef.current = 0;
        prevBrightnessRef.current = 128;
        actionCooldownRef.current = 0;
        animFrameRef.current = requestAnimationFrame(analyzeAndReact);
      }).catch(() => {});
    } else {
      setVideoState('playing');
      prevEnergyRef.current = 0;
      prevBassRef.current = 0;
      prevBrightnessRef.current = 128;
      actionCooldownRef.current = 0;
      animFrameRef.current = requestAnimationFrame(analyzeAndReact);
    }
  }, [analyzeAndReact]);

  const pausePlaying = useCallback(() => {
    const video = videoElementRef.current;
    if (!video) return;
    video.pause();
    setVideoState('paused');
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const resumePlaying = useCallback(() => {
    const video = videoElementRef.current;
    if (!video) return;
    video.play().catch(() => {});
    setVideoState('playing');
    animFrameRef.current = requestAnimationFrame(analyzeAndReact);
  }, [analyzeAndReact]);

  const replayVideo = useCallback(() => {
    const video = videoElementRef.current;
    if (!video) return;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    video.currentTime = 0;
    setCurrentTime(0);
    setLastActionHint('');
    prevEnergyRef.current = 0;
    prevBassRef.current = 0;
    prevBrightnessRef.current = 128;
    actionCooldownRef.current = 0;
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    video.play().catch(() => {});
    setVideoState('playing');
    animFrameRef.current = requestAnimationFrame(analyzeAndReact);
  }, [analyzeAndReact]);

  const resetVideo = useCallback(() => {
    cleanup();
    if (audioContextRef.current) {
      if (analyserRef.current) {
        try { analyserRef.current.disconnect(); } catch {}
        analyserRef.current = null;
      }
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setVideoState('idle');
    setCurrentTime(0);
    setDuration(0);
    setVideoName('');
    setLastActionHint('');
    callbacks.onTriggerAction('idle');
  }, [cleanup, callbacks]);

  useEffect(() => {
    return () => {
      cleanup();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [cleanup]);

  const progress = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;

  return {
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
  };
}
