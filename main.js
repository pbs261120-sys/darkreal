/**
 * 100 Days Below - Main Controller & Game Loop
 * 게임 루프, 입력 이벤트, UI 바인딩 및 전역 상태 관리
 */

let canvas, ctx;
let player, combatSystem, stageManager, bossSystem, merchantSystem, soundSystem;
let lastTime = 0;
let gameState = 'TITLE'; // 'TITLE', 'MODE_SELECT', 'PLAYING', 'SHELTER', 'GAMEOVER', 'VICTORY'

const input = {
  keys: {},
  mouseX: 512,
  mouseY: 360,
  mouseDown: false,
  keyboardAim: false
};

// 모달 전환 중에는 남아 있는 키 입력/클릭이 다음 스테이지로 전달되지 않게 한다.
function clearInputState() {
  for (const key of Object.keys(input.keys)) delete input.keys[key];
  input.mouseDown = false;
}

window.setGameState = function(nextState) {
  gameState = nextState;
  clearInputState();
};

// HUD 및 인게임 UI 가시성 토글
function setInGameUIVisible(visible) {
  const elements = [
    document.getElementById('hud-bar'),
    document.getElementById('equipped-gear-hud'),
    document.getElementById('deck-container'),
    document.getElementById('debug-bar')
  ];
  elements.forEach(el => {
    if (el) el.classList.toggle('hud-hidden', !visible);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  soundSystem = window.soundSystem;
  combatSystem = new CombatSystem();
  bossSystem = window.bossSystem;
  merchantSystem = window.merchantSystem;
  stageManager = window.stageManager;

  // 플레이어 생성
  player = new Player(512, 200);

  // 이벤트 리스너 등록
  setupInputListeners();
  setupUIListeners();

  // 초기 시작: 음산한 메인 타이틀 화면 표시
  openTitleScreen();

  // 게임 루프 시작
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
});

function setupInputListeners() {
  window.addEventListener('keydown', (e) => {
    // 방향키와 스페이스는 브라우저의 스크롤/버튼 동작을 막아 게임 입력으로만 사용한다.
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }

    if (e.code === 'KeyC' && gameState === 'CODEX') {
      window.closeCodex();
      return;
    }

    // 상점·게임오버 화면에서는 이동/공격 입력을 저장하지 않는다.
    if (gameState !== 'PLAYING') return;
    input.keys[e.code] = true;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      input.keyboardAim = true;
    }

    // 사운드 초기화 (첫 인터랙션 시)
    if (soundSystem) soundSystem.init();

    // 카드 단축키 (1, 2, 3, 4)
    if (e.code === 'Digit1') triggerCard(0);
    if (e.code === 'Digit2') triggerCard(1);
    if (e.code === 'Digit3') triggerCard(2);
    if (e.code === 'Digit4') triggerCard(3);

    // 디버그 상점 테스트 (B 키)
    if (e.code === 'KeyB') {
      window.openDebugShop();
    }

    // 리프트 위에서는 E 키로도 상점/다음 날 전환을 확정할 수 있다.
    if (e.code === 'KeyE') {
      stageManager.tryEnterElevator(player);
    }

    if (e.code === 'KeyC') {
      window.openCodex();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
    input.keys[e.code] = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    // 방향키 조준을 한 뒤에는 마우스 이동이 캐릭터 방향을 흔들지 않는다.
    if (!input.keyboardAim) {
      input.mouseX = (e.clientX - rect.left) * scaleX;
      input.mouseY = (e.clientY - rect.top) * scaleY;
    }
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      input.mouseDown = true;
      if (soundSystem) soundSystem.init();
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      input.mouseDown = false;
    }
  });
}

// 디버그 버튼과 B 키가 동일하게 상점 상태를 전환하도록 한다.
window.openDebugShop = function() {
  if (!merchantSystem || !player || gameState !== 'PLAYING') return false;
  const opened = merchantSystem.openShop(player, stageManager.currentDay);
  if (opened) window.setGameState('SHELTER');
  return opened;
};

window.openCodex = function() {
  if (!window.bestiarySystem) return false;
  window.bestiarySystem.open(player, stageManager ? stageManager.currentDay : 1);
  return true;
};

window.closeCodex = function() {
  window.bestiarySystem?.close();
};

// 메인 타이틀 화면 열기
window.openTitleScreen = function() {
  window.setGameState('TITLE');
  setInGameUIVisible(false);

  const titleScreen = document.getElementById('title-screen');
  if (titleScreen) titleScreen.classList.add('active');

  const modeScreen = document.getElementById('mode-select-screen');
  if (modeScreen) modeScreen.classList.remove('active');

  const goModal = document.getElementById('gameover-modal');
  if (goModal) goModal.classList.remove('active');

  const vicModal = document.getElementById('victory-modal');
  if (vicModal) vicModal.classList.remove('active');

  const bossHud = document.getElementById('boss-hud');
  if (bossHud) bossHud.style.display = 'none';
};

