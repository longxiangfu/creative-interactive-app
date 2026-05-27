import { useState, useCallback, useRef, useEffect } from 'react';
import { ActionType } from '@/types';

interface AudioAnalysisCallbacks {
  onTriggerAction: (action: ActionType) => void;
}

type AudioState = 'idle' | 'playing' | 'paused' | 'completed';

export function useAudioAnalysis(callbacks: AudioAnalysisCallbacks) {
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [audioName, setAudioName] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastActionHint, setLastActionHint] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | MediaElementAudioSourceNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const prevEnergyRef = useRef(0);
  const prevBassRef = useRef(0);
  const actionCooldownRef = useRef(0);

  const cleanup = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.onended = null;
      audioElementRef.onerror = null;
      audioElementRef.current = null;
    }
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch {}
      sourceRef.current = null;
    }
  }, []);

  const analyzeAndReact = useCallback(() => {
    const analyser = analyserRef.current;
    const audioEl = audioElementRef.current;
    if (!analyser || !audioEl) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const bassEnd = Math.floor(bufferLength * 0.1);
    const midEnd = Math.floor(bufferLength * 0.5);

    let bass = 0;
    for (let i = 0; i < bassEnd; i++) bass += dataArray[i];
    bass /= bassEnd;

    let mid = 0;
    for (let i = bassEnd; i < midEnd; i++) mid += dataArray[i];
    mid /= (midEnd - bassEnd);

    let high = 0;
    for (let i = midEnd; i < bufferLength; i++) high += dataArray[i];
    high /= (bufferLength - midEnd);

    const energy = (bass * 0.5 + mid * 0.35 + high * 0.15);
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
    } else if (energy > 180 && energyDelta > 40) {
      callbacks.onTriggerAction('surprised');
      setLastActionHint('能量骤增 → 惊讶');
      actionCooldownRef.current = now + 600;
    } else if (bass > 140 && mid > 100) {
      callbacks.onTriggerAction('happy');
      setLastActionHint('节奏欢快 → 开心');
      actionCooldownRef.current = now + 800;
    } else if (high > 120 && mid > 80) {
      callbacks.onTriggerAction('wave');
      setLastActionHint('高频活跃 → 挥手');
      actionCooldownRef.current = now + 700;
    } else if (energy > 120 && bass > 80) {
      callbacks.onTriggerAction('clap');
      setLastActionHint('节奏稳定 → 鼓掌');
      actionCooldownRef.current = now + 800;
    } else if (energy > 80) {
      callbacks.onTriggerAction('think');
      setLastActionHint('音乐舒缓 → 思考');
      actionCooldownRef.current = now + 1000;
    } else if (energy < 30) {
      callbacks.onTriggerAction('idle');
      setLastActionHint('');
      actionCooldownRef.current = now + 1200;
    } else {
      callbacks.onTriggerAction('follow');
      setLastActionHint('轻柔旋律 → 跟随');
      actionCooldownRef.current = now + 900;
    }

    setCurrentTime(audioEl.currentTime);

    if (!audioEl.paused && !audioEl.ended) {
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

    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm', 'audio/aac', 'audio/flac'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|webm|aac|flac)$/i)) {
      setErrorMessage('不支持的音频格式，请上传 MP3/WAV/OGG/M4A 等格式');
      return;
    }

    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audioElementRef.current = audio;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      setAudioName(file.name);
      setAudioState('idle');
    };

    audio.onerror = () => {
      setErrorMessage('音频加载失败，请尝试其他文件');
      setAudioState('idle');
    };

    audio.onended = () => {
      setAudioState('completed');
      callbacks.onTriggerAction('complete');
      setLastActionHint('播放完成');
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [cleanup, callbacks]);

  const startPlaying = useCallback(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    if (!audioContextRef.current) {
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      try {
        const source = ctx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        sourceRef.current = source;
      } catch {
        setErrorMessage('音频初始化失败');
        return;
      }
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    audio.play();
    setAudioState('playing');
    prevEnergyRef.current = 0;
    prevBassRef.current = 0;
    actionCooldownRef.current = 0;
    animFrameRef.current = requestAnimationFrame(analyzeAndReact);
  }, [analyzeAndReact]);

  const pausePlaying = useCallback(() => {
    const audio = audioElementRef.current;
    if (!audio) return;
    audio.pause();
    setAudioState('paused');
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const resumePlaying = useCallback(() => {
    const audio = audioElementRef.current;
    if (!audio) return;
    audio.play();
    setAudioState('playing');
    animFrameRef.current = requestAnimationFrame(analyzeAndReact);
  }, [analyzeAndReact]);

  const replayAudio = useCallback(() => {
    const audio = audioElementRef.current;
    if (!audio) return;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    audio.currentTime = 0;
    setCurrentTime(0);
    setLastActionHint('');
    prevEnergyRef.current = 0;
    prevBassRef.current = 0;
    actionCooldownRef.current = 0;

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    audio.play();
    setAudioState('playing');
    animFrameRef.current = requestAnimationFrame(analyzeAndReact);
  }, [analyzeAndReact]);

  const resetAudio = useCallback(() => {
    cleanup();
    if (audioContextRef.current) {
      if (analyserRef.current) {
        try { analyserRef.current.disconnect(); } catch {}
        analyserRef.current = null;
      }
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioState('idle');
    setCurrentTime(0);
    setDuration(0);
    setAudioName('');
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
  };
}
