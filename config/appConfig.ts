import { CharacterConfig, MouseInteractionConfig, TextReadingConfig, SceneConfig } from '@/types';
import { ACTION_DEFINITIONS } from './actions';
import { SEMANTIC_MAPPINGS } from './semanticMappings';

export const DEFAULT_CHARACTER_CONFIG: CharacterConfig = {
  id: 'default',
  name: '创意小猫',
  spriteSheetPath: '/characters/default/sprite-sheet.png',
  spriteDataPath: '/characters/default/sprite-data.json',
  fallbackPath: '/characters/default/fallback.png',
  defaultWidth: 200,
  defaultHeight: 200,
};

export const MOUSE_INTERACTION_CONFIG: MouseInteractionConfig = {
  dodgeThreshold: 150,
  clickRadius: 200,
  followSpeed: 0.08,
  dodgeSpeed: 20,
  maxJumpPerFrame: 60,
};

export const TEXT_READING_CONFIG: TextReadingConfig = {
  maxTextLength: 10000,
  readingSpeed: 800,
};

export const SCENE_CONFIGS: Record<string, SceneConfig> = {
  login: { type: 'login', label: '鼠标跟随', description: '动物根据鼠标位置做出创意性动作' },
  reading: { type: 'reading', label: '文本阅读', description: '上传文本，动物根据语义做出创意性动作' },
  audio: { type: 'audio', label: '音频赏析', description: '上传音频，动物根据音频内容做出各种表情和动作' },
  video: { type: 'video', label: '影视畅游', description: '上传视频，动物根据视频内容做出各种表情和动作' },
};

export { ACTION_DEFINITIONS, SEMANTIC_MAPPINGS };
