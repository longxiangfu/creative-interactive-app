import { useState, useCallback, useRef, useEffect } from 'react';
import { TextField, ReadingState, ReadingProgress, ActionType } from '@/types';
import { TEXT_READING_CONFIG } from '@/config/appConfig';
import { SemanticMapper } from '@/engine/SemanticMapper';

interface TextReadingCallbacks {
  onTriggerAction: (action: ActionType) => void;
}

export function useTextReading(callbacks: TextReadingCallbacks) {
  const [text, setText] = useState('');
  const [sanitizedText, setSanitizedText] = useState('');
  const [textFields, setTextFields] = useState<TextField[]>([]);
  const [readingState, setReadingState] = useState<ReadingState>('idle');
  const [currentFieldIndex, setCurrentFieldIndex] = useState(-1);
  const [readingProgress, setReadingProgress] = useState<ReadingProgress>({ current: 0, total: 0, percentage: 0 });
  const [errorMessage, setErrorMessage] = useState('');
  const [lastSemanticAction, setLastSemanticAction] = useState<string>('');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const semanticMapperRef = useRef(new SemanticMapper());
  const config = TEXT_READING_CONFIG;

  const sanitizeText = useCallback((raw: string): string => {
    return raw
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      }[c as string] || c));
  }, []);

  const tokenizeText = useCallback((content: string): TextField[] => {
    const fields: TextField[] = [];
    const chineseRegex = /[\u4e00-\u9fa5]{1,4}/g;
    const englishRegex = /[a-zA-Z]+/g;
    let lastIndex = 0;
    const combined = new RegExp(`${chineseRegex.source}|${englishRegex.source}`, 'g');
    let match;
    while ((match = combined.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const between = content.slice(lastIndex, match.index);
        fields.push({ text: between, startIndex: lastIndex, endIndex: match.index, isHighlight: false });
      }
      fields.push({ text: match[0], startIndex: match.index, endIndex: match.index + match[0].length, isHighlight: false });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      fields.push({ text: content.slice(lastIndex), startIndex: lastIndex, endIndex: content.length, isHighlight: false });
    }
    if (fields.length === 0 && content.length > 0) {
      fields.push({ text: content, startIndex: 0, endIndex: content.length, isHighlight: false });
    }
    return fields;
  }, []);

  const submitText = useCallback((content: string) => {
    setErrorMessage('');
    if (!content.trim()) {
      setErrorMessage('请输入待阅读的文本内容');
      return false;
    }
    if (content.length > config.maxTextLength) {
      setErrorMessage('文本过长，请控制在10000字以内');
      return false;
    }
    const sanitized = sanitizeText(content);
    const fields = tokenizeText(sanitized);
    setText(content);
    setSanitizedText(sanitized);
    setTextFields(fields);
    setReadingState('idle');
    setCurrentFieldIndex(-1);
    setReadingProgress({ current: 0, total: fields.length, percentage: 0 });
    return true;
  }, [config, sanitizeText, tokenizeText]);

  const readNextField = useCallback((fields: TextField[], index: number) => {
    if (index >= fields.length) {
      setReadingState('completed');
      setReadingProgress({ current: fields.length, total: fields.length, percentage: 100 });
      callbacks.onTriggerAction('complete');
      setCurrentFieldIndex(fields.length - 1);
      const updated = fields.map((f, i) => ({ ...f, isHighlight: i === fields.length - 1 }));
      setTextFields(updated);
      return;
    }

    const updated = fields.map((f, i) => ({ ...f, isHighlight: i === index }));
    setTextFields(updated);
    setCurrentFieldIndex(index);
    setReadingProgress({
      current: index + 1,
      total: fields.length,
      percentage: Math.round(((index + 1) / fields.length) * 100),
    });

    const field = fields[index];
    const action = semanticMapperRef.current.matchSemantic(field.text);
    if (action) {
      setLastSemanticAction(`检测到"${field.text}"→角色执行${action}动作`);
      callbacks.onTriggerAction(action);
    } else {
      setLastSemanticAction('');
    }

    timerRef.current = setTimeout(() => {
      readNextField(fields, index + 1);
    }, config.readingSpeed);
  }, [callbacks, config]);

  const startReading = useCallback(() => {
    if (textFields.length === 0) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setReadingState('reading');
    setLastSemanticAction('');
    const updated = textFields.map((f) => ({ ...f, isHighlight: false }));
    readNextField(updated, 0);
  }, [textFields, readNextField]);

  const pauseReading = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setReadingState('paused');
  }, []);

  const resumeReading = useCallback(() => {
    if (readingState !== 'paused' || textFields.length === 0) return;
    setReadingState('reading');
    const nextIndex = currentFieldIndex + 1;
    readNextField(textFields, nextIndex);
  }, [readingState, textFields, currentFieldIndex, readNextField]);

  const resetReading = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setReadingState('idle');
    setCurrentFieldIndex(-1);
    setReadingProgress({ current: 0, total: textFields.length, percentage: 0 });
    setTextFields(textFields.map((f) => ({ ...f, isHighlight: false })));
    setLastSemanticAction('');
  }, [textFields]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    text,
    sanitizedText,
    textFields,
    readingState,
    currentFieldIndex,
    readingProgress,
    errorMessage,
    lastSemanticAction,
    submitText,
    startReading,
    pauseReading,
    resumeReading,
    resetReading,
  };
}