// 3개 모드 선택 화면 열기
window.openModeSelect = function() {
  if (soundSystem) {
    soundSystem.init();
    soundSystem.playEquipSound();
  }
  window.setGameState('MODE_SELECT');

  const titleScreen = document.getElementById('title-screen');
  if (titleScreen) titleScreen.classList.remove('active');

  const modeScreen = document.getElementById('mode-select-screen');
  if (modeScreen) modeScreen.classList.add('active');
};

// 1. 굴속으로 (클래식 모드 시작)
window.startClassicMode = function() {
  const modeScreen = document.getElementById('mode-select-screen');
  if (modeScreen) modeScreen.classList.remove('active');

  const titleScreen = document.getElementById('title-screen');
  if (titleScreen) titleScreen.classList.remove('active');

  setInGameUIVisible(true);
  window.setGameState('PLAYING');

  // 플레이어 및 1일차 시작
  player = new Player(512, 200);
  combatSystem.reset();
  stageManager.initDay(1, player, bossSystem);
  updateHUD();

  if (soundSystem) {
    soundSystem.init();
    soundSystem.playRobotGlitch();
  }

  if (window.showToast) {
    window.showToast('[작전 개시] 굴속으로 진입합니다. 심연 100층을 향해 하강하십시오!');
  }
};

// 잠금장치 덜컹거리는 애니메이션 & 경고음
window.shakeLockedMode = function(cardEl, modeName) {
  if (!cardEl) return;
  cardEl.classList.remove('rattling');
  void cardEl.offsetWidth; // Reflow 트리거
  cardEl.classList.add('rattling');

  if (soundSystem) {
    soundSystem.playEnemyHit();
  }

  if (window.showToast) {
    window.showToast(`🔒 [보안 잠금] ${modeName} - 출입 인가가 제한되어 있습니다. (차후 업데이트 예정)`);
  }
};

function setupUIListeners() {
  // 타이틀 화면 버튼들
  const btnStartGame = document.getElementById('btn-start-game');
  if (btnStartGame) {
    btnStartGame.addEventListener('click', window.openModeSelect);
  }

  const btnOpenCodexTitle = document.getElementById('btn-open-codex-title');
  if (btnOpenCodexTitle) {
    btnOpenCodexTitle.addEventListener('click', window.openCodex);
  }

  const btnMuteTitle = document.getElementById('btn-mute-title');
  if (btnMuteTitle) {
    btnMuteTitle.addEventListener('click', () => {
      soundSystem.isMuted = !soundSystem.isMuted;
      const text = soundSystem.isMuted ? '소리 꺼짐' : '소리 켬';
      btnMuteTitle.innerText = (soundSystem.isMuted ? '🔇 ' : '🔊 ') + text;
      const btnMute = document.getElementById('btn-mute');
      if (btnMute) btnMute.innerText = text;
    });
  }

  // 모드 선택 화면 버튼들
  const btnSelectClassic = document.getElementById('btn-select-classic');
  if (btnSelectClassic) {
    btnSelectClassic.addEventListener('click', window.startClassicMode);
  }

  const lockedCard1 = document.getElementById('mode-card-locked-1');
  if (lockedCard1) {
    lockedCard1.addEventListener('click', () => window.shakeLockedMode(lockedCard1, '2. 오염된 격리동'));
  }

  const lockedCard2 = document.getElementById('mode-card-locked-2');
  if (lockedCard2) {
    lockedCard2.addEventListener('click', () => window.shakeLockedMode(lockedCard2, '3. 끝없는 시련'));
  }

  const btnBackToTitle = document.getElementById('btn-back-to-title');
  if (btnBackToTitle) {
    btnBackToTitle.addEventListener('click', window.openTitleScreen);
  }

  // 게임오버 화면에서 메인 메뉴 이동
  const btnGotoTitle = document.getElementById('btn-goto-title');
  if (btnGotoTitle) {
    btnGotoTitle.addEventListener('click', window.openTitleScreen);
  }

  // 상점 닫기 및 다음 날 하강 버튼
  const btnCloseShop = document.getElementById('btn-close-shop');
  if (btnCloseShop) {
    btnCloseShop.addEventListener('click', () => {
      merchantSystem.closeShop();
      stageManager.proceedToNextDay(player, bossSystem);
      window.setGameState('PLAYING');
    });
  }

  // 재도전 버튼
  const btnRestartCheckpoint = document.getElementById('btn-restart-checkpoint');
  if (btnRestartCheckpoint) {
    btnRestartCheckpoint.addEventListener('click', () => {
      const cp = stageManager ? stageManager.loadCheckpoint() : 1;
      restartGame(cp);
    });
  }

  const btnRestart = document.getElementById('btn-restart');
  if (btnRestart) {
    btnRestart.addEventListener('click', () => restartGame(1));
  }

  const btnRestartWin = document.getElementById('btn-restart-win');
  if (btnRestartWin) {
    btnRestartWin.addEventListener('click', () => restartGame(1));
  }

  // 디버그 일차 워프
  const btnWarp = document.getElementById('btn-warp');
  const selectDay = document.getElementById('warp-day-select');
  if (btnWarp && selectDay) {
    btnWarp.addEventListener('click', () => {
      const targetDay = parseInt(selectDay.value, 10);
      stageManager.warpToDay(targetDay, player, bossSystem);
    });
  }

  // 사운드 토글
  const btnMute = document.getElementById('btn-mute');
  if (btnMute) {
    btnMute.addEventListener('click', () => {
      soundSystem.isMuted = !soundSystem.isMuted;
      const text = soundSystem.isMuted ? '음소거 됨' : '소리 켬';
      btnMute.innerText = text;
      if (btnMuteTitle) btnMuteTitle.innerText = (soundSystem.isMuted ? '🔇 ' : '🔊 ') + text;
    });
  }
}

