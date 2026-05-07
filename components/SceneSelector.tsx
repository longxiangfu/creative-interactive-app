import { SceneType } from '@/types';
import styles from './SceneSelector.module.css';

interface SceneSelectorProps {
  activeScene: SceneType;
  onSwitchScene: (scene: SceneType) => void;
}

const SCENES: { type: SceneType; label: string; desc: string }[] = [
  { type: 'login', label: '用户操作', desc: '动物根据鼠标位置做出创意性动作' },
  { type: 'reading', label: '文本阅读', desc: '上传文本，动物根据语义做出创意性动作' },
];

export default function SceneSelector({ activeScene, onSwitchScene }: SceneSelectorProps) {
  return (
    <nav className={styles.selector}>
      {SCENES.map((scene) => (
        <button
          key={scene.type}
          className={`${styles.button} ${activeScene === scene.type ? styles.active : ''}`}
          onClick={() => onSwitchScene(scene.type)}
          title={scene.desc}
        >
          <span className={styles.icon}>{scene.type === 'login' ? '🐱' : '📖'}</span>
          <span className={styles.label}>{scene.label}</span>
        </button>
      ))}
    </nav>
  );
}
