/**
 * 100 Days Below - Combat Engine & Card Execution System
 * 발사체, 충돌 판정, 파티클 효과, 카드 액션 처리
 */

class CombatSystem {
  constructor() {
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.acidPools = [];
    this.lootDrops = [];
  }

  reset() {
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.acidPools = [];
    this.lootDrops = [];
  }

  // 주무기 발사 처리
  fireWeapon(player, weapon) {
    const angle = player.aimAngle;
    const stats = weapon.stats;

    if (window.soundSystem) {
      window.soundSystem.playWeaponSound(stats.projectileType);
    }

    if (weapon.id === 'drill') {
      // 드릴: 초근접 관통 타격체 생성
      this.projectiles.push({
        x: player.x + Math.cos(angle) * 24,
        y: player.y + Math.sin(angle) * 24,
        vx: Math.cos(angle) * 280,
        vy: Math.sin(angle) * 280,
        radius: 18,
        damage: stats.atk,
        knockback: stats.knockback,
        life: 0.16,
        maxLife: 0.16,
        color: "#ffbb33",
        piercing: true,
        hitEnemies: new Set(),
        type: 'drill'
      });
      // 드릴 스파크
      this.spawnSparks(player.x + Math.cos(angle) * 30, player.y + Math.sin(angle) * 30, "#ffffff", 3);
    } else if (weapon.id === 'flamethrower') {
      // 화염방사기: 부채꼴로 3개의 화염 입자 방사
      for (let i = 0; i < 3; i++) {
        const spreadAngle = angle + (Math.random() - 0.5) * stats.spread;
        const speed = 260 + Math.random() * 80;
        this.projectiles.push({
          x: player.x + Math.cos(angle) * 26,
          y: player.y + Math.sin(angle) * 26,
          vx: Math.cos(spreadAngle) * speed,
          vy: Math.sin(spreadAngle) * speed,
          radius: 8 + Math.random() * 6,
          damage: stats.atk,
          knockback: stats.knockback,
          life: 0.5,
          maxLife: 0.5,
          color: Math.random() > 0.5 ? "#ff5511" : "#ffaa22",
          piercing: true,
          hitEnemies: new Set(),
          type: 'flame'
        });
      }
    } else if (weapon.id === 'shotgun') {
      // 샷건: 6발 펠릿 탄환 일제 발사
      for (let i = 0; i < stats.pellets; i++) {
        const spreadAngle = angle + (Math.random() - 0.5) * stats.spread;
        const speed = 480 + Math.random() * 80;
        this.projectiles.push({
          x: player.x + Math.cos(angle) * 28,
          y: player.y + Math.sin(angle) * 28,
          vx: Math.cos(spreadAngle) * speed,
          vy: Math.sin(spreadAngle) * speed,
          radius: 4,
          damage: stats.atk,
          knockback: stats.knockback,
          life: 0.45,
          maxLife: 0.45,
          color: "#ffffaa",
          piercing: false,
          type: 'shotgun'
        });
      }
      this.spawnSparks(player.x + Math.cos(angle) * 32, player.y + Math.sin(angle) * 32, "#ffdd44", 6);
    } else if (weapon.id === 'acid_gun') {
      // 산성총: 적 또는 사거리 끝에 닿으면 지속 피해 웅덩이를 남기는 탄환
      const spreadAngle = angle + (Math.random() - 0.5) * stats.spread;
      this.projectiles.push({
        x: player.x + Math.cos(angle) * 26,
        y: player.y + Math.sin(angle) * 26,
        vx: Math.cos(spreadAngle) * 360,
        vy: Math.sin(spreadAngle) * 360,
        radius: 9,
        damage: stats.atk,
        knockback: stats.knockback,
        life: stats.range / 360,
        maxLife: stats.range / 360,
        color: "#88ff33",
        piercing: false,
        createsPool: true,
        type: 'acid'
      });
    } else if (weapon.id === 'miner_pickaxe') {
      // 침식된 전기 곡괭이: 고전압 충격파
      this.projectiles.push({
        x: player.x + Math.cos(angle) * 28,
        y: player.y + Math.sin(angle) * 28,
        vx: Math.cos(angle) * 360,
        vy: Math.sin(angle) * 360,
        radius: 16,
        damage: stats.atk,
        knockback: stats.knockback,
        life: 0.25,
        maxLife: 0.25,
        color: "#33eeff",
        piercing: true,
        hitEnemies: new Set(),
        type: 'pickaxe'
      });
      this.spawnSparks(player.x + Math.cos(angle) * 30, player.y + Math.sin(angle) * 30, "#33eeff", 8);
    } else if (weapon.id === 'bio_gauntlet') {
      // 생체 도약 건틀릿: 초고속 펀치 탄환
      const spreadAngle = angle + (Math.random() - 0.5) * stats.spread;
      this.projectiles.push({
        x: player.x + Math.cos(angle) * 26,
        y: player.y + Math.sin(angle) * 26,
        vx: Math.cos(spreadAngle) * 540,
        vy: Math.sin(spreadAngle) * 540,
        radius: 7,
        damage: stats.atk,
        knockback: stats.knockback,
        life: 0.2,
        maxLife: 0.2,
        color: "#ff0066",
        piercing: false,
        type: 'gauntlet'
      });
    } else if (weapon.id === 'cutter_disc') {
      // 고속 회전 톱날: 벽면에 튕기는 톱날
      this.projectiles.push({
        x: player.x + Math.cos(angle) * 28,
        y: player.y + Math.sin(angle) * 28,
        vx: Math.cos(angle) * 440,
        vy: Math.sin(angle) * 440,
        radius: 10,
        damage: stats.atk,
        knockback: stats.knockback,
        life: 1.8,
        maxLife: 1.8,
        bounces: 3,
        color: "#ff2244",
        piercing: true,
        hitEnemies: new Set(),
        type: 'cutter'
      });
    } else if (weapon.id === 'flesh_whip') {
      // 피의 촉수 채찍: 타격 시 플레이어 체력 흡혈
      this.projectiles.push({
        x: player.x + Math.cos(angle) * 35,
        y: player.y + Math.sin(angle) * 35,
        vx: Math.cos(angle) * 320,
        vy: Math.sin(angle) * 320,
        radius: 20,
        damage: stats.atk,
        knockback: -8, // 적을 끌어당김!
        lifesteal: 2,
        life: 0.22,
        maxLife: 0.22,
        color: "#cc0022",
        piercing: true,
        hitEnemies: new Set(),
        type: 'whip'
      });
    } else if (weapon.id === 'void_cannon') {
      // 공허의 특이점 총: 주변을 흡수하는 중력 블랙홀 탄환
      this.projectiles.push({
        x: player.x + Math.cos(angle) * 30,
        y: player.y + Math.sin(angle) * 30,
        vx: Math.cos(angle) * 280,
        vy: Math.sin(angle) * 280,
        radius: 14,
        damage: stats.atk,
        knockback: 0,
        blackhole: true,
        life: 1.2,
        maxLife: 1.2,
        color: "#9900ff",
        piercing: true,
        hitEnemies: new Set(),
        type: 'void'
      });
      this.spawnSparks(player.x + Math.cos(angle) * 30, player.y + Math.sin(angle) * 30, "#d044ff", 12);
    }
  }

