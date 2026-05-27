import { CharacterInstance, CollisionResult, CollisionEvent, Position } from '@/types';

export class CollisionEngine {
  private restitution = 0.6;
  private cooldownMs = 500;
  private separationIterations = 8;
  private onCollisionCallback: ((event: CollisionEvent) => void) | null = null;

  setOnCollision(cb: (event: CollisionEvent) => void): void {
    this.onCollisionCallback = cb;
  }

  detectCollisions(characters: CharacterInstance[]): CollisionResult[] {
    const results: CollisionResult[] = [];
    for (let i = 0; i < characters.length; i++) {
      for (let j = i + 1; j < characters.length; j++) {
        const a = characters[i];
        const b = characters[j];
        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + b.radius;
        if (dist < minDist && dist > 0.01) {
          const nx = dx / dist;
          const ny = dy / dist;
          results.push({
            pair: [a.id, b.id],
            normal: { x: nx, y: ny },
            overlap: minDist - dist,
            point: {
              x: a.position.x + nx * a.radius,
              y: a.position.y + ny * a.radius,
            },
          });
        }
      }
    }
    return results;
  }

  resolveCollisions(
    characters: CharacterInstance[],
    collisions: CollisionResult[],
    now: number,
  ): void {
    const charMap = new Map<string, CharacterInstance>();
    for (const c of characters) charMap.set(c.id, c);

    for (const col of collisions) {
      const a = charMap.get(col.pair[0]);
      const b = charMap.get(col.pair[1]);
      if (!a || !b) continue;

      const bothCoolingDown =
        now - a.collisionCooldown < this.cooldownMs &&
        now - b.collisionCooldown < this.cooldownMs;

      const relVx = a.velocity.x - b.velocity.x;
      const relVy = a.velocity.y - b.velocity.y;
      const velAlongNormal = relVx * col.normal.x + relVy * col.normal.y;

      if (velAlongNormal > 0 && bothCoolingDown) continue;

      const impulse = -(1 + this.restitution) * velAlongNormal / 2;

      a.velocity.x += impulse * col.normal.x;
      a.velocity.y += impulse * col.normal.y;
      b.velocity.x -= impulse * col.normal.x;
      b.velocity.y -= impulse * col.normal.y;

      a.collisionCooldown = now;
      b.collisionCooldown = now;

      if (this.onCollisionCallback && !bothCoolingDown) {
        this.onCollisionCallback({
          time: now,
          result: col,
          typeA: a.type,
          typeB: b.type,
        });
      }
    }
  }

  separateOverlapping(characters: CharacterInstance[]): void {
    const charMap = new Map<string, CharacterInstance>();
    for (const c of characters) charMap.set(c.id, c);

    for (let iter = 0; iter < this.separationIterations; iter++) {
      let hadOverlap = false;
      for (let i = 0; i < characters.length; i++) {
        for (let j = i + 1; j < characters.length; j++) {
          const a = characters[i];
          const b = characters[j];
          const dx = b.position.x - a.position.x;
          const dy = b.position.y - a.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = a.radius + b.radius;
          if (dist < minDist) {
            hadOverlap = true;
            const safeDist = dist > 0.01 ? dist : 0.01;
            const nx = dx / safeDist;
            const ny = dy / safeDist;
            const correction = (minDist - dist) / 2 + 0.5;
            a.position.x -= nx * correction;
            a.position.y -= ny * correction;
            b.position.x += nx * correction;
            b.position.y += ny * correction;
          }
        }
      }
      if (!hadOverlap) break;
    }
  }

  clampToBounds(characters: CharacterInstance[], width: number, height: number): void {
    for (const c of characters) {
      const minX = c.radius;
      const maxX = width - c.radius;
      const minY = c.radius;
      const maxY = height - c.radius;
      if (c.position.x < minX) { c.position.x = minX; c.velocity.x = Math.abs(c.velocity.x) * 0.5; }
      if (c.position.x > maxX) { c.position.x = maxX; c.velocity.x = -Math.abs(c.velocity.x) * 0.5; }
      if (c.position.y < minY) { c.position.y = minY; c.velocity.y = Math.abs(c.velocity.y) * 0.5; }
      if (c.position.y > maxY) { c.position.y = maxY; c.velocity.y = -Math.abs(c.velocity.y) * 0.5; }
    }
  }
}
