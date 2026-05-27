export type Emotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'fear';

export type EyeTrack = { x: number; y: number };

function drawEye(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, emotion: Emotion, isLeft: boolean, eyeTrack?: EyeTrack): void {
  const s = scale;
  let eyeRadius = 10 * s;
  let pupilRadius = 4 * s;
  let eyeHeight = eyeRadius;

  if (emotion === 'happy') {
    ctx.beginPath(); ctx.arc(x, y, eyeRadius, 0.2, Math.PI - 0.2); ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2.5 * s; ctx.stroke();
    return;
  }
  if (emotion === 'sad') {
    ctx.beginPath(); ctx.arc(x, y + 5 * s, eyeRadius, Math.PI + 0.3, -0.3); ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2.5 * s; ctx.stroke();
    return;
  }
  if (emotion === 'angry') {
    ctx.beginPath(); ctx.ellipse(x, y, eyeRadius, eyeRadius * 0.6, 0, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2 * s; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, pupilRadius * 0.8, 0, Math.PI * 2); ctx.fillStyle = '#1a1a2e'; ctx.fill();
    ctx.beginPath(); ctx.arc(x + (isLeft ? -1 : 1) * 3 * s, y - 10 * s, 8 * s, 0.3, Math.PI - 0.3); ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 3 * s; ctx.stroke();
    return;
  }
  if (emotion === 'surprised') {
    eyeRadius = 14 * s;
    pupilRadius = 5 * s;
  }
  if (emotion === 'fear') {
    eyeRadius = 12 * s;
    pupilRadius = 6 * s;
  }

  const maxPupilOffset = (eyeRadius - pupilRadius) * 0.9;
  let pupilDx = (isLeft ? -1 : 1) * 2 * s;
  let pupilDy = 0;
  if (eyeTrack) {
    pupilDx = eyeTrack.x * maxPupilOffset;
    pupilDy = eyeTrack.y * maxPupilOffset;
  }

  ctx.beginPath(); ctx.arc(x, y, eyeRadius, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2 * s; ctx.stroke();
  ctx.beginPath(); ctx.arc(x + pupilDx, y + pupilDy, pupilRadius, 0, Math.PI * 2); ctx.fillStyle = '#1a1a2e'; ctx.fill();
  ctx.beginPath(); ctx.arc(x + pupilDx + (isLeft ? -1 : 1) * 1 * s, y + pupilDy - 3 * s, 2 * s, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
}

export function drawCatFace(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 1, emotion: Emotion = 'neutral', eyeTrack?: EyeTrack): void {
  const s = scale;
  ctx.beginPath(); ctx.arc(x, y, 45 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24'; ctx.fill(); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3 * s; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 35 * s, y - 35 * s); ctx.lineTo(x - 20 * s, y - 55 * s); ctx.lineTo(x - 8 * s, y - 35 * s); ctx.closePath();
  ctx.fillStyle = '#fbbf24'; ctx.fill(); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2 * s; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 30 * s, y - 38 * s); ctx.lineTo(x - 20 * s, y - 50 * s); ctx.lineTo(x - 12 * s, y - 38 * s); ctx.closePath();
  ctx.fillStyle = '#fca5a5'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 35 * s, y - 35 * s); ctx.lineTo(x + 20 * s, y - 55 * s); ctx.lineTo(x + 8 * s, y - 35 * s); ctx.closePath();
  ctx.fillStyle = '#fbbf24'; ctx.fill(); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2 * s; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 30 * s, y - 38 * s); ctx.lineTo(x + 20 * s, y - 50 * s); ctx.lineTo(x + 12 * s, y - 38 * s); ctx.closePath();
  ctx.fillStyle = '#fca5a5'; ctx.fill();
  drawEye(ctx, x - 15 * s, y - 8 * s, s, emotion, true, eyeTrack);
  drawEye(ctx, x + 15 * s, y - 8 * s, s, emotion, false, eyeTrack);
  ctx.beginPath(); ctx.arc(x, y + 15 * s, 8 * s, 0, Math.PI); ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2 * s; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y + 5 * s, 3 * s, 0, Math.PI * 2); ctx.fillStyle = '#fca5a5'; ctx.fill();
}