  // 필드 전리품 드롭 생성
  spawnLootDrop(x, y, itemKey) {
    const itemData = EQUIPMENT_DATA[itemKey];
    if (!itemData) return;

    if (!this.lootDrops) this.lootDrops = [];
    this.lootDrops.push({
      x: x,
      y: y,
      itemKey: itemKey,
      itemData: itemData,
      pulseAnim: 0,
      life: 90
    });
    this.createFloatingText(x, y - 25, `★ ${itemData.name} 드롭!`, "#ffd700");
    this.spawnSparks(x, y, "#ffd700", 15);
  }

  // 보조장비 자동 전기 충격기
  tryAutoTaser(player, subGear) {
    let nearestEnemy = null;
    let minDist = subGear.stats.zapRange;

    for (let e of window.currentStageEnemies || []) {
      if (!e.isDead) {
        const dist = Math.hypot(e.x - player.x, e.y - player.y);
        if (dist < minDist) {
          minDist = dist;
          nearestEnemy = e;
        }
      }
    }

    if (nearestEnemy) {
      nearestEnemy.hp -= subGear.stats.zapDamage;
      nearestEnemy.stunTimer = 1.2;
      this.createFloatingText(nearestEnemy.x, nearestEnemy.y - 15, `감전 -${subGear.stats.zapDamage}`, "#33eeff");
      this.spawnSparks(nearestEnemy.x, nearestEnemy.y, "#33eeff", 12);
      if (window.soundSystem) {
        window.soundSystem.playWeaponSound('drill');
      }
      return true;
    }
    return false;
  }

