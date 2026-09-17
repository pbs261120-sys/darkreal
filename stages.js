/**
 * 100 Days Below - Stage Generator & 100-Day Descent Manager
 * "동굴 안에 폐쇄/침식된 지하시설" 환경 생성기
 * 천연 암반 동굴, 파손된 콘크리트 슬래브, H-빔 철골 지지대, 비상 조명등, 유기물 침식 등을 구현합니다.
 */

const CHECKPOINT_SAVE_KEY = '100-days-below-checkpoint-v1';

class StageManager {
  constructor() {
    this.currentDay = 1;
    this.maxDay = 100;
    this.checkpointDay = this.loadCheckpoint();
    this.currentBiome = null;
    this.enemies = [];
    this.obstacles = [];
    this.facilityLamps = []; // 비상등 조명점 (player.renderLighting 연동)
    this.concreteSlabs = []; // 동굴 속 콘크리트 시설 바닥 구역
    this.steelBeams = [];    // 천장/벽면을 지탱하는 녹슨 H-빔
    this.cables = [];        // 바닥을 지나는 굵은 전력 케이블
    this.cavernPerimeter = []; // 자연 암벽 윤곽선
    this.elevator = null;
    this.isCleared = false;
  }

  loadCheckpoint() {
    try {
      const val = parseInt(localStorage.getItem(CHECKPOINT_SAVE_KEY), 10);
      return (!isNaN(val) && val >= 10) ? val : 1;
    } catch (_) {
      return 1;
    }
  }

  saveCheckpoint(day) {
    try {
      if (day > this.checkpointDay) {
        this.checkpointDay = day;
        localStorage.setItem(CHECKPOINT_SAVE_KEY, day.toString());
      }
    } catch (_) {}
  }

  resetCheckpoint() {
    this.checkpointDay = 1;
    try { localStorage.removeItem(CHECKPOINT_SAVE_KEY); } catch (_) {}
  }

  // 일차 설정 및 스테이지 초기화
  initDay(day, player, bossSystem) {
    this.currentDay = Math.min(this.maxDay, Math.max(1, day));
    this.currentBiome = this.getBiomeForDay(this.currentDay);
    this.isCleared = false;
    this.enemies = [];
    this.obstacles = [];
    this.facilityLamps = [];
    this.concreteSlabs = [];
    this.steelBeams = [];
    this.cables = [];
    this.elevator = null;

    // 보스 플로어 (100일차)
    if (this.currentDay === 100) {
      this.initBossArena(player, bossSystem);
      return;
    }

    if (bossSystem) bossSystem.isActive = false;

    // 플레이어 시작 위치
    player.x = 512;
    player.y = 120;

    // 동굴 속 폐쇄 시설 지형 생성
    this.generateCavernFacility();

    // 적 스폰
    this.spawnWave();

    // 일차 변경 토스트 알림
    if (window.showToast) {
      window.showToast(`[DAY ${this.currentDay}] ${this.currentBiome.name}`);
    }

    // 10일 주기 체크포인트 자동 저장 (10, 20, 30, 40, 50, 60, 70, 80, 90)
    if (this.currentDay >= 10 && this.currentDay % 10 === 0 && this.currentDay > this.checkpointDay) {
      this.saveCheckpoint(this.currentDay);
      setTimeout(() => {
        if (window.showToast) {
          window.showToast(`🏁 [체크포인트 도달] DAY ${this.currentDay} - 비상 귀환 지점이 등록되었습니다!`);
        }
      }, 1200);
    }

    if (window.updateHUD) window.updateHUD();
  }

  getBiomeForDay(day) {
    for (let b of BIOMES) {
      if (day >= b.range[0] && day <= b.range[1]) {
        return b;
      }
    }
    return BIOMES[0];
  }

  // 동굴 속 폐쇄 지하시설 절차적 생성
  generateCavernFacility() {
    // 1. 천연 암벽 경계선 (울퉁불퉁한 동굴 벽)
    this.cavernPerimeter = [];
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const topOffset = 25 + Math.sin(i * 1.5) * 12 + Math.random() * 8;
      const bottomOffset = 690 - (Math.sin(i * 1.2) * 12 + Math.random() * 8);
      this.cavernPerimeter.push({ x: (1024 / segments) * i, topY: topOffset, botY: bottomOffset });
    }

