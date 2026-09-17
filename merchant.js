/**
 * 100 Days Below - The Rusted Broker (고장난 상인 로봇) & Shelter Manager
 * 대화 생성, 장비 상점 렌더링, 구매 시 즉각 캐릭터 장착 처리
 */

class MerchantSystem {
  constructor() {
    this.robotQuotes = [
      "치..치직... 안녕..하..십니까... 고객님? 아..직 살점이... 붙어있군요? 놀라운... 내구성입니다...",
      "이번... 상품은... 드릴입니다... 살점을... 갈아낼 때... 진동이 아주... 쾌적..치직!",
      "경고: 이 무기는... 이전 주인의... 비명이... 3% 정도... 잔류하고 있습니다. 할인 제공!",
      "지..하 100층에는... 아무것도... 없..없습니다... 거..대한... 신의... 살덩어리 뿐...치직...",
      "화염방사기... 추천합니다... 괴물들이... 구워질 때... 고소한 냄새가... 데이터베이스에... 기록됩니다...",
      "전기를... 흘려보내면... 놈들이... 춤을 춥니다... 아주... 웃긴... 광경입니다... 삐-익!"
    ];

    this.shopItems = [
      EQUIPMENT_DATA.drill,
      EQUIPMENT_DATA.flamethrower,
      EQUIPMENT_DATA.shotgun,
      EQUIPMENT_DATA.acid_gun,
      EQUIPMENT_DATA.flashlight,
      EQUIPMENT_DATA.taser,
      EQUIPMENT_DATA.heavy_welder,
      EQUIPMENT_DATA.chitin_armor,
      EQUIPMENT_DATA.pulse_core,
      EQUIPMENT_DATA.spark_battery,
      EQUIPMENT_DATA.charge_core
    ].filter(Boolean);
  }

  // 상점 모달 열기
  openShop(player, currentDay) {
    const modal = document.getElementById('merchant-modal');
    if (!modal) return false;

    // 랜덤 대사 설정 및 글리치 효과음
    const quoteEl = document.getElementById('robot-speech-text');
    if (quoteEl) {
      const quote = this.robotQuotes[Math.floor(Math.random() * this.robotQuotes.length)];
      quoteEl.innerText = quote;
    }
    if (window.soundSystem) {
      window.soundSystem.playRobotGlitch();
    }

    // 아이템 리스트 렌더링
    this.renderShopGrid(player);
    modal.classList.add('active');
    return modal.classList.contains('active');
  }

  closeShop() {
    const modal = document.getElementById('merchant-modal');
    if (modal) modal.classList.remove('active');
  }