function triggerCard(index) {
  if (gameState !== 'PLAYING') return;
  combatSystem.executeCard(player, index, stageManager.enemies, bossSystem);
  renderDeckUI();
}

function gameLoop(time) {
  const dt = Math.min(0.05, (time - lastTime) / 1000);
  lastTime = time;

  // 타이틀 및 모드 선택 화면 중에는 백그라운드 캔버스를 어둡게 유지
  if (gameState === 'TITLE' || gameState === 'MODE_SELECT') {
    ctx.fillStyle = '#040907';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    requestAnimationFrame(gameLoop);
    return;
  }

  // 모달이 사라진 상태에서 SHELTER만 남으면 입력이 영구히 막히지 않도록 즉시 복구한다.
  if (gameState === 'SHELTER') {
    const shopModal = document.getElementById('merchant-modal');
    if (!shopModal || !shopModal.classList.contains('active')) {
      window.setGameState('PLAYING');
      if (window.showToast) window.showToast('상점 전환이 취소되어 게임을 재개합니다.');
    }
  }

  if (gameState === 'PLAYING') {
    // 1. 업데이트
    player.update(dt, input, combatSystem);
    stageManager.update(dt, player, combatSystem, bossSystem);
    combatSystem.update(dt, player, stageManager.enemies, bossSystem);

    // 사망 체크 (이성 제거 후 HP만으로 판정)
    if (player.hp <= 0) {
      window.setGameState('GAMEOVER');
      showGameOverScreen();
    }
  }

  // 2. 렌더링
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 스테이지 배경, 격자, 장애물, 적
  stageManager.render(ctx);

  // 전투 발사체 및 파티클
  combatSystem.render(ctx);

  // 100일차 거대 보스
  if (bossSystem && bossSystem.isActive) {
    bossSystem.render(ctx);
  }

  // 플레이어 및 실시간 장착된 모듈러 장비 렌더링
  player.render(ctx);

  // 2D 어둠 & 조명 시야 마스크 적용 (일차 100 보스전 제외 또는 약화)
  if (stageManager.currentDay < 100) {
    player.renderLighting(ctx, stageManager);
  }

  // HUD 갱신
  updateHUD();
  renderDeckUI();

  requestAnimationFrame(gameLoop);
}

// HUD 인터페이스 동기화
window.updateHUD = function() {
  if (!player) return;

  // HP
  const hpFill = document.getElementById('hud-hp-fill');
  const hpText = document.getElementById('hud-hp-text');
  if (hpFill) hpFill.style.width = `${(player.hp / player.maxHp) * 100}%`;
  if (hpText) hpText.innerText = `${Math.round(player.hp)}/${player.maxHp}`;


  // 배터리
  const battFill = document.getElementById('hud-battery-fill');
  const battText = document.getElementById('hud-battery-text');
  if (battFill) battFill.style.width = `${(player.battery / player.maxBattery) * 100}%`;
  if (battText) battText.innerText = `${Math.round(player.battery)}%`;

  // 펄스 (마나)
  const pulseFill = document.getElementById('hud-pulse-fill');
  const pulseText = document.getElementById('hud-pulse-text');
  if (pulseFill) pulseFill.style.width = `${(player.pulse / player.maxPulse) * 100}%`;
  if (pulseText) pulseText.innerText = `${Math.round(player.pulse)}/${player.maxPulse}`;

  // 고철 & 일차
  const scrapVal = document.getElementById('hud-scrap-val');
  if (scrapVal) scrapVal.innerText = `${player.scrap} G`;

  const dayVal = document.getElementById('hud-day-val');
  if (dayVal) dayVal.innerText = `DAY ${stageManager.currentDay}`;

  // 장착 중인 장비 목록 표시
  const primTxt = document.getElementById('hud-gear-primary');
  const subTxt = document.getElementById('hud-gear-sub');
  const armTxt = document.getElementById('hud-gear-armor');
  const coreTxt = document.getElementById('hud-gear-core');

  if (primTxt) primTxt.innerText = player.equipment.primary ? player.equipment.primary.name : "없음";
  if (subTxt) subTxt.innerText = player.equipment.sub ? player.equipment.sub.name : "없음";
  if (armTxt) armTxt.innerText = player.equipment.armor ? player.equipment.armor.name : "없음";
  if (coreTxt) coreTxt.innerText = player.equipment.core ? player.equipment.core.name : "없음";
};

