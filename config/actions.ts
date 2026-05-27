import { ActionDefinition } from '@/types';

export const ACTION_DEFINITIONS: Record<string, ActionDefinition> = {
  idle: { type: 'idle', label: '待机', duration: 2000, loop: true, interruptible: true, transitionDuration: 200, priority: 5 },
  follow: { type: 'follow', label: '跟随', duration: 1000, loop: true, interruptible: true, transitionDuration: 200, priority: 4 },
  dodge: { type: 'dodge', label: '躲避', duration: 600, loop: false, interruptible: true, transitionDuration: 150, priority: 3 },
  clickReact: { type: 'clickReact', label: '点击反应', duration: 800, loop: false, interruptible: false, transitionDuration: 100, priority: 1 },
  happy: { type: 'happy', label: '开心', duration: 1500, loop: false, interruptible: true, transitionDuration: 200, priority: 2 },
  sad: { type: 'sad', label: '悲伤', duration: 1500, loop: false, interruptible: true, transitionDuration: 200, priority: 2 },
  angry: { type: 'angry', label: '愤怒', duration: 1200, loop: false, interruptible: true, transitionDuration: 200, priority: 2 },
  surprised: { type: 'surprised', label: '惊讶', duration: 1000, loop: false, interruptible: true, transitionDuration: 150, priority: 2 },
  jump: { type: 'jump', label: '跳跃', duration: 800, loop: false, interruptible: true, transitionDuration: 150, priority: 2 },
  rotate: { type: 'rotate', label: '旋转', duration: 1000, loop: false, interruptible: true, transitionDuration: 200, priority: 2 },
  wave: { type: 'wave', label: '挥手', duration: 1200, loop: false, interruptible: true, transitionDuration: 200, priority: 2 },
  clap: { type: 'clap', label: '鼓掌', duration: 1200, loop: false, interruptible: true, transitionDuration: 200, priority: 2 },
  think: { type: 'think', label: '思考', duration: 2000, loop: false, interruptible: true, transitionDuration: 200, priority: 2 },
  fear: { type: 'fear', label: '害怕', duration: 1000, loop: false, interruptible: true, transitionDuration: 200, priority: 2 },
  complete: { type: 'complete', label: '完成', duration: 1500, loop: false, interruptible: false, transitionDuration: 200, priority: 2 },
  lookRight: { type: 'lookRight', label: '向右看', duration: 99999, loop: true, interruptible: true, transitionDuration: 200, priority: 6 },
  lookLeft: { type: 'lookLeft', label: '向左看', duration: 99999, loop: true, interruptible: true, transitionDuration: 200, priority: 6 },
};