  // 상점 그리드 렌더링
  renderShopGrid(player) {
    const grid = document.getElementById('shop-items-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // 소모품: 구매 즉시 사용하며 장비 보관함에는 들어가지 않는다.
    const medkit = document.createElement('div');
    medkit.className = 'shop-card medkit-card';
    const canBuyMedkit = player.scrap >= 100 && player.hp < player.maxHp;
    medkit.innerHTML = `
      <div>
        <div class="shop-item-title"><span>응급 생체 메디킷</span><span style="color:#ff6677;">100 G</span></div>
        <div class="shop-item-type">[CONSUMABLE]</div>
        <div class="shop-item-desc">현장에서 즉시 사용 가능한 응급 치료제. 생체 신호를 안정화합니다.</div>
        <div class="shop-item-stats">HP 즉시 +50 (최대 HP 초과 불가)</div>
      </div>
      <button class="btn-buy" ${canBuyMedkit ? '' : 'disabled'}>${player.hp >= player.maxHp ? '체력 최대' : (canBuyMedkit ? '구매 및 사용' : '고철 부족')}</button>`;
    if (canBuyMedkit) medkit.querySelector('.btn-buy').addEventListener('click', () => this.purchaseMedkit(player));
    grid.appendChild(medkit);

    // 소모품 2: 배터리 충전 코어 (배터리 방전 또는 소모 시 완충)
    const chargeCore = document.createElement('div');
    chargeCore.className = 'shop-card medkit-card';
    const canBuyCore = player.scrap >= 70 && player.battery < player.maxBattery;
    chargeCore.innerHTML = `
      <div>
        <div class="shop-item-title"><span>배터리 충전 코어</span><span style="color:#33eeff;">70 G</span></div>
        <div class="shop-item-type">[CONSUMABLE]</div>
        <div class="shop-item-desc">방전된 조명 배터리를 긴급 급속 충전합니다. 어둠을 걷어냅니다.</div>
        <div class="shop-item-stats">배터리 즉시 100% 충전</div>
      </div>
      <button class="btn-buy" ${canBuyCore ? '' : 'disabled'}>${player.battery >= player.maxBattery ? '배터리 최대' : (canBuyCore ? '구매 및 충전' : '고철 부족')}</button>`;
    if (canBuyCore) chargeCore.querySelector('.btn-buy').addEventListener('click', () => this.purchaseChargeCore(player));
    grid.appendChild(chargeCore);

    for (let item of this.shopItems) {
      // 데이터가 잘못된 항목 하나 때문에 상점 전체가 열리지 않는 것을 막는다.
      if (!item || !item.slot || !item.stats) continue;
      const card = document.createElement('div');
      card.className = 'shop-card';

      // 현재 장착 여부 확인
      const slotKey = item.slot.toLowerCase();
      const ownedItem = player.inventory.find(owned => owned.id === item.id);
      const isEquipped = player.equipment[slotKey] && player.equipment[slotKey].id === item.id;
      const canAfford = player.scrap >= item.cost;

      let statSummary = '';
      if (item.slot === 'PRIMARY') {
        statSummary = `공격력: ${item.stats.atk} | 사거리: ${item.stats.range} | 넉백: ${item.stats.knockback}`;
      } else if (item.slot === 'SUB') {
        statSummary = item.stats.lightBonus ? `시야 +${item.stats.lightBonus}` : `감전 피해: ${item.stats.zapDamage}`;
      } else if (item.slot === 'ARMOR') {
        statSummary = `피해감소: ${(item.stats.dmgReduction * 100)}% ${item.stats.knockbackImmune ? '| 넉백 면역' : ''}`;
      } else if (item.slot === 'CORE') {
        if (item.stats.pulseRegenMult) {
          statSummary = `펄스 회복속도 +50%`;
        } else if (item.stats.autoRecharge) {
          statSummary = `배터리 소모 30% 감소 | 방전 시 100% 자동 충전`;
        } else {
          statSummary = `배터리 소모 50% 감소`;
        }
      }

      card.innerHTML = `
        <div>
          <div class="shop-item-title">
            <span>${item.name}</span>
            <span style="color:#ffaa00;">${item.cost} G</span>
          </div>
          <div class="shop-item-type">[${item.slot}]</div>
          <div class="shop-item-desc">${item.desc}</div>
          <div class="shop-item-stats">${statSummary}</div>
        </div>
        <button class="btn-buy ${isEquipped ? 'equipped' : ''}" ${isEquipped || (!ownedItem && !canAfford) ? 'disabled' : ''}>
          ${isEquipped ? '✓ 장착중' : (ownedItem ? '장착' : (canAfford ? '구매 및 장착' : '고철 부족'))}
        </button>
      `;

      const buyBtn = card.querySelector('.btn-buy');
      if (!isEquipped && ownedItem) {
        buyBtn.addEventListener('click', () => { player.equipItem(ownedItem); this.renderShopGrid(player); });
      } else if (!isEquipped && canAfford) {
        buyBtn.addEventListener('click', () => {
          this.purchaseItem(player, item);
        });
      }

      grid.appendChild(card);
    }

    this.renderOwnedGrid(player);
  }

  renderOwnedGrid(player) {
    const grid = document.getElementById('owned-items-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (const item of player.inventory) {
      const level = item.upgradeLevel || 0;
      const nextConfig = level < 2 ? (level === 0 ? UPGRADE_CONFIG.LEVEL_1 : UPGRADE_CONFIG.LEVEL_2) : null;
      const upgradeCost = nextConfig ? Math.round(item.cost * nextConfig.costMult) : 0;
      const slotKey = item.slot.toLowerCase();
      const equipped = player.equipment[slotKey]?.id === item.id;
      const card = document.createElement('div');
      card.className = 'shop-card owned-card';
      card.innerHTML = `<div><div class="shop-item-title"><span>${item.name}</span><span style="color:#d044ff;">${level === 2 ? '++ MAX' : level === 1 ? '+ 강화됨' : '기본'}</span></div><div class="shop-item-type">[${item.slot}] ${item.isDropOnly ? '· 몬스터 고유 전리품' : ''}</div></div><button class="btn-buy">${equipped ? '✓ 장착중' : '장착'}</button>${nextConfig ? `<button class="btn-upgrade" ${player.scrap < upgradeCost ? 'disabled' : ''}>${nextConfig.suffix} 강화 · ${upgradeCost} G</button>` : ''}`;
      const equipButton = card.querySelector('.btn-buy');
      if (!equipped) equipButton.addEventListener('click', () => { player.equipItem(item); this.renderShopGrid(player); });
      const upgradeButton = card.querySelector('.btn-upgrade');
      if (upgradeButton) upgradeButton.addEventListener('click', () => { if (player.upgradeItem(item)) this.renderShopGrid(player); });
      grid.appendChild(card);
    }
  }

  // 구매 및 즉시 장착 처리
  purchaseItem(player, item) {
    if (player.inventory.some(owned => owned.id === item.id)) {
      player.equipItem(player.inventory.find(owned => owned.id === item.id));
      return;
    }
    if (player.scrap < item.cost) return;

    player.scrap -= item.cost;
    // 캐릭터에게 실시간 장비 장착!
    player.equipItem(item);

    if (window.soundSystem) {
      window.soundSystem.playRobotGlitch();
    }

    // UI 즉시 다시 그리기
    this.renderShopGrid(player);
    if (window.updateHUD) window.updateHUD();
  }

  purchaseMedkit(player) {
    const cost = 100;
    const healAmount = 50;
    if (player.scrap < cost || player.hp >= player.maxHp) return false;

    player.scrap -= cost;
    const healed = Math.min(healAmount, player.maxHp - player.hp);
    player.hp += healed;
    if (window.soundSystem) window.soundSystem.playEquipSound();
    if (window.showToast) window.showToast(`응급 메디킷 사용: HP +${healed}`);
    this.renderShopGrid(player);
    if (window.updateHUD) window.updateHUD();
    return true;
  }

  purchaseChargeCore(player) {
    const cost = 70;
    if (player.scrap < cost || player.battery >= player.maxBattery) return false;

    player.scrap -= cost;
    player.battery = player.maxBattery;
    if (window.soundSystem) window.soundSystem.playEquipSound();
    if (window.showToast) window.showToast('배터리 충전 코어 사용: 배터리 100% 완충 완료!');
    this.renderShopGrid(player);
    if (window.updateHUD) window.updateHUD();
    return true;
  }
}

window.merchantSystem = new MerchantSystem();