export function drawDogFace(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 1, emotion: Emotion = 'neutral', eyeTrack?: EyeTrack): void {
  const s = scale;
  ctx.beginPath(); ctx.arc(x, y, 45 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#a78bfa'; ctx.fill(); ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 3 * s; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x - 30 * s, y - 15 * s, 12 * s, 22 * s, -0.3, 0, Math.PI * 2); ctx.fillStyle = '#8b5cf6'; ctx.fill(); ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2 * s; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x + 30 * s, y - 15 * s, 12 * s, 22 * s, 0.3, 0, Math.PI * 2); ctx.fillStyle = '#8b5cf6'; ctx.fill(); ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2 * s; ctx.stroke();
  drawEye(ctx, x - 15 * s, y - 8 * s, s, emotion, true, eyeTrack);
  drawEye(ctx, x + 15 * s, y - 8 * s, s, emotion, false, eyeTrack);
  ctx.beginPath(); ctx.ellipse(x, y + 12 * s, 12 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fillStyle = '#1a1a2e'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y + 5 * s, 5 * s, 0, Math.PI * 2); ctx.fillStyle = '#1a1a2e'; ctx.fill();
}

export function drawRabbitFace(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 1, emotion: Emotion = 'neutral', eyeTrack?: EyeTrack): void {
  const s = scale;
  ctx.beginPath(); ctx.arc(x, y, 40 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#f9a8d4'; ctx.fill(); ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 3 * s; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x - 15 * s, y - 55 * s, 7 * s, 25 * s, -0.1, 0, Math.PI * 2); ctx.fillStyle = '#f9a8d4'; ctx.fill(); ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 2 * s; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x - 15 * s, y - 55 * s, 4 * s, 20 * s, -0.1, 0, Math.PI * 2); ctx.fillStyle = '#fca5a5'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 15 * s, y - 55 * s, 7 * s, 25 * s, 0.1, 0, Math.PI * 2); ctx.fillStyle = '#f9a8d4'; ctx.fill(); ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 2 * s; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x + 15 * s, y - 55 * s, 4 * s, 20 * s, 0.1, 0, Math.PI * 2); ctx.fillStyle = '#fca5a5'; ctx.fill();
  drawEye(ctx, x - 12 * s, y - 5 * s, s, emotion, true, eyeTrack);
  drawEye(ctx, x + 12 * s, y - 5 * s, s, emotion, false, eyeTrack);
  ctx.beginPath(); ctx.ellipse(x, y + 8 * s, 5 * s, 4 * s, 0, 0, Math.PI * 2); ctx.fillStyle = '#fca5a5'; ctx.fill();
}

export function drawRoosterFace(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 1, emotion: Emotion = 'neutral', eyeTrack?: EyeTrack): void {
  const s = scale;
  ctx.beginPath(); ctx.arc(x, y, 45 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#fde68a'; ctx.fill(); ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 3 * s; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y - 48 * s, 9 * s, 0, Math.PI * 2); ctx.fillStyle = '#dc2626'; ctx.fill();
  ctx.beginPath(); ctx.arc(x - 7 * s, y - 55 * s, 6 * s, 0, Math.PI * 2); ctx.fillStyle = '#dc2626'; ctx.fill();
  ctx.beginPath(); ctx.arc(x + 7 * s, y - 55 * s, 6 * s, 0, Math.PI * 2); ctx.fillStyle = '#dc2626'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y - 5 * s, 6 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fillStyle = '#dc2626'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 5 * s, y + 15 * s); ctx.lineTo(x, y + 25 * s); ctx.lineTo(x + 5 * s, y + 15 * s); ctx.closePath();
  ctx.fillStyle = '#fbbf24'; ctx.fill(); ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 1.5 * s; ctx.stroke();
  drawEye(ctx, x - 15 * s, y - 5 * s, s, emotion, true, eyeTrack);
  drawEye(ctx, x + 15 * s, y - 5 * s, s, emotion, false, eyeTrack);
}

export function drawPigFace(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 1, emotion: Emotion = 'neutral', eyeTrack?: EyeTrack): void {
  const s = scale;
  ctx.beginPath(); ctx.arc(x, y, 45 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#fda4af'; ctx.fill(); ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 3 * s; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x - 32 * s, y - 25 * s, 12 * s, 16 * s, -0.5, 0, Math.PI * 2); ctx.fillStyle = '#fda4af'; ctx.fill(); ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2 * s; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x + 32 * s, y - 25 * s, 12 * s, 16 * s, 0.5, 0, Math.PI * 2); ctx.fillStyle = '#fda4af'; ctx.fill(); ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2 * s; ctx.stroke();
  drawEye(ctx, x - 15 * s, y - 8 * s, s, emotion, true, eyeTrack);
  drawEye(ctx, x + 15 * s, y - 8 * s, s, emotion, false, eyeTrack);
  ctx.beginPath(); ctx.ellipse(x, y + 8 * s, 14 * s, 10 * s, 0, 0, Math.PI * 2); ctx.fillStyle = '#fca5a5'; ctx.fill(); ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 1.5 * s; ctx.stroke();
  ctx.beginPath(); ctx.arc(x - 5 * s, y + 6 * s, 3 * s, 0, Math.PI * 2); ctx.fillStyle = '#f43f5e'; ctx.fill();
  ctx.beginPath(); ctx.arc(x + 5 * s, y + 6 * s, 3 * s, 0, Math.PI * 2); ctx.fillStyle = '#f43f5e'; ctx.fill();
}

export function drawCowFace(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 1, emotion: Emotion = 'neutral', eyeTrack?: EyeTrack): void {
  const s = scale;
  ctx.beginPath(); ctx.arc(x, y, 45 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#e5e7eb'; ctx.fill(); ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 3 * s; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x - 35 * s, y - 20 * s, 10 * s, 18 * s, -0.4, 0, Math.PI * 2); ctx.fillStyle = '#d1d5db'; ctx.fill(); ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 2 * s; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x + 35 * s, y - 20 * s, 10 * s, 18 * s, 0.4, 0, Math.PI * 2); ctx.fillStyle = '#d1d5db'; ctx.fill(); ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 2 * s; ctx.stroke();
  drawEye(ctx, x - 15 * s, y - 8 * s, s, emotion, true, eyeTrack);
  drawEye(ctx, x + 15 * s, y - 8 * s, s, emotion, false, eyeTrack);
  ctx.beginPath(); ctx.ellipse(x, y + 10 * s, 16 * s, 10 * s, 0, 0, Math.PI * 2); ctx.fillStyle = '#fca5a5'; ctx.fill(); ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 2 * s; ctx.stroke();
  ctx.beginPath(); ctx.arc(x - 20 * s, y - 5 * s, 6 * s, 0, Math.PI * 2); ctx.fillStyle = '#1a1a2e'; ctx.fill();
  ctx.beginPath(); ctx.arc(x + 12 * s, y + 8 * s, 5 * s, 0, Math.PI * 2); ctx.fillStyle = '#1a1a2e'; ctx.fill();
}

export function drawSheepFace(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 1, emotion: Emotion = 'neutral', eyeTrack?: EyeTrack): void {
  const s = scale;
  const bumps = [[-28, -20], [0, -28], [28, -20], [-22, 8], [22, 8], [0, 10], [-10, -15], [10, -15]];
  for (const [bx, by] of bumps) {
    ctx.beginPath(); ctx.arc(x + bx * s, y + by * s, 22 * s, 0, Math.PI * 2); ctx.fillStyle = '#e7e5e4'; ctx.fill();
  }
  ctx.beginPath(); ctx.arc(x, y - 2 * s, 35 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#f5f5f4'; ctx.fill(); ctx.strokeStyle = '#a8a29e'; ctx.lineWidth = 2.5 * s; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x - 30 * s, y - 8 * s, 10 * s, 16 * s, -0.3, 0, Math.PI * 2); ctx.fillStyle = '#d6d3d1'; ctx.fill(); ctx.strokeStyle = '#a8a29e'; ctx.lineWidth = 1.5 * s; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x + 30 * s, y - 8 * s, 10 * s, 16 * s, 0.3, 0, Math.PI * 2); ctx.fillStyle = '#d6d3d1'; ctx.fill(); ctx.strokeStyle = '#a8a29e'; ctx.lineWidth = 1.5 * s; ctx.stroke();
  drawEye(ctx, x - 12 * s, y - 5 * s, s, emotion, true, eyeTrack);
  drawEye(ctx, x + 12 * s, y - 5 * s, s, emotion, false, eyeTrack);
  ctx.beginPath(); ctx.ellipse(x, y + 8 * s, 8 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fillStyle = '#fca5a5'; ctx.fill();
}
