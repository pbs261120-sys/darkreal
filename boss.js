/**
 * 100 Days Below - Day 100 Final Boss: The Abyssal Behemoth (심연의 지배자)
 * 3단계 페이즈, 다중 신체 부위, 산성 폭우 및 레이저 탄막을 구현합니다.
 */

class BossSystem {
  constructor() {
    this.isActive = false;
    this.isDefeated = false;
    this.x = 512;
    this.y = 150;
    this.phase = 1; // 1: 거대 분쇄 팔, 2: 노출된 기계 심장, 3: 광폭화 붕괴

    this.maxHp = 2500;
    this.hp = 2500;

    // 신체 부위
    this.leftArm = { x: 280, y: 220, radius: 45, hp: 600, maxHp: 600, isDestroyed: false, slamTimer: 2.0 };
    this.rightArm = { x: 744, y: 220, radius: 45, hp: 600, maxHp: 600, isDestroyed: false, slamTimer: 3.5 };
    this.core = { x: 512, y: 150, radius: 40, isExposed: false };

    this.attackTimer = 0;
    this.laserAngle = 0;
    this.pulseAnim = 0;
  }

  init(x, y) {
    this.x = x;
    this.y = y;
    this.isActive = true;
    this.isDefeated = false;
    this.phase = 1;
    this.maxHp = 2500;
    this.hp = 2500;

    this.leftArm = { x: 280, y: 220, radius: 45, hp: 600, maxHp: 600, isDestroyed: false, slamTimer: 2.0 };
    this.rightArm = { x: 744, y: 220, radius: 45, hp: 600, maxHp: 600, isDestroyed: false, slamTimer: 3.5 };
    this.core.isExposed = false;

    this.updateBossHud();
  }

  takeDamage(amount) {
    if (!this.isActive || this.isDefeated) return;
    this.hp = Math.max(0, this.hp - amount);
    this.updateBossHud();

    // 페이즈 전환 검사
    if (this.phase === 1 && (this.leftArm.isDestroyed && this.rightArm.isDestroyed || this.hp < 1800)) {
      this.phase = 2;
      this.core.isExposed = true;
      if (window.showToast) {
        window.showToast("[PHASE 2] 보스의 심장 코어가 노출되었습니다!");
      }
      if (window.soundSystem) window.soundSystem.playBossRoar();
    } else if (this.phase === 2 && this.hp < 800) {
      this.phase = 3;
      if (window.showToast) {
        window.showToast("[PHASE 3] 심연 붕괴 - 보스가 광폭화되었습니다!");
      }
      if (window.soundSystem) window.soundSystem.playBossRoar();
    }

    if (this.hp <= 0 && !this.isDefeated) {
      this.isDefeated = true;
      if (window.showToast) {
        window.showToast("심연의 핵 파괴 완료! 최하층에서 생존했습니다!");
      }
    }
  }

  // 투사체 충돌 판정
  checkHit(proj) {
    if (!this.isActive || this.isDefeated) return false;
    if (!proj.hitBossParts) proj.hitBossParts = new Set();

    // 1. 왼팔 피격
    if (!this.leftArm.isDestroyed && !proj.hitBossParts.has('leftArm')) {
      if (Math.hypot(proj.x - this.leftArm.x, proj.y - this.leftArm.y) < proj.radius + this.leftArm.radius) {
        this.leftArm.hp -= proj.damage;
        proj.hitBossParts.add('leftArm');
        this.takeDamage(proj.damage * 0.5);
        if (this.leftArm.hp <= 0) {
          this.leftArm.isDestroyed = true;
          this.takeDamage(200);
        }
        return true;
      }
    }

    // 2. 오른팔 피격
    if (!this.rightArm.isDestroyed && !proj.hitBossParts.has('rightArm')) {
      if (Math.hypot(proj.x - this.rightArm.x, proj.y - this.rightArm.y) < proj.radius + this.rightArm.radius) {
        this.rightArm.hp -= proj.damage;
        proj.hitBossParts.add('rightArm');
        this.takeDamage(proj.damage * 0.5);
        if (this.rightArm.hp <= 0) {
          this.rightArm.isDestroyed = true;
          this.takeDamage(200);
        }
        return true;
      }
    }

    // 3. 중앙 코어 피격
    const coreDist = Math.hypot(proj.x - this.core.x, proj.y - this.core.y);
    if (!proj.hitBossParts.has('core') && coreDist < proj.radius + this.core.radius) {
      proj.hitBossParts.add('core');
      const dmgMult = this.core.isExposed ? 1.5 : 0.6;
      this.takeDamage(proj.damage * dmgMult);
      return true;
    }

    return false;
  }

  update(dt, player, combatSystem) {
    if (!this.isActive || this.isDefeated) return;

    this.pulseAnim += 3 * dt;
    this.attackTimer += dt;

    // Phase 1 패턴: 양팔 내리찍기 & 충격파
    if (this.phase === 1) {
      this.updateArmSlam(this.leftArm, dt, player, combatSystem);
      this.updateArmSlam(this.rightArm, dt, player, combatSystem);

      // 주기적 산성 침 발사
      if (this.attackTimer > 2.2) {
        this.attackTimer = 0;
        this.fireAcidSpread(combatSystem);
      }
    } 
    // Phase 2 패턴: 코어 방전 & 산성 폭우 + 회전 탄막
    else if (this.phase === 2) {
      if (this.attackTimer > 1.2) {
        this.attackTimer = 0;
        this.fireBulletRing(combatSystem);
      }
      // 플레이어 방향으로 지속적인 유도 탄환
      if (Math.random() < 0.05) {
        const angle = Math.atan2(player.y - this.core.y, player.x - this.core.x);
        combatSystem.enemyProjectiles.push({
          x: this.core.x,
          y: this.core.y,
          vx: Math.cos(angle) * 220,
          vy: Math.sin(angle) * 220,
          radius: 8,
          damage: 22,
          color: "#ff0055",
          life: 3.0
        });
      }
    } 
    // Phase 3 패턴: 광폭화 전방위 레이저 & 탄막 지옥
    else if (this.phase === 3) {
      if (this.attackTimer > 0.7) {
        this.attackTimer = 0;
        this.fireBulletRing(combatSystem, 18);
        this.fireAcidSpread(combatSystem);
      }
    }
  }