  // 전투 카드 발동 처리
  executeCard(player, cardIndex, enemies, boss) {
    const card = player.hand[cardIndex];
    if (!card || card.currentCooldown > 0) return false;

    // 펄스(마나) 소모 검사
    if (player.pulse < card.pulseCost) {
      this.createFloatingText(player.x, player.y - 30, "펄스(에너지) 부족!", "#ff3344");
      return false;
    }

    // HP 소모 검사 (변이 카드)
    if (card.hpCost && player.hp <= card.hpCost) {
      this.createFloatingText(player.x, player.y - 30, "생명력 부족!", "#ff3344");
      return false;
    }

    // 비용 지불
    player.pulse -= card.pulseCost;
    if (card.hpCost) {
      player.hp -= card.hpCost;
      this.spawnBloodParticles(player.x, player.y, "#990022", 15);
    }
    card.currentCooldown = card.cooldown;

    if (window.soundSystem) {
      window.soundSystem.playCardSound(card.type);
    }

    // 카드 효과 로직
    if (card.id === 'card_thrust') {
      // 급소 관통: 마우스 방향 돌진 관통 충격파
      const angle = player.aimAngle;
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          this.projectiles.push({
            x: player.x + Math.cos(angle) * (30 + i * 25),
            y: player.y + Math.sin(angle) * (30 + i * 25),
            vx: Math.cos(angle) * 550,
            vy: Math.sin(angle) * 550,
            radius: 22,
            damage: card.baseVal,
            knockback: 10,
            life: 0.35,
            maxLife: 0.35,
            color: "#ffffff",
            piercing: true,
            hitEnemies: new Set(),
            type: 'slash'
          });
        }, i * 30);
      }
      this.createFloatingText(player.x, player.y - 35, "급소 관통!", "#ffffff");
    } else if (card.id === 'card_shield') {
      // 생체 방어막 활성화
      player.shieldTimer = card.baseVal;
      this.createFloatingText(player.x, player.y - 35, "방어막 4초 전개!", "#33eeff");
      // 주변 적 넉백
      for (let e of enemies) {
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d < 160) {
          const pushAngle = Math.atan2(e.y - player.y, e.x - player.x);
          e.x += Math.cos(pushAngle) * 60;
          e.y += Math.sin(pushAngle) * 60;
        }
      }
    } else if (card.id === 'card_shock') {
      // 신경 마비 방전 (EMP)
      const empRadius = 180;
      this.spawnSparks(player.x, player.y, "#33ffff", 30);
      this.createFloatingText(player.x, player.y - 35, "신경 마비 방전!", "#33eeff");
      for (let e of enemies) {
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d <= empRadius) {
          e.hp -= card.baseVal;
          e.stunTimer = 2.0;
          this.createFloatingText(e.x, e.y - 15, `기절 -${card.baseVal}`, "#33eeff");
        }
      }
      if (boss && boss.isActive) {
        boss.takeDamage(card.baseVal);
      }
    } else if (card.id === 'card_flesh_burst') {
      // 살점 과부하: 12방향 피의 촉수 폭발
      for (let i = 0; i < 12; i++) {
        const spikeAngle = (Math.PI * 2 / 12) * i;
        this.projectiles.push({
          x: player.x,
          y: player.y,
          vx: Math.cos(spikeAngle) * 420,
          vy: Math.sin(spikeAngle) * 420,
          radius: 9,
          damage: card.baseVal,
          knockback: 8,
          life: 0.6,
          maxLife: 0.6,
          color: "#cc0033",
          piercing: true,
          hitEnemies: new Set(),
          type: 'blood_spike'
        });
      }
      this.createFloatingText(player.x, player.y - 35, "살점 과부하!", "#ff2244");
    } else if (card.id === 'card_overcharge') {
      // 배터리 과충전
      player.battery = Math.min(player.maxBattery, player.battery + card.baseVal);
      this.createFloatingText(player.x, player.y - 35, `배터리 +${card.baseVal}!`, "#ffdd33");
      this.spawnSparks(player.x, player.y, "#ffff55", 20);
    }

    return true;
  }

  // 가시 반사 발동
  triggerThornBurst(x, y, damage) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      this.projectiles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * 350,
        vy: Math.sin(angle) * 350,
        radius: 5,
        damage: damage,
        knockback: 4,
        life: 0.35,
        maxLife: 0.35,
        color: "#aa2266",
        piercing: false,
        type: 'thorn'
      });
    }
  }

  update(dt, player, enemies, boss) {
    // 1. 아군 발사체 업데이트
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // 회전 톱날은 화면 가장자리에서 반사한다.
      if (p.bounces && (p.x - p.radius < 0 || p.x + p.radius > 1024)) {
        p.vx *= -1;
        p.x = Math.max(p.radius, Math.min(1024 - p.radius, p.x));
        p.bounces--;
      }
      if (p.bounces && (p.y - p.radius < 0 || p.y + p.radius > 720)) {
        p.vy *= -1;
        p.y = Math.max(p.radius, Math.min(720 - p.radius, p.y));
        p.bounces--;
      }

      // 공허 탄환은 주변 적을 중심으로 끌어당긴다.
      if (p.blackhole) {
        for (const e of enemies) {
          if (e.isDead) continue;
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          if (dist > 0 && dist < 150) {
            const pull = (1 - dist / 150) * 90 * dt;
            e.x += (p.x - e.x) / dist * pull;
            e.y += (p.y - e.y) / dist * pull;
          }
        }
      }

      // 산성 잔여 웅덩이 생성
      if (p.life <= 0) {
        if (p.createsPool) {
          this.acidPools.push({ x: p.x, y: p.y, radius: 24, duration: 4.0, dps: 18 });
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      // 적과의 충돌 검사
      for (let e of enemies) {
        if (e.isDead) continue;
        if (p.hitEnemies && p.hitEnemies.has(e)) continue;

        const dist = Math.hypot(e.x - p.x, e.y - p.y);
        if (dist < p.radius + e.size) {
          e.hp -= p.damage;
          this.createFloatingText(e.x, e.y - 15, `-${p.damage}`, p.color);
          this.spawnBloodParticles(e.x, e.y, e.color, 6);

          // 넉백 적용
          if (p.knockback) {
            const kbAngle = Math.atan2(e.y - p.y, e.x - p.x);
            e.x += Math.cos(kbAngle) * p.knockback * 4;
            e.y += Math.sin(kbAngle) * p.knockback * 4;
          }

          if (window.soundSystem) window.soundSystem.playEnemyHit();

          if (p.piercing) {
            p.hitEnemies.add(e);
          } else {
            if (p.createsPool) {
              this.acidPools.push({ x: p.x, y: p.y, radius: 24, duration: 4.0, dps: 18 });
            }
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }

      // 보스와의 충돌 검사
      if (boss && boss.isActive && this.projectiles[i]) {
        if (boss.checkHit(p)) {
          if (!p.piercing) {
            this.projectiles.splice(i, 1);
          }
        }
      }
    }

    // 2. 적 발사체 업데이트
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.enemyProjectiles[i];
      ep.x += ep.vx * dt;
      ep.y += ep.vy * dt;
      ep.life -= dt;

      if (ep.life <= 0) {
        this.enemyProjectiles.splice(i, 1);
        continue;
      }

      // 플레이어 피격 검사
      const dist = Math.hypot(player.x - ep.x, player.y - ep.y);
      if (dist < ep.radius + player.radius) {
        player.takeDamage(ep.damage, this);
        this.enemyProjectiles.splice(i, 1);
      }
    }

    // 3. 산성 웅덩이 업데이트
    for (let i = this.acidPools.length - 1; i >= 0; i--) {
      const pool = this.acidPools[i];
      pool.duration -= dt;
      if (pool.duration <= 0) {
        this.acidPools.splice(i, 1);
        continue;
      }

      // 웅덩이 위 적에게 지속 피해
      for (let e of enemies) {
        if (e.isDead) continue;
        if (Math.hypot(e.x - pool.x, e.y - pool.y) < pool.radius + e.size) {
          e.hp -= pool.dps * dt;
        }
      }
    }

    // 3.5. 필드 장비 전리품 획득
    for (let i = this.lootDrops.length - 1; i >= 0; i--) {
      const drop = this.lootDrops[i];
      drop.pulseAnim += dt;
      drop.life -= dt;
      if (drop.life <= 0) {
        this.lootDrops.splice(i, 1);
        continue;
      }
      if (Math.hypot(player.x - drop.x, player.y - drop.y) < player.radius + 22) {
        player.addToInventory(drop.itemData);
        this.lootDrops.splice(i, 1);
      }
    }

    // 4. 파티클 업데이트
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    // 5. 플로팅 텍스트 업데이트
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 35 * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  createFloatingText(x, y, text, color = "#ffffff") {
    this.floatingTexts.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y,
      text: text,
      color: color,
      life: 0.8,
      maxLife: 0.8
    });
  }

  spawnBloodParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 110;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 2.5,
        color: color,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7
      });
    }
  }

  spawnSparks(x, y, color, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 160;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5,
        color: color,
        life: 0.2 + Math.random() * 0.2,
        maxLife: 0.4
      });
    }
  }

  render(ctx) {
    // 산성 웅덩이
    for (let pool of this.acidPools) {
      ctx.save();
      ctx.fillStyle = "rgba(102, 255, 34, 0.35)";
      ctx.beginPath();
      ctx.arc(pool.x, pool.y, pool.radius, 0, Math.PI * 2);
      ctx.fill();
      // 보글거리는 기포
      ctx.fillStyle = "#88ff33";
      ctx.beginPath();
      ctx.arc(pool.x + Math.sin(Date.now() / 200) * 8, pool.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 아군 발사체
    for (let p of this.projectiles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 적 발사체
    for (let ep of this.enemyProjectiles) {
      ctx.save();
      ctx.fillStyle = ep.color;
      ctx.shadowColor = ep.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(ep.x, ep.y, ep.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 필드 장비 전리품
    for (let drop of this.lootDrops) {
      ctx.save();
      const glow = 13 + Math.sin(drop.pulseAnim * 5) * 3;
      ctx.fillStyle = "rgba(255, 215, 0, 0.22)";
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, glow + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(drop.x - 8, drop.y - 8, 16, 16);
      ctx.strokeStyle = "#fff4b0";
      ctx.strokeRect(drop.x - 8, drop.y - 8, 16, 16);
      ctx.fillStyle = "#fff4b0";
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('★', drop.x, drop.y + 4);
      ctx.restore();
    }

    // 파티클
    for (let pt of this.particles) {
      ctx.save();
      ctx.globalAlpha = pt.life / pt.maxLife;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, pt.radius * 2, pt.radius * 2);
      ctx.restore();
    }

    // 플로팅 텍스트
    for (let ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.life / ft.maxLife;
      ctx.font = 'bold 12px "Share Tech Mono", monospace';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 4;
      ctx.textAlign = "center";
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}
