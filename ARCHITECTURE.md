# 创意交互应用 — 架构设计文档

## 1. 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 16.2.4 |
| UI 库 | React | 19.2.4 |
| 语言 | TypeScript | ^5 |
| 音频 | Web Audio API | 浏览器原生 |
| 画布 | Canvas 2D | 浏览器原生 |

## 2. 目录结构

```
creative-interactive-app/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # 根布局 (lang=zh-CN)
│   ├── page.tsx            # 首页 (场景路由 + 状态管理)
│   ├── page.module.css
│   └── globals.css         # CSS 变量 + 主题
│
├── components/             # React 组件
│   ├── CharacterStage.tsx  # Canvas 舞台 (核心)
│   ├── CharacterSwitcher.tsx # 角色多选器
│   ├── SceneSelector.tsx   # 场景页签导航
│   └── scenes/             # 场景面板
│       ├── LoginScene.tsx      # 鼠标跟随交互层
│       ├── UserLoginPage.tsx   # 用户登录表单
│       ├── ReadingScene.tsx    # 文本阅读面板
│       ├── AudioScene.tsx      # 音频赏析面板
│       └── VideoScene.tsx      # 影视畅游面板
│
├── engine/                 # 核心引擎
│   ├── MultiCharacterRenderer.ts  # 多角色渲染器 (物理+碰撞+绘制)
│   ├── CollisionEngine.ts         # 碰撞检测/求解/分离
│   ├── ActionSystem.ts            # 动作状态机 (播放/中断/过渡)
│   ├── Animator.ts                # 帧动画器 (旧架构, 备用)
│   ├── CharacterEngine.ts         # 单角色引擎 (旧架构, 备用)
│   ├── SemanticMapper.ts          # 语义→动作映射
│   ├── SoundManager.ts            # 程序化碰撞音效
│   └── ResourceManager.ts         # 资源预加载+兼容检测
│
├── hooks/                  # React Hooks
│   ├── useMouseInteraction.ts  # 鼠标交互 (跟随/躲避/点击)
│   ├── useTextReading.ts       # 文本分词+语义阅读
│   ├── useAudioAnalysis.ts     # 音频频谱分析
│   ├── useVideoAnalysis.ts     # 视频画面+音频双重分析
│   └── useSceneController.ts   # 场景切换 (防抖)
│
├── config/                 # 配置
│   ├── actions.ts              # 18种动作定义 (优先级/时长/可中断性)
│   ├── appConfig.ts            # 应用配置 (场景/交互参数)
│   └── semanticMappings.ts     # 中文关键词→动作映射表
│
├── types/index.ts          # 全局类型定义
└── utils/drawCharacter.ts  # 7种动物脸部 Canvas 绘制
```

## 3. 核心架构

### 3.1 整体数据流

```
用户交互 → 场景组件 → Hook → onTriggerAction → page.tsx → CharacterStage → MultiCharacterRenderer → Canvas
```

所有场景通过统一的 `onTriggerAction: (action: ActionType) => void` 回调驱动角色动作，page.tsx 作为中介调用 `stageRef.current.triggerAction(action)`。

### 3.2 场景路由 (单页面条件渲染)

`HomePage` 通过 `currentScene: SceneType` 状态实现场景切换：

| 场景 | 渲染结构 | 驱动方式 |
|------|---------|---------|
| `login` + `simple` | CharacterStage + LoginScene (覆盖层) | 鼠标位置→角色跟随 |
| `login` + `userLogin` | CharacterStage ∥ UserLoginPage (分屏) | 表单焦点→眼睛方向, 密码显隐→眼球追踪 |
| `reading` | CharacterStage + ReadingScene | 文本分词→语义匹配→动作 |
| `audio` | CharacterStage + AudioScene | 音频频谱(bass/mid/high)→动作 |
| `video` | CharacterStage + VideoScene | 画面亮度/运动+音频频谱→动作 |

CharacterStage 在所有场景间保持同一实例，避免卸载重建导致状态丢失。

### 3.3 渲染管线 (每帧)

```
MultiCharacterRenderer.renderFrame():
  1. 物理更新: 弹性吸引(0.03) + 摩擦衰减(0.95) + 限速(6px/帧)
  2. 动作计时: 非循环动作到期→自动回idle; jump 800ms结束
  3. 碰撞处理: 圆形检测→弹性冲量求解(恢复系数0.6)→迭代分离(8次)→边界钳制
  4. 画布清空
  5. 逐角色绘制: 情绪映射→呼吸效果→动作变换→脸部绘制→动作装饰
```

### 3.4 角色物理模型

- **弹性吸引力**: `velocity += (homePosition - position) * 0.03`
- **摩擦衰减**: `velocity *= 0.95`
- **角色排列**: 以 groupCenter 为圆心，按数量等角圆周排列
- **碰撞响应**: 弹性碰撞冲量 + 500ms 冷却期 + 8次迭代重叠分离

### 3.5 动作系统

18种 ActionType，各有优先级(1-6)：
- 高优先级(1-2): clickReact, happy/sad/angry/surprised/jump/rotate/wave/clap/think/fear/complete
- 中优先级(3-4): dodge, follow
- 低优先级(5-6): idle, lookRight/lookLeft

新动作可中断当前动作的条件：当前动作可中断 ∧ 新动作优先级 ≤ 当前优先级。

### 3.6 眼球追踪

`drawEye` 支持两种模式：
1. **固定偏移**: 瞳孔根据 `isLeft` 参数偏移 ±2px（默认行为）
2. **鼠标追踪**: 传入 `eyeTrack: {x, y}`（归一化 -1~1），瞳孔最大偏移为 `(eyeRadius - pupilRadius) * 0.9`

### 3.7 频谱分析 (音频/视频)

使用 Web Audio API `AnalyserNode` (fftSize=256, smoothing=0.8)：
- **Bass** (0-10% 频段): 低音节拍→跳跃
- **Mid** (10-50%): 中频+节奏→开心/鼓掌
- **High** (50-100%): 高频活跃→挥手
- **Energy** (加权): 骤增→惊讶, 舒缓→思考, 静音→待机

### 3.8 画面分析 (视频)

每帧对视频采样至 64×48 Canvas：
- **亮度**: 计算灰度均值，<60→害怕, >200+低音→开心
- **运动**: 帧间亮度差，>20→惊讶, >8→跟随

### 3.9 语义分析 (文本)

`SemanticMapper` 对中文分词结果做关键词匹配（contains 模式）：
- 开心/快乐/高兴→happy, 悲伤/难过→sad, 愤怒/生气→angry, 惊讶→surprised
- 跳跃→jump, 旋转→rotate, 挥手→wave, 鼓掌→clap, 思考→think, 害怕→fear

## 4. 关键设计决策

| 决策 | 理由 |
|------|------|
| Canvas 2D 而非 WebGL/SVG | 7种动物脸部的 2D 绘制需求简单，Canvas 性能足够 |
| 多角色渲染器替代单角色引擎 | 支持同时显示多种动物，圆周排列+碰撞交互 |
| forwardRef 暴露命令式 API | 父组件需精确控制角色动作/位置/眼睛，imperative handle 比 props 回调更直接 |
| 同一 CharacterStage 实例跨场景 | 避免场景切换时组件卸载导致 MultiCharacterRenderer 状态丢失 |
| Web Audio API 程序化音效 | 无需加载音频文件，碰撞音效用正弦波+噪声+包络实时合成 |
| ResizeObserver + resetToCenter | Canvas 尺寸随容器变化时自动重置角色位置，避免布局偏移导致角色错位 |