  // 팔 내리찍기
  updateArmSlam(arm, dt, player, combatSystem) {
    if (arm.isDestroyed) return;
    arm.slamTimer -= dt;
    if (arm.slamTimer <= 0) {
      arm.slamTimer = 3.2 + Math.random() * 1.5;
      // 플레이어 쪽으로 급격한 내리찍기 후 복귀
      const slamX = player.x + (Math.random() - 0.5) * 80;
      const slamY = player.y + (Math.random() - 0.5) * 80;

      combatSystem.spawnSparks(slamX, slamY, "#ff2233", 25);
      combatSystem.createFloatingText(slamX, slamY - 30, "분쇄 강타!", "#ff2233");

      if (Math.hypot(player.x - slamX, player.y - slamY) < 90) {
        player.takeDamage(35, combatSystem);
      }
      if (window.soundSystem) window.soundSystem.playWeaponSound('shotgun');
    }
  }

  // 부채꼴 산성 침
  fireAcidSpread(combatSystem) {
    for (let i = -3; i <= 3; i++) {
      const angle = (Math.PI / 2) + i * 0.22;
      combatSystem.enemyProjectiles.push({
        x: this.core.x,
        y: this.core.y + 40,
        vx: Math.cos(angle) * 240,
        vy: Math.sin(angle) * 240,
        radius: 7,
        damage: 18,
        color: "#88ff22",
        life: 2.8
      });
    }
  }

  // 360도 링 탄막
  fireBulletRing(combatSystem, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + (this.pulseAnim * 0.2);
      combatSystem.enemyProjectiles.push({
        x: this.core.x,
        y: this.core.y,
        vx: Math.cos(angle) * 190,
        vy: Math.sin(angle) * 190,
        radius: 6,
        damage: 16,
        color: "#ff3344",
        life: 3.5
      });
    }
  }

  updateBossHud() {
    const fill = document.getElementById('boss-bar-fill');
    const text = document.getElementById('boss-hp-text');
    if (fill) {
      const pct = Math.max(0, (this.hp / this.maxHp) * 100);
      fill.style.width = `${pct}%`;
    }
    if (text) {
      text.innerText = `${Math.max(0, Math.round(this.hp))} / ${this.maxHp} HP (Phase ${this.phase})`;
    }
  }

  render(ctx) {
    if (!this.isActive) return;

    ctx.save();

    // 1. 거대 보스 상부 본체 (화면 천장 장악 유기체)
    ctx.fillStyle = "#1e0811";
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.lineTo(924, 0);
    ctx.lineTo(840, 180);
    ctx.lineTo(512, 230);
    ctx.lineTo(184, 180);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#441122";
    ctx.lineWidth = 4;
    ctx.stroke();

    // 살점 혈관 펄스 효과
    ctx.strokeStyle = "#aa1133";
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(300 + i * 80, 0);
      ctx.quadraticCurveTo(512, 120 + Math.sin(this.pulseAnim + i) * 15, 400 + i * 60, 180);
      ctx.stroke();
    }

    // 2. 왼팔 & 오른팔 (Phase 1 파괴 가능 부위)
    if (!this.leftArm.isDestroyed) {
      ctx.fillStyle = "#3a1420";
      ctx.beginPath();
      ctx.arc(this.leftArm.x, this.leftArm.y, this.leftArm.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ff2244";
      ctx.lineWidth = 3;
      ctx.stroke();

      // 팔 HP 바
      const leftRatio = this.leftArm.hp / this.leftArm.maxHp;
      ctx.fillStyle = "#ff2233";
      ctx.fillRect(this.leftArm.x - 30, this.leftArm.y + 55, 60 * leftRatio, 5);
    }

    if (!this.rightArm.isDestroyed) {
      ctx.fillStyle = "#3a1420";
      ctx.beginPath();
      ctx.arc(this.rightArm.x, this.rightArm.y, this.rightArm.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ff2244";
      ctx.lineWidth = 3;
      ctx.stroke();

      // 팔 HP 바
      const rightRatio = this.rightArm.hp / this.rightArm.maxHp;
      ctx.fillStyle = "#ff2233";
      ctx.fillRect(this.rightArm.x - 30, this.rightArm.y + 55, 60 * rightRatio, 5);
    }

    // 3. 중앙 기계-생체 심장 코어
    const coreGlow = 40 + Math.sin(this.pulseAnim * 2) * 8;
    const grad = ctx.createRadialGradient(this.core.x, this.core.y, 10, this.core.x, this.core.y, coreGlow);
    grad.addColorStop(0, this.core.isExposed ? "#ff3300" : "#990033");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.core.x, this.core.y, coreGlow, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.core.isExposed ? "#ffdd33" : "#550011";
    ctx.beginPath();
    ctx.arc(this.core.x, this.core.y, this.core.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }
}

window.bossSystem = new BossSystem();
