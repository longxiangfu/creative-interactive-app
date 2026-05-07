import { SemanticMapping } from '@/types';

export const SEMANTIC_MAPPINGS: SemanticMapping[] = [
  { keywords: ['开心', '快乐', '高兴'], actionType: 'happy', matchMode: 'contains' },
  { keywords: ['悲伤', '难过', '伤心'], actionType: 'sad', matchMode: 'contains' },
  { keywords: ['愤怒', '生气', '发火'], actionType: 'angry', matchMode: 'contains' },
  { keywords: ['惊讶', '吃惊', '意外'], actionType: 'surprised', matchMode: 'contains' },
  { keywords: ['跳跃', '蹦跳'], actionType: 'jump', matchMode: 'contains' },
  { keywords: ['旋转', '转圈'], actionType: 'rotate', matchMode: 'contains' },
  { keywords: ['挥手', '再见'], actionType: 'wave', matchMode: 'contains' },
  { keywords: ['鼓掌', '喝彩'], actionType: 'clap', matchMode: 'contains' },
  { keywords: ['思考', '沉思'], actionType: 'think', matchMode: 'contains' },
  { keywords: ['害怕', '恐惧'], actionType: 'fear', matchMode: 'contains' },
];
