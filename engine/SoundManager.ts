export class SoundManager {
  private audioContext: AudioContext | null = null;
  private collisionBuffer: AudioBuffer | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.generateCollisionSound();
      this.initialized = true;
    } catch (e) {
      console.warn('音频初始化失败:', e);
    }
  }

  private async generateCollisionSound(): Promise<void> {
    if (!this.audioContext) return;
    const duration = 0.15;
    const sampleRate = this.audioContext.sampleRate;
    const length = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 20);
      const freq1 = 400 + Math.random() * 200;
      const freq2 = 600 + Math.random() * 200;
      data[i] = envelope * (
        Math.sin(2 * Math.PI * freq1 * t) * 0.3 +
        Math.sin(2 * Math.PI * freq2 * t) * 0.2 +
        (Math.random() * 2 - 1) * 0.3
      );
    }
    this.collisionBuffer = buffer;
  }

  playCollision(): void {
    if (!this.audioContext || !this.collisionBuffer) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    source.buffer = this.collisionBuffer;
    gainNode.gain.value = 0.4;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start();
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.collisionBuffer = null;
    this.initialized = false;
  }
}