// 하단 덱 카드 핸드 렌더링
function renderDeckUI() {
  const container = document.getElementById('deck-container');
  if (!container || !player) return;

  // 변경 시에만 가볍게 동기화
  const cards = container.querySelectorAll('.combat-card');
  player.hand.forEach((card, idx) => {
    let cardEl = cards[idx];
    if (!cardEl) return;

    const isAvailable = card.currentCooldown <= 0 && player.pulse >= card.pulseCost;
    if (isAvailable) {
      cardEl.classList.remove('disabled');
    } else {
      cardEl.classList.add('disabled');
    }

    const costBadge = cardEl.querySelector('.card-cost');
    if (costBadge) costBadge.innerText = card.pulseCost;

    const descEl = cardEl.querySelector('.card-desc');
    if (card.currentCooldown > 0) {
      descEl.innerText = `[대기시간 ${card.currentCooldown.toFixed(1)}초]`;
      descEl.style.color = '#ffaa33';
    } else {
      descEl.innerText = card.desc;
      descEl.style.color = '#8fa';
    }
  });
}

// 토스트 메시지
let toastTimer = null;
window.showToast = function(msg) {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;
  toast.innerText = msg;
  toast.classList.add('active');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('active');
  }, 3200);
};

// 게임오버 및 승리 화면
function showGameOverScreen() {
  const modal = document.getElementById('gameover-modal');
  if (!modal) return;

  // 사망 시 장비 초기화 실행
  if (player && player.resetEquipment) {
    player.resetEquipment();
  }

  // 10일 주기 체크포인트 확인 및 UI 갱신
  const cp = stageManager ? stageManager.loadCheckpoint() : 1;
  const cpInfo = document.getElementById('gameover-checkpoint-info');
  const btnCp = document.getElementById('btn-restart-checkpoint');

  if (cp >= 10) {
    const biome = stageManager.getBiomeForDay(cp);
    if (cpInfo) {
      cpInfo.innerText = `🚩 최근 등록된 체크포인트: DAY ${cp} (${biome ? biome.name : ''})`;
    }
    if (btnCp) {
      btnCp.style.display = 'block';
      btnCp.innerText = `🚩 체크포인트 (DAY ${cp})에서 재시작`;
    }
  } else {
    if (cpInfo) cpInfo.innerText = `(아직 도달한 10일 주기 체크포인트가 없습니다)`;
    if (btnCp) btnCp.style.display = 'none';
  }

  modal.classList.add('active');
}

window.showVictoryScreen = function() {
  window.setGameState('VICTORY');
  const modal = document.getElementById('victory-modal');
  if (modal) modal.classList.add('active');
};

function restartGame(targetDay = 1) {
  if (typeof targetDay !== 'number' || isNaN(targetDay)) targetDay = 1;

  const goModal = document.getElementById('gameover-modal');
  const vicModal = document.getElementById('victory-modal');
  if (goModal) goModal.classList.remove('active');
  if (vicModal) vicModal.classList.remove('active');

  const bossHud = document.getElementById('boss-hud');
  if (bossHud) bossHud.style.display = 'none';

  player = new Player(512, 200);
  // 사망 시 장비 초기화 완벽 보장
  player.resetEquipment();

  // 체크포인트 시작 시 재정비 고철 보급
  if (targetDay > 1) {
    player.scrap = 200 + targetDay * 25;
    if (window.showToast) {
      window.showToast(`[DAY ${targetDay} 체크포인트 복구] 정비 보급금 ${player.scrap} G 지급!`);
    }
  } else {
    player.scrap = 200;
  }

  combatSystem.reset();
  stageManager.initDay(targetDay, player, bossSystem);
  window.setGameState('PLAYING');
  updateHUD();
}
