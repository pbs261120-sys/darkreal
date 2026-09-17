/**
 * 100 Days Below - Player Character & Modular Equipment Visuals
 * 장비 구매 시 실시간으로 캐릭터의 몸체/손/등에 결합되어 렌더링되는 모듈러 소켓 시스템을 구현합니다.
 */

const EQUIPMENT_SAVE_KEY = '100-days-below-equipment-v1';

function cloneEquipment(item) {
  return JSON.parse(JSON.stringify(item));
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.speed = 180;
    this.aimAngle = 0;

    // 핵심 스탯
    this.maxHp = 100;
    this.hp = 100;
    this.maxBattery = 100;
    this.battery = 100;
    this.maxPulse = 100;
    this.pulse = 50;
    this.pulseRegenRate = 12; // 초당 펄스 회복량
    this.scrap = 200; // 초기 고철
    this.chargeCoreCooldown = 0; // 비상 충전코어 쿨다운

    // 영구 소장 인벤토리 및 괴물 처치 기록 (도감 연동)
    const saved = this.loadPersistentEquipment();
    this.inventory = saved?.inventory?.length ? saved.inventory : [
      { ...cloneEquipment(EQUIPMENT_DATA.drill), upgradeLevel: 0 },
      { ...cloneEquipment(EQUIPMENT_DATA.flashlight), upgradeLevel: 0 }
    ];
    this.killCounts = saved?.killCounts || {}; // { crawler_rat: 5, miner_corpse: 2, ... }

    // 장비 슬롯 (인벤토리 첫 번째 아이템 장착 시작)
    this.equipment = { primary: null, sub: null, armor: null, core: null };
    const savedEquipment = saved?.equipment || {};
    Object.keys(this.equipment).forEach(slot => {
      this.equipment[slot] = this.inventory.find(item => item.id === savedEquipment[slot]) || null;
    });
    this.equipment.primary ||= this.inventory.find(item => item.slot === 'PRIMARY') || null;
    this.equipment.sub ||= this.inventory.find(item => item.slot === 'SUB') || null;

    // 전투 및 타이머
    this.primaryCooldown = 0;
    this.subCooldown = 0;
    this.invulnerableTimer = 0;
    this.shieldTimer = 0;
    this.drillAnimAngle = 0;

    // 보유 전투 카드 덱 (최대 4장 핸드 슬롯)
    this.hand = [
      { ...CARDS_DATA[0], currentCooldown: 0 },
      { ...CARDS_DATA[1], currentCooldown: 0 },
      { ...CARDS_DATA[2], currentCooldown: 0 },
      { ...CARDS_DATA[3], currentCooldown: 0 }
    ];
  }

  // 사망 시 장비 초기화
  resetEquipment() {
    this.inventory = [
      { ...cloneEquipment(EQUIPMENT_DATA.drill), upgradeLevel: 0 },
      { ...cloneEquipment(EQUIPMENT_DATA.flashlight), upgradeLevel: 0 }
    ];
    this.equipment = {
      primary: this.inventory[0],
      sub: this.inventory[1],
      armor: null,
      core: null
    };
    this.savePersistentEquipment();
  }

  loadPersistentEquipment() {
    try { return JSON.parse(localStorage.getItem(EQUIPMENT_SAVE_KEY)); } catch (_) { return null; }
  }

  savePersistentEquipment() {
    try {
      localStorage.setItem(EQUIPMENT_SAVE_KEY, JSON.stringify({
        inventory: this.inventory,
        killCounts: this.killCounts,
        equipment: Object.fromEntries(Object.entries(this.equipment).map(([slot, item]) => [slot, item?.id || null]))
      }));
    } catch (_) { /* 저장소를 사용할 수 없는 환경에서는 현재 회차만 유지 */ }
  }

  // 장비 장착 처리
  equipItem(item) {
    const slotKey = item.slot.toLowerCase();
    let ownedItem = this.inventory.find(i => i.id === item.id);

    // 인벤토리에 미등록된 경우 영구 등록
    if (!ownedItem) {
      ownedItem = { ...cloneEquipment(item), upgradeLevel: item.upgradeLevel || 0 };
      this.inventory.push(ownedItem);
    }
    this.equipment[slotKey] = ownedItem;

    if (window.soundSystem) {
      window.soundSystem.playEquipSound();
    }

    const levelTag = item.upgradeLevel === 2 ? ' ++' : (item.upgradeLevel === 1 ? ' +' : '');
    if (window.showToast) {
      window.showToast(`[장착 완료] ${item.name}${levelTag} 이(가) 결합되었습니다!`);
    }

    if (window.updateHUD) {
      window.updateHUD();
    }
    this.savePersistentEquipment();
  }

  // 필드 전리품 드롭 장비 인벤토리 추가
  addToInventory(itemData) {
    const existing = this.inventory.find(i => i.id === itemData.id);
    if (existing) {
      // 이미 보유한 장비면 고철 보상으로 환산
      const scrapBonus = Math.round(itemData.cost * 0.6);
      this.scrap += scrapBonus;
      if (window.showToast) {
        window.showToast(`[중복 전리품] ${itemData.name} 분해 완료 (+${scrapBonus} G)`);
      }
      return;
    }

    const newItem = { ...cloneEquipment(itemData), upgradeLevel: 0 };
    this.inventory.push(newItem);

    if (window.soundSystem) {
      window.soundSystem.playEquipSound();
    }

    if (window.showToast) {
      window.showToast(`★ [특별 전리품 획득!] ${newItem.name} - 인벤토리에 보관됨`);
    }

    // 해당 슬롯이 비어있다면 자동 장착
    const slotKey = newItem.slot.toLowerCase();
    if (!this.equipment[slotKey]) {
      this.equipItem(newItem);
    }

    if (window.updateHUD) window.updateHUD();
    this.savePersistentEquipment();
  }

  // 상점 2단 강화 (+ 및 ++)
  upgradeItem(item) {
    const currentLv = item.upgradeLevel || 0;
    if (currentLv >= 2) return false;

    const nextLv = currentLv + 1;
    const config = nextLv === 1 ? UPGRADE_CONFIG.LEVEL_1 : UPGRADE_CONFIG.LEVEL_2;
    const cost = Math.round(item.cost * config.costMult);

    if (this.scrap < cost) {
      if (window.showToast) window.showToast(`고철이 부족합니다! (필요: ${cost} G)`);
      return false;
    }

    this.scrap -= cost;
    item.upgradeLevel = nextLv;

    // 이름 변경 (+ 또는 ++)
    const baseName = item.name.replace(/\s\+{1,2}$/, '');
    item.name = `${baseName} ${config.suffix}`;

    // 스탯 배율 적용 (공격력/넉백 또는 방어력)
    if (item.stats) {
      if (item.stats.atk) {
        item.stats.atk = Math.round(item.stats.atk * (nextLv === 1 ? 1.45 : 1.45));
      }
      if (item.stats.dmgReduction) {
        item.stats.dmgReduction = Math.min(0.75, item.stats.dmgReduction * 1.25);
      }
      if (item.stats.zapDamage) {
        item.stats.zapDamage = Math.round(item.stats.zapDamage * 1.5);
      }
    }

    if (window.soundSystem) {
      window.soundSystem.playEquipSound();
    }

    if (window.showToast) {
      window.showToast(`⚡ [강화 성공!] ${item.name} (${config.name}) 달성!`);
    }

    if (window.updateHUD) window.updateHUD();
    this.savePersistentEquipment();
    return true;
  }

  update(dt, input, combatSystem) {
    // 1. 이동 처리 (WASD / 방향키)
    let dx = 0;
    let dy = 0;
    if (input.keys['KeyW']) dy -= 1;
    if (input.keys['KeyS']) dy += 1;
    if (input.keys['KeyA']) dx -= 1;
    if (input.keys['KeyD']) dx += 1;

    let moveSpeed = this.speed;
    // 방어구 이동속도 보정
    if (this.equipment.armor && this.equipment.armor.stats.speedMult) {
      moveSpeed *= this.equipment.armor.stats.speedMult;
    }
    if (this.equipment.core && this.equipment.core.stats.speedMult) {
      moveSpeed *= this.equipment.core.stats.speedMult;
    }

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    this.x += dx * moveSpeed * dt;
    this.y += dy * moveSpeed * dt;

    // 맵 경계 제한 (1024 x 720 기준, 하강 구역 내부)
    this.x = Math.max(28, Math.min(996, this.x));
    this.y = Math.max(30, Math.min(680, this.y));

    // 2. 조준 각도 계산: 방향키는 8방향 조준, 마우스는 방향키를 쓰기 전의 보조 조준이다.
    let aimX = 0;
    let aimY = 0;
    if (input.keyboardAim) {
      if (input.keys['ArrowLeft']) aimX -= 1;
      if (input.keys['ArrowRight']) aimX += 1;
      if (input.keys['ArrowUp']) aimY -= 1;
      if (input.keys['ArrowDown']) aimY += 1;
    }
    if (aimX !== 0 || aimY !== 0) {
      this.aimAngle = Math.atan2(aimY, aimX);
    } else if (!input.keyboardAim) {
      this.aimAngle = Math.atan2(input.mouseY - this.y, input.mouseX - this.x);
    }

    // 3. 자원 자연 회복 & 소모
    let pulseRegen = this.pulseRegenRate;
    if (this.equipment.core && this.equipment.core.stats.pulseRegenMult) {
      pulseRegen *= this.equipment.core.stats.pulseRegenMult;
    }
    this.pulse = Math.min(this.maxPulse, this.pulse + pulseRegen * dt);

    // 배터리 자연 소모
    let batteryDrain = 1.0;
    if (this.equipment.core && this.equipment.core.stats.batteryDrainMult) {
      batteryDrain *= this.equipment.core.stats.batteryDrainMult;
    }
    this.battery = Math.max(0, this.battery - batteryDrain * dt);

    // 충전코어 쿨다운 및 자동 긴급 재충전 처리
    if (this.chargeCoreCooldown > 0) this.chargeCoreCooldown -= dt;
    if (this.battery <= 0 && this.equipment.core && this.equipment.core.stats.autoRecharge && this.chargeCoreCooldown <= 0) {
      this.battery = this.maxBattery;
      this.chargeCoreCooldown = 60;
      if (window.soundSystem) window.soundSystem.playEquipSound();
      if (window.showToast) window.showToast('⚡ [비상 급속 충전코어] 배터리가 100% 긴급 충전되었습니다!');
      if (combatSystem) combatSystem.createFloatingText(this.x, this.y - 25, '⚡ 배터리 완충!', '#33eeff');
    }

    // 타이머 감소
    if (this.primaryCooldown > 0) this.primaryCooldown -= dt;
    if (this.subCooldown > 0) this.subCooldown -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.shieldTimer > 0) this.shieldTimer -= dt;

    // 카드 쿨다운 감소
    for (let card of this.hand) {
      if (card.currentCooldown > 0) card.currentCooldown -= dt;
    }

    // 드릴 회전 애니메이션
    this.drillAnimAngle += 25 * dt;

    // 4. 주무기 공격 발동 (마우스 좌클릭)
    if (input.mouseDown && this.primaryCooldown <= 0 && this.equipment.primary) {
      combatSystem.fireWeapon(this, this.equipment.primary);
      this.primaryCooldown = this.equipment.primary.stats.fireRate;
    }

    // 5. 보조장비 자동 동작 (전기 충격기 등)
    if (this.equipment.sub && this.equipment.sub.id === 'taser' && this.subCooldown <= 0) {
      const zapped = combatSystem.tryAutoTaser(this, this.equipment.sub);
      if (zapped) {
        this.subCooldown = this.equipment.sub.stats.zapCooldown;
      }
    }
  }

  // 피격 처리
  takeDamage(dmg, combatSystem) {
    if (this.invulnerableTimer > 0) return;
    if (this.shieldTimer > 0) {
      // 쉴드 흡수
      combatSystem.createFloatingText(this.x, this.y - 20, "방어막 차단!", "#33eeff");
      return;
    }

    let actualDmg = dmg;
    // 방어구 피해 경감
    if (this.equipment.armor && this.equipment.armor.stats.dmgReduction) {
      actualDmg *= (1 - this.equipment.armor.stats.dmgReduction);
    }
    actualDmg = Math.max(1, Math.round(actualDmg));

    this.hp = Math.max(0, this.hp - actualDmg);
    this.invulnerableTimer = 0.5; // 무적 프레임

    combatSystem.createFloatingText(this.x, this.y - 20, `-${actualDmg}`, "#ff3344");
    combatSystem.spawnBloodParticles(this.x, this.y, "#aa1122", 8);

    // 키틴질 갑각 가시 반사
    if (this.equipment.armor && this.equipment.armor.stats.thornDamage) {
      combatSystem.triggerThornBurst(this.x, this.y, this.equipment.armor.stats.thornDamage);
    }


    if (window.soundSystem) {
      window.soundSystem.playEnemyHit();
    }
  }

  // 모듈러 스프라이트 결합 렌더링 (핵심!)
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // 무적 깜빡임 연출
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // 1. [등 뒤 슬롯] 파워 코어 (Core) 렌더링
    if (this.equipment.core) {
      ctx.save();
      const core = this.equipment.core;
      // 코어 발광 오라
      const pulseSize = 18 + Math.sin(Date.now() / 150) * 4;
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, pulseSize);
      grad.addColorStop(0, core.visual.coreColor);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
      ctx.fill();

      // 등 뒤 코어 본체
      ctx.fillStyle = core.visual.coreColor;
      ctx.fillRect(-6, -6, 12, 12);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(-6, -6, 12, 12);
      ctx.restore();
    }

    // 2. [몸체 & 방어구 슬롯] 베이스 몸체 및 착용 방어구 오버레이
    ctx.save();
    if (this.equipment.armor && this.equipment.armor.id === 'heavy_welder') {
      // 용접공 중장갑: 두껍고 육중한 사각 철판과 리벳
      ctx.fillStyle = this.equipment.armor.visual.plateColor;
      ctx.fillRect(-14, -14, 28, 28);
      ctx.strokeStyle = this.equipment.armor.visual.trimColor;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-14, -14, 28, 28);

      // 어깨 견갑(Pauldrons)
      ctx.fillStyle = "#8899aa";
      ctx.fillRect(-17, -12, 5, 24);
      ctx.fillRect(12, -12, 5, 24);
    } else if (this.equipment.armor && this.equipment.armor.id === 'chitin_armor') {
      // 키틴질 갑각: 뾰족한 가시형태 실루엣
      ctx.fillStyle = this.equipment.armor.visual.plateColor;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(16, -5);
      ctx.lineTo(13, 14);
      ctx.lineTo(0, 18);
      ctx.lineTo(-13, 14);
      ctx.lineTo(-16, -5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = this.equipment.armor.visual.trimColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 갑각 가시 돌기
      ctx.fillStyle = "#ff2266";
      ctx.fillRect(-18, -4, 4, 8);
      ctx.fillRect(14, -4, 4, 8);
    } else {
      // 기본 서바이버 방호복
      ctx.fillStyle = "#223328";
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#385d43";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 산소통 백팩
      ctx.fillStyle = "#1b2620";
      ctx.fillRect(-9, -12, 4, 24);
    }

    // 헬멧 바이저 (생존자 고글)
    ctx.fillStyle = "#25e24c";
    ctx.beginPath();
    ctx.ellipse(3, 0, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. [보조장비 슬롯] (왼손/어깨 부착)
    if (this.equipment.sub) {
      ctx.save();
      const sub = this.equipment.sub;
      if (sub.id === 'flashlight') {
        // 어깨 장착 투광등
        ctx.fillStyle = sub.visual.bodyColor;
        ctx.fillRect(-6, -16, 12, 6);
        ctx.fillStyle = sub.visual.color;
        ctx.fillRect(4, -15, 3, 4);
      } else if (sub.id === 'taser') {
        // 전기 충격기
        ctx.fillStyle = sub.visual.bodyColor;
        ctx.fillRect(-15, 6, 8, 8);
        ctx.strokeStyle = sub.visual.color;
        ctx.beginPath();
        ctx.moveTo(-15, 7);
        ctx.lineTo(-18, 10);
        ctx.lineTo(-15, 13);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. [주무기 슬롯] 마우스 조준 방향으로 회전 결합 렌더링 (핵심 무기 비주얼!)
    if (this.equipment.primary) {
      ctx.save();
      ctx.rotate(this.aimAngle);
      const wep = this.equipment.primary;

      if (wep.id === 'drill') {
        // 휴대용 채굴 드릴: 본체 + 회전하는 드릴 헤드
        ctx.fillStyle = wep.visual.color;
        ctx.fillRect(4, -5, 14, 10); // 기계 몸체
        ctx.fillStyle = "#333333";
        ctx.fillRect(10, -7, 6, 14); // 그립 & 모터

        // 회전하는 드릴 콘
        ctx.save();
        ctx.translate(18, 0);
        ctx.fillStyle = wep.visual.tipColor;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(12, 0);
        ctx.lineTo(0, 6);
        ctx.closePath();
        ctx.fill();
        // 나선형 줄무늬 (회전 연출)
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 2;
        const spiralOffset = Math.sin(this.drillAnimAngle) * 3;
        ctx.beginPath();
        ctx.moveTo(3 + spiralOffset, -4);
        ctx.lineTo(7 + spiralOffset, 4);
        ctx.stroke();
        ctx.restore();
      } else if (wep.id === 'flamethrower') {
        // 개조된 화염방사기: 긴 배관, 연료통, 점화 불꽃
        ctx.fillStyle = wep.visual.color;
        ctx.fillRect(6, -4, 20, 7); // 방사 파이프
        ctx.fillStyle = "#882211";
        ctx.fillRect(10, 2, 8, 8); // 소형 가스통

        // 총구 파일럿 불꽃 (깜빡임)
        ctx.fillStyle = wep.visual.pilotColor;
        const flameFlicker = Math.random() * 4;
        ctx.beginPath();
        ctx.arc(27, 0, 2 + flameFlicker, 0, Math.PI * 2);
        ctx.fill();
      } else if (wep.id === 'shotgun') {
        // 압축 충격 샷건: 두꺼운 2연장 총열 및 펌프
        ctx.fillStyle = wep.visual.color;
        ctx.fillRect(6, -6, 22, 11);
        ctx.fillStyle = "#111b22";
        ctx.fillRect(8, -4, 18, 3); // 윗 총열
        ctx.fillRect(8, 1, 18, 3);  // 아랫 총열
        ctx.fillStyle = "#ffaa00";
        ctx.fillRect(12, -7, 6, 2); // 탄피 배출구
      } else if (wep.id === 'acid_gun') {
        // 생체 산성총: 초록 액체가 든 유리 앰플과 분사 노즐
        ctx.fillStyle = wep.visual.color;
        ctx.fillRect(4, -4, 18, 8);
        // 유리관 액체
        ctx.fillStyle = wep.visual.vialColor;
        ctx.fillRect(8, -6, 10, 4);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(8, -6, 10, 4);
        // 거품
        ctx.beginPath();
        ctx.arc(22, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (wep.id === 'miner_pickaxe') {
        // 침식된 전기 곡괭이
        ctx.fillStyle = wep.visual.color;
        ctx.fillRect(4, -3, 18, 6);
        ctx.fillStyle = wep.visual.tipColor;
        ctx.beginPath();
        ctx.moveTo(22, -14);
        ctx.lineTo(26, -12);
        ctx.lineTo(22, 14);
        ctx.lineTo(18, 12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(23, -6);
        ctx.lineTo(27, 0);
        ctx.lineTo(23, 6);
        ctx.stroke();
      } else if (wep.id === 'bio_gauntlet') {
        // 생체 도약 건틀릿
        ctx.fillStyle = wep.visual.color;
        ctx.fillRect(6, -7, 16, 14);
        ctx.fillStyle = wep.visual.tipColor;
        ctx.fillRect(20, -5, 6, 10);
      } else if (wep.id === 'cutter_disc') {
        // 고속 회전 톱날
        ctx.fillStyle = wep.visual.color;
        ctx.fillRect(6, -4, 14, 8);
        ctx.save();
        ctx.translate(22, 0);
        ctx.rotate(this.drillAnimAngle * 1.5);
        ctx.fillStyle = wep.visual.tipColor;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.strokeRect(-9, -2, 18, 4);
        ctx.restore();
      } else if (wep.id === 'flesh_whip') {
        // 피의 촉수 채찍
        ctx.strokeStyle = wep.visual.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(4, 0);
        const wave = Math.sin(Date.now() / 80) * 5;
        ctx.quadraticCurveTo(16, wave, 28, -wave);
        ctx.stroke();
      } else if (wep.id === 'void_cannon') {
        // 공허의 특이점 총
        ctx.fillStyle = wep.visual.color;
        ctx.fillRect(6, -6, 20, 12);
        const voidSize = 5 + Math.sin(Date.now() / 90) * 2;
        ctx.fillStyle = wep.visual.tipColor;
        ctx.beginPath();
        ctx.arc(28, 0, voidSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // [장비 강화 오라 연출]
      if (wep.upgradeLevel === 1) {
        // 1단 강화 (+): 금빛 찬란한 스파크
        ctx.fillStyle = "#ffdd00";
        const sparkX = 20 + Math.random() * 8;
        const sparkY = (Math.random() - 0.5) * 8;
        ctx.fillRect(sparkX, sparkY, 2.5, 2.5);
      } else if (wep.upgradeLevel === 2) {
        // 2단 강화 (++): 강력한 보라/붉은빛 크리티컬 오라
        ctx.strokeStyle = "rgba(208, 68, 255, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(2, -8, 28, 16);
        ctx.fillStyle = "#ff0066";
        const sparkX = 22 + (Math.random() - 0.5) * 12;
        const sparkY = (Math.random() - 0.5) * 12;
        ctx.fillRect(sparkX, sparkY, 3, 3);
      }
      ctx.restore();
    }

    // 5. 쉴드 활성화 시 구형 배리어 이펙트
    if (this.shieldTimer > 0) {
      ctx.save();
      const shieldGlow = 22 + Math.sin(Date.now() / 80) * 3;
      ctx.strokeStyle = "rgba(51, 238, 255, 0.75)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, shieldGlow, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "rgba(51, 238, 255, 0.15)";
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  // 2D 다이내믹 시야 마스크 및 손전등 조명 (가시성 대폭 개선)
  renderLighting(ctx, stageManager) {
    if (!this.lightCanvas) {
      this.lightCanvas = document.createElement('canvas');
      this.lightCanvas.width = ctx.canvas.width;
      this.lightCanvas.height = ctx.canvas.height;
      this.lightCtx = this.lightCanvas.getContext('2d');
    }

    const lCtx = this.lightCtx;
    const w = this.lightCanvas.width;
    const h = this.lightCanvas.height;

    // 1. 오프스크린 캔버스 초기화 및 동굴 앰비언트 어둠 레이어 채우기
    lCtx.globalCompositeOperation = 'source-over';
    lCtx.clearRect(0, 0, w, h);

    // 완전 암흑(1.0)이 아닌 반투명 어둠으로 채우며, 배터리 방전 시 더 어두워집니다.
    const isDrained = this.battery <= 0;
    const flicker = isDrained ? ((Math.floor(Date.now() / 120) % 3 === 0) ? 0.35 : 0.7) : 1.0;
    const ambientDarkness = Math.min(0.72, 0.45 + (1 - (this.battery / this.maxBattery)) * 0.22);
    lCtx.fillStyle = `rgba(5, 9, 8, ${ambientDarkness})`;
    lCtx.fillRect(0, 0, w, h);

    // 2. 조명 영역 제거 ('destination-out'을 오프스크린 캔버스에 적용)
    lCtx.globalCompositeOperation = 'destination-out';

    // A. 플레이어 주변 원형 조명 (배터리 방전 시 축소 및 깜빡임)
    let baseRadius = 250 * flicker;
    if (isDrained) baseRadius = Math.max(100, 250 * 0.5 * flicker);
    if (this.equipment.sub && this.equipment.sub.stats.lightBonus) {
      baseRadius += this.equipment.sub.stats.lightBonus * 0.8 * (isDrained ? 0.4 : 1.0);
    }

    const radGrad = lCtx.createRadialGradient(this.x, this.y, 40, this.x, this.y, baseRadius);
    radGrad.addColorStop(0, "rgba(0, 0, 0, 1.0)");
    radGrad.addColorStop(0.65, "rgba(0, 0, 0, 0.85)");
    radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

    lCtx.fillStyle = radGrad;
    lCtx.beginPath();
    lCtx.arc(this.x, this.y, baseRadius, 0, Math.PI * 2);
    lCtx.fill();

    // B. 전방 지향성 손전등 원뿔 빔
    let coneAngle = 0.65;
    let coneDist = 420;
    if (this.equipment.sub && this.equipment.sub.id === 'flashlight') {
      coneAngle = 0.95;
      coneDist = 580;
    }
    if (isDrained) {
      coneDist = Math.max(120, coneDist * 0.45 * flicker);
      coneAngle *= 0.7;
    }

    const coneGrad = lCtx.createRadialGradient(this.x, this.y, 30, this.x, this.y, coneDist);
    coneGrad.addColorStop(0, "rgba(0, 0, 0, 1.0)");
    coneGrad.addColorStop(0.7, "rgba(0, 0, 0, 0.9)");
    coneGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

    lCtx.fillStyle = coneGrad;
    lCtx.beginPath();
    lCtx.moveTo(this.x, this.y);
    lCtx.arc(this.x, this.y, coneDist, this.aimAngle - coneAngle, this.aimAngle + coneAngle);
    lCtx.closePath();
    lCtx.fill();

    // C. 폐쇄 지하시설의 비상 벽면 조명(Emergency Wall Lamps) 빛 구멍 뚫기
    if (stageManager && stageManager.facilityLamps) {
      for (let lamp of stageManager.facilityLamps) {
        const flickerRadius = lamp.radius + Math.sin(Date.now() / 120 + lamp.seed) * 6;
        const lampGrad = lCtx.createRadialGradient(lamp.x, lamp.y, 10, lamp.x, lamp.y, flickerRadius);
        lampGrad.addColorStop(0, "rgba(0, 0, 0, 0.9)");
        lampGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        lCtx.fillStyle = lampGrad;
        lCtx.beginPath();
        lCtx.arc(lamp.x, lamp.y, flickerRadius, 0, Math.PI * 2);
        lCtx.fill();
      }
    }

    // 3. 메인 캔버스에 완성된 부드러운 조명 마스크 덮어씌우기
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.lightCanvas, 0, 0);

    // 4. 전방 손전등의 시네마틱 라이트 빔 추가 렌더링 (따뜻한 노란빛)
    const beamGrad = ctx.createRadialGradient(this.x, this.y, 20, this.x, this.y, coneDist * 0.9);
    beamGrad.addColorStop(0, "rgba(255, 245, 200, 0.14)");
    beamGrad.addColorStop(0.7, "rgba(255, 230, 150, 0.06)");
    beamGrad.addColorStop(1, "rgba(255, 230, 150, 0)");

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.arc(this.x, this.y, coneDist * 0.9, this.aimAngle - coneAngle, this.aimAngle + coneAngle);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
