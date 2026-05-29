import { CharacterInstance, CollisionResult, CollisionEvent, Position } from '@/types';

export class CollisionEngine {
  private restitution = 0.95;
  private cooldownMs = 200;
  private separationIterations = 4;
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

      if (velAlongNormal > 0) {
        const impulse = -(1 + this.restitution) * velAlongNormal / 2;
        a.velocity.x += impulse * col.normal.x;
        a.velocity.y += impulse * col.normal.y;
        b.velocity.x -= impulse * col.normal.x;
        b.velocity.y -= impulse * col.normal.y;
        a.freeBounceUntil = -1;
        b.freeBounceUntil = -1;
      }

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
            const overlap = minDist - dist;
            const correction = overlap / 2 + 0.5;
            a.position.x -= nx * correction;
            a.position.y -= ny * correction;
            b.position.x += nx * correction;
            b.position.y += ny * correction;
            if (iter === 0) {
              const pushSpeed = 0.8 + overlap * 0.02;
              a.velocity.x -= nx * pushSpeed;
              a.velocity.y -= ny * pushSpeed;
              b.velocity.x += nx * pushSpeed;
              b.velocity.y += ny * pushSpeed;
              a.freeBounceUntil = -1;
              b.freeBounceUntil = -1;
            }
          }
        }
      }
      if (!hadOverlap) break;
    }
  }

  private wallRestitution = 0.8;
  private cornerRadius = 12;

  clampToBounds(characters: CharacterInstance[], width: number, height: number): void {
    for (const c of characters) {
      const minX = c.radius;
      const maxX = width - c.radius;
      const minY = c.radius;
      const maxY = height - c.radius;
      const cr = this.cornerRadius;

      const inCornerX = c.position.x < cr || c.position.x > width - cr;
      const inCornerY = c.position.y < cr || c.position.y > height - cr;

      if (inCornerX && inCornerY) {
        let cx: number, cy: number;
        if (c.position.x < cr && c.position.y < cr) { cx = cr; cy = cr; }
        else if (c.position.x > width - cr && c.position.y < cr) { cx = width - cr; cy = cr; }
        else if (c.position.x < cr && c.position.y > height - cr) { cx = cr; cy = height - cr; }
        else { cx = width - cr; cy = height - cr; }

        const dx = c.position.x - cx;
        const dy = c.position.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = cr - c.radius;

        if (maxDist > 0 && dist > maxDist && dist > 0.01) {
          const nx = dx / dist;
          const ny = dy / dist;
          c.position.x = cx + nx * maxDist;
          c.position.y = cy + ny * maxDist;
          const vn = c.velocity.x * nx + c.velocity.y * ny;
          if (vn > 0) {
            c.velocity.x -= (1 + this.wallRestitution) * vn * nx;
            c.velocity.y -= (1 + this.wallRestitution) * vn * ny;
          }
        }
        continue;
      }

      if (c.position.x < minX) {
        c.position.x = minX;
        if (c.velocity.x < 0) {
          c.velocity.x = -c.velocity.x * this.wallRestitution;
        }
      }
      if (c.position.x > maxX) {
        c.position.x = maxX;
        if (c.velocity.x > 0) {
          c.velocity.x = -c.velocity.x * this.wallRestitution;
        }
      }
      if (c.position.y < minY) {
        c.position.y = minY;
        if (c.velocity.y < 0) {
          c.velocity.y = -c.velocity.y * this.wallRestitution;
        }
      }
      if (c.position.y > maxY) {
        c.position.y = maxY;
        if (c.velocity.y > 0) {
          c.velocity.y = -c.velocity.y * this.wallRestitution;
        }
      }
    }
  }
}