    // 2. 동굴 바닥에 묻힌 콘크리트 슬래브 (폐쇄 시설 구역)
    const slabCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < slabCount; i++) {
      this.concreteSlabs.push({
        x: 140 + Math.random() * 580,
        y: 120 + Math.random() * 420,
        w: 160 + Math.random() * 180,
        h: 100 + Math.random() * 120,
        label: `SEC-${this.currentDay}-B${i + 1}`
      });
    }

    // 3. 동굴 벽면 비상 조명등 (가시성을 높여주는 은은한 광원)
    const lampPositions = [
      { x: 90, y: 160 },
      { x: 934, y: 160 },
      { x: 90, y: 560 },
      { x: 934, y: 560 },
      { x: 512, y: 60 }
    ];
    for (let pos of lampPositions) {
      this.facilityLamps.push({
        x: pos.x,
        y: pos.y,
        radius: 120,
        color: this.currentBiome.lampColor || '#ffaa33',
        seed: Math.random() * 10
      });
    }

    // 4. 낙석 방지용 H-빔 철골 지지대
    this.steelBeams = [
      { x: 180, y: 40, w: 22, h: 640 },
      { x: 820, y: 40, w: 22, h: 640 },
      { x: 200, y: 220, w: 620, h: 16, isHorizontal: true }
    ];

    // 5. 바닥 전선 케이블
    for (let i = 0; i < 3; i++) {
      this.cables.push({
        startX: 80 + Math.random() * 80,
        startY: 120 + Math.random() * 480,
        cp1X: 300 + Math.random() * 200,
        cp1Y: 200 + Math.random() * 300,
        cp2X: 600 + Math.random() * 200,
        cp2Y: 200 + Math.random() * 300,
        endX: 880 + Math.random() * 60,
        endY: 120 + Math.random() * 480
      });
    }

    // 6. 장애물 (종유석/바위 + 폐쇄 시설 방벽 + 유독물 드럼통)
    const obsCount = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < obsCount; i++) {
      const type = Math.random() > 0.4 ? 'BARRIER' : (Math.random() > 0.5 ? 'STALAGMITE' : 'BARRELS');
      const w = type === 'BARRELS' ? 36 : (type === 'BARRIER' ? 65 : 45);
      const h = type === 'BARRELS' ? 36 : (type === 'BARRIER' ? 38 : 45);
      const x = 180 + Math.random() * (1024 - 360 - w);
      const y = 180 + Math.random() * (720 - 320 - h);
      this.obstacles.push({ x, y, w, h, type });
    }
  }

  // 해당 층의 적 스폰
  spawnWave() {
    const count = Math.min(22, 4 + Math.floor(this.currentDay * 0.22));
    const types = this.currentBiome.enemyTypes || ["crawler_rat"];

    for (let i = 0; i < count; i++) {
      const typeKey = types[Math.floor(Math.random() * types.length)];
      const def = ENEMY_DEFS[typeKey] || ENEMY_DEFS.crawler_rat;

      const spawnX = 120 + Math.random() * (1024 - 240);
      const spawnY = 280 + Math.random() * 340;

      const hpScale = 1 + (this.currentDay - 1) * 0.055;
      const dmgScale = 1 + (this.currentDay - 1) * 0.03;

      this.enemies.push({
        id: `enemy_${i}`,
        typeKey: typeKey,
        name: def.name,
        grade: def.grade || MONSTER_GRADES.FRUIT, // 식물/나무 등급
        x: spawnX,
        y: spawnY,
        maxHp: Math.round(def.hp * hpScale),
        hp: Math.round(def.hp * hpScale),
        speed: def.speed * (0.9 + Math.random() * 0.2),
        size: def.size,
        color: def.color,
        eyeColor: def.eyeColor,
        damage: Math.round(def.damage * dmgScale),
        scrapDrop: Math.round(def.scrapDrop * (1 + this.currentDay * 0.02)),
        dropItemKey: def.dropItemKey,
        dropRate: def.dropRate || 0,
        spitsAcid: def.spitsAcid,
        attackPattern: def.attackPattern || 'melee',
        explodesOnDeath: def.explodesOnDeath,
        isDead: false,
        stunTimer: 0,
        attackCooldown: 0,
        spitCooldown: 2.0 + Math.random() * 2.0
      });
    }

    window.currentStageEnemies = this.enemies;
  }

  // 100일차 보스 아레나 준비
  initBossArena(player, bossSystem) {
    player.x = 512;
    player.y = 560;
    this.obstacles = [];
    this.enemies = [];
    this.facilityLamps = [
      { x: 120, y: 300, radius: 140, color: '#ff2233', seed: 1 },
      { x: 904, y: 300, radius: 140, color: '#ff2233', seed: 2 },
      { x: 512, y: 650, radius: 160, color: '#ffaa22', seed: 3 }
    ];
    window.currentStageEnemies = [];

    if (bossSystem) {
      bossSystem.init(512, 160);
    }

    if (window.soundSystem) {
      window.soundSystem.playBossRoar();
    }

    if (window.showToast) {
      window.showToast(`[DAY 100] 심연의 거대 동굴 공동 - 보스 출현!`);
    }

    const bossHud = document.getElementById('boss-hud');
    if (bossHud) bossHud.style.display = 'flex';
  }

  update(dt, player, combatSystem, bossSystem) {
    // 100일차 보스전 업데이트
    if (this.currentDay === 100) {
      if (bossSystem && bossSystem.isActive) {
        bossSystem.update(dt, player, combatSystem);
        if (bossSystem.isDefeated && !this.isCleared) {
          this.isCleared = true;
          if (window.bestiarySystem) window.bestiarySystem.recordKill('boss_behemoth', player);
          setTimeout(() => {
            if (window.showVictoryScreen) window.showVictoryScreen();
          }, 2000);
        }
      }
      return;
    }

    let allDead = true;

    // 일반 층 적 업데이트
    for (let e of this.enemies) {
      if (e.isDead) continue;

      if (e.hp <= 0) {
        e.isDead = true;
        if (window.bestiarySystem) window.bestiarySystem.recordKill(e.typeKey, player);
        player.scrap += e.scrapDrop;
        combatSystem.createFloatingText(e.x, e.y, `+${e.scrapDrop} G`, "#ffaa00");
        combatSystem.spawnBloodParticles(e.x, e.y, e.color, 14);

        // 고유 전리품은 확률 드롭이며, 같은 특수 개체를 3회 처치하면 반드시 한 번 획득한다.
        const killCount = player.killCounts[e.typeKey] || 0;
        if (e.dropItemKey && (Math.random() < e.dropRate || killCount % 3 === 0)) {
          combatSystem.spawnLootDrop(e.x, e.y, e.dropItemKey);
        }

        if (e.explodesOnDeath) {
          combatSystem.triggerThornBurst(e.x, e.y, e.damage);
        }

        if (window.soundSystem) window.soundSystem.playEnemyDie();
        continue;
      }

      allDead = false;

      if (e.stunTimer > 0) {
        e.stunTimer -= dt;
        continue;
      }

      if (e.attackCooldown > 0) e.attackCooldown -= dt;
      if (e.spitCooldown > 0) e.spitCooldown -= dt;

      const dist = Math.hypot(player.x - e.x, player.y - e.y);
      const angle = Math.atan2(player.y - e.y, player.x - e.x);

      // 종별 행동: 도감의 공략 데이터와 실제 전투 패턴을 일치시킨다.
      if (e.attackPattern === 'charge' && dist > 90 && dist < 280 && e.attackCooldown <= 0) {
        e.x += Math.cos(angle) * 420 * dt;
        e.y += Math.sin(angle) * 420 * dt;
        e.attackCooldown = 1.8;
      } else if (e.attackPattern === 'leap' && dist > 110 && dist < 340 && e.attackCooldown <= 0) {
        e.x += Math.cos(angle) * 560 * dt;
        e.y += Math.sin(angle) * 560 * dt;
        e.attackCooldown = 2.2;
        combatSystem.createFloatingText(e.x, e.y - 22, '도약!', '#ff66aa');
      } else if (e.attackPattern === 'ranged' && dist < 360 && e.spitCooldown <= 0) {
        combatSystem.enemyProjectiles.push({ x:e.x, y:e.y, vx:Math.cos(angle)*280, vy:Math.sin(angle)*280, radius:7, damage:e.damage, color:'#ff3344', life:2 });
        e.spitCooldown = 2.4;
      } else if (e.attackPattern === 'shockwave' && dist < 145 && e.attackCooldown <= 0) {
        player.takeDamage(e.damage, combatSystem);
        combatSystem.spawnSparks(e.x, e.y, '#ffaa33', 18);
        e.attackCooldown = 2.8;
      } else if (e.attackPattern === 'dash' && dist > 100 && dist < 330 && e.attackCooldown <= 0) {
        e.x += Math.cos(angle) * 620 * dt;
        e.y += Math.sin(angle) * 620 * dt;
        e.attackCooldown = 2.0;
      }

      if (dist < player.radius + e.size + 4) {
        if (e.attackCooldown <= 0) {
          player.takeDamage(e.damage, combatSystem);
          e.attackCooldown = 1.0;
        }
      } else {
        e.x += Math.cos(angle) * e.speed * dt;
        e.y += Math.sin(angle) * e.speed * dt;
      }

      if (e.spitsAcid && e.spitCooldown <= 0 && dist < 340) {
        combatSystem.enemyProjectiles.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(angle) * 190,
          vy: Math.sin(angle) * 190,
          radius: 6,
          damage: 15,
          color: "#88ff33",
          life: 2.2
        });
        e.spitCooldown = 3.0 + Math.random() * 1.5;
      }
    }

    // 전원 처치 시 다음 층 하강 엘리베이터 생성
    if (allDead && !this.isCleared) {
      this.isCleared = true;
      this.elevator = { x: 512, y: 610, radius: 28, pulse: 0 };
      if (window.showToast) {
        window.showToast(`구역 정화 완료! [하강 엘리베이터]로 이동하십시오.`);
      }
    }

    // 엘리베이터 탑승 판정
    if (this.elevator) {
      this.elevator.pulse += 4 * dt;
      this.tryEnterElevator(player);
    }
  }

  // 리프트 중심에 정확히 서지 않아도 진입할 수 있게 판정 반경을 넉넉히 둔다.
  tryEnterElevator(player) {
    if (!this.elevator || this.currentDay === 100) return false;
    const d = Math.hypot(player.x - this.elevator.x, player.y - this.elevator.y);
    // 리프트 전면 대기 구역까지 진입으로 인정한다. 위치를 정밀하게 맞출 필요가 없다.
    if (d > this.elevator.radius + player.radius + 180) return false;
    return this.openShelterTransition(player);
  }

  openShelterTransition(player) {
    if (!this.elevator) return false;

    // 모달이 실제로 열렸을 때만 일시정지한다. 실패 시 리프트를 유지해 게임이 멈추지 않는다.
    const opened = window.merchantSystem && window.merchantSystem.openShop(player, this.currentDay);
    if (!opened) {
      if (window.showToast) window.showToast('상점 연결에 실패했습니다. 리프트에 다시 진입해 주세요.');
      return false;
    }

    this.elevator = null;
    if (window.setGameState) window.setGameState('SHELTER');
    return true;
  }

  proceedToNextDay(player, bossSystem) {
    this.initDay(this.currentDay + 1, player, bossSystem);
    if (window.setGameState) window.setGameState('PLAYING');
  }

  warpToDay(day, player, bossSystem) {
    this.initDay(day, player, bossSystem);
    if (window.setGameState) window.setGameState('PLAYING');
  }

  // 동굴 속 폐쇄 시설 상세 렌더링
  render(ctx) {
    const biome = this.currentBiome || BIOMES[0];

    // 1. 천연 암반 바닥 (기본 동굴 흙 & 돌)
    ctx.fillStyle = biome.bgColor;
    ctx.fillRect(0, 0, 1024, 720);

    // 동굴 암반 질감 스펙클
    ctx.fillStyle = biome.rockColor;
    for (let x = 40; x < 980; x += 32) {
      for (let y = 40; y < 680; y += 32) {
        if ((x * y) % 7 === 0) {
          ctx.fillRect(x, y, 6, 6);
        }
      }
    }

    // 2. 동굴 바닥에 묻힌 콘크리트 슬래브 (폐쇄 시설 구획)
    for (let slab of this.concreteSlabs) {
      ctx.fillStyle = biome.concreteColor;
      ctx.fillRect(slab.x, slab.y, slab.w, slab.h);

      // 콘크리트 테두리 녹슨 철골선
      ctx.strokeStyle = "#111a14";
      ctx.lineWidth = 2;
      ctx.strokeRect(slab.x, slab.y, slab.w, slab.h);

      // 경고 줄무늬 (Caution Hazard Stripes)
      ctx.fillStyle = biome.hazardColor || '#ffaa00';
      for (let sx = slab.x + 8; sx < slab.x + slab.w - 12; sx += 20) {
        ctx.fillRect(sx, slab.y + 3, 10, 4);
      }

      // 시설 구역 스텐실 텍스트
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.font = '9px "Share Tech Mono", monospace';
      ctx.fillText(slab.label, slab.x + 8, slab.y + 18);
    }

    // 3. 바닥 전선 케이블
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#101614";
    for (let cable of this.cables) {
      ctx.beginPath();
      ctx.moveTo(cable.startX, cable.startY);
      ctx.bezierCurveTo(cable.cp1X, cable.cp1Y, cable.cp2X, cable.cp2Y, cable.endX, cable.endY);
      ctx.stroke();
    }

    // 4. 낙석 방지용 H-빔 철골 지지대
    ctx.fillStyle = "#1e2922";
    for (let beam of this.steelBeams) {
      ctx.fillRect(beam.x, beam.y, beam.w, beam.h);
      ctx.strokeStyle = "#0b120d";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(beam.x, beam.y, beam.w, beam.h);

      // 리벳 나사 자국
      ctx.fillStyle = "#ff9900";
      if (!beam.isHorizontal) {
        for (let ry = beam.y + 20; ry < beam.y + beam.h; ry += 50) {
          ctx.fillRect(beam.x + 4, ry, 4, 4);
          ctx.fillRect(beam.x + 14, ry, 4, 4);
        }
      }
    }

    // 5. 비상 벽면 조명등 본체 및 렌더링
    for (let lamp of this.facilityLamps) {
      // 램프 외곽 거치대
      ctx.fillStyle = "#111814";
      ctx.fillRect(lamp.x - 8, lamp.y - 8, 16, 16);

      // 램프 발광구
      const flickerAlpha = 0.65 + Math.sin(Date.now() / 150 + lamp.seed) * 0.25;
      ctx.fillStyle = lamp.color;
      ctx.globalAlpha = flickerAlpha;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // 전등 쇠창살 케이지
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(lamp.x - 8, lamp.y - 8, 16, 16);
    }

    // 6. 장애물 (종유석, 바리케이드, 유독물 드럼통)
    for (let obs of this.obstacles) {
      if (obs.type === 'STALAGMITE') {
        // 자연 석순/바위
        ctx.fillStyle = "#25352c";
        ctx.beginPath();
        ctx.moveTo(obs.x + obs.w / 2, obs.y);
        ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
        ctx.lineTo(obs.x, obs.y + obs.h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#101813";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (obs.type === 'BARRIER') {
        // 폐쇄 시설 격벽 바리케이드
        ctx.fillStyle = "#2d3d34";
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = "#ffaa00";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        // 사선 경고 무늬
        ctx.fillStyle = "#ffaa00";
        for (let bx = obs.x; bx < obs.x + obs.w; bx += 14) {
          ctx.fillRect(bx, obs.y, 6, 6);
        }
      } else {
        // 녹슨 위험 드럼통
        ctx.fillStyle = "#553322";
        ctx.beginPath();
        ctx.arc(obs.x + 18, obs.y + 18, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#221105";
        ctx.lineWidth = 2;
        ctx.stroke();
        // 방사능/독극물 마크
        ctx.fillStyle = "#88ff22";
        ctx.beginPath();
        ctx.arc(obs.x + 18, obs.y + 18, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 7. 동굴 외곽 암벽 (울퉁불퉁한 상/하단 동굴 천장과 바닥)
    ctx.fillStyle = biome.rockColor;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(1024, 0);
    for (let i = this.cavernPerimeter.length - 1; i >= 0; i--) {
      ctx.lineTo(this.cavernPerimeter[i].x, this.cavernPerimeter[i].topY);
    }
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 720);
    ctx.lineTo(1024, 720);
    for (let i = this.cavernPerimeter.length - 1; i >= 0; i--) {
      ctx.lineTo(this.cavernPerimeter[i].x, this.cavernPerimeter[i].botY);
    }
    ctx.closePath();
    ctx.fill();

    // 8. 하강 엘리베이터 (클리어 후)
    if (this.elevator) {
      ctx.save();
      const glow = 52 + Math.sin(this.elevator.pulse) * 5;
      ctx.strokeStyle = "#25e24c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.elevator.x, this.elevator.y, glow, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "rgba(37, 226, 76, 0.3)";
      ctx.fill();

      // 금속 리프트 발판
      ctx.fillStyle = "#1e3526";
      ctx.fillRect(this.elevator.x - 20, this.elevator.y - 20, 40, 40);
      ctx.strokeStyle = "#38784d";
      ctx.lineWidth = 2;
      ctx.strokeRect(this.elevator.x - 20, this.elevator.y - 20, 40, 40);

      ctx.fillStyle = "#afffc0";
      ctx.font = 'bold 12px "Share Tech Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("▼ 하강 리프트 · E ▼", this.elevator.x, this.elevator.y + 4);
      ctx.restore();
    }

    // 9. 일반 적 렌더링
    for (let e of this.enemies) {
      if (e.isDead) continue;

      ctx.save();
      ctx.translate(e.x, e.y);

      if (e.stunTimer > 0) {
        ctx.strokeStyle = "#33eeff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, e.size + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(0, 0, e.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#111b14";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 섬뜩한 눈빛
      ctx.fillStyle = e.eyeColor;
      ctx.beginPath();
      ctx.arc(3, -2, 3, 0, Math.PI * 2);
      ctx.arc(-3, -2, 3, 0, Math.PI * 2);
      ctx.fill();

      // 몬스터 머리 위 등급 뱃지([열매], [잎], [나뭇가지], [뿌리], [생명의 나무]) 및 이름 표시
      if (e.grade) {
        ctx.save();
        ctx.font = 'bold 9px "Share Tech Mono", monospace';
        ctx.textAlign = "center";
        
        const tagText = `[${e.grade.name}] ${e.name}`;
        const textWidth = ctx.measureText(tagText).width;
        ctx.fillStyle = "rgba(10, 16, 12, 0.85)";
        ctx.fillRect(-textWidth / 2 - 4, -e.size - 22, textWidth + 8, 12);
        ctx.strokeStyle = e.grade.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(-textWidth / 2 - 4, -e.size - 22, textWidth + 8, 12);

        ctx.fillStyle = e.grade.color;
        ctx.fillText(tagText, 0, -e.size - 13);
        ctx.restore();
      }

      // 체력 바 (등급 컬러 연동)
      const hpRatio = e.hp / e.maxHp;
      ctx.fillStyle = "#330000";
      ctx.fillRect(-16, -e.size - 8, 32, 4);
      ctx.fillStyle = e.grade ? e.grade.color : "#ff2233";
      ctx.fillRect(-16, -e.size - 8, 32 * hpRatio, 4);

      ctx.restore();
    }
  }
}

window.stageManager = new StageManager();
