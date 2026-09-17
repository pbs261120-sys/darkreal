class BestiarySystem {
  open(player, day) {
    this.player = player;
    this.day = day;
    this.render('entities');
    document.getElementById('codex-modal')?.classList.add('active');
    if (window.setGameState) window.setGameState('CODEX');
  }

  close() {
    document.getElementById('codex-modal')?.classList.remove('active');
    if (window.setGameState) window.setGameState('PLAYING');
  }

  recordKill(typeKey, player) {
    player.killCounts[typeKey] = (player.killCounts[typeKey] || 0) + 1;
    const entry = BESTIARY_DATA[typeKey];
    if (entry && player.killCounts[typeKey] === entry.guideKills && window.showToast) {
      window.showToast(`[도감 갱신] ${entry.name} 공략이 해금되었습니다.`);
    }
  }

  render(tab) {
    const content = document.getElementById('codex-content');
    if (!content || !this.player) return;
    document.querySelectorAll('[data-codex-tab]').forEach(btn => btn.classList.toggle('selected', btn.dataset.codexTab === tab));
    content.innerHTML = tab === 'lore' ? this.renderLore() : this.renderEntities();
  }

  renderEntities() {
    return `<div class="codex-grid">${Object.values(BESTIARY_DATA).map(entry => {
      const kills = this.player.killCounts[entry.id] || 0;
      const discovered = kills > 0;
      const guideUnlocked = kills >= entry.guideKills;
      if (!discovered) return `<article class="codex-entry locked"><h3>???</h3><p>미확인 생체 신호</p><small>처치 후 기록이 복원됩니다.</small></article>`;
      return `<article class="codex-entry"><div class="codex-grade" style="color:${entry.grade.color}">[${entry.grade.name}]</div><h3>${entry.name}</h3><p class="codex-meta">${entry.biome} · 처치 ${kills}회</p><p>${entry.desc}</p><p><b>드롭:</b> ${entry.dropInfo}</p>${guideUnlocked ? `<section class="codex-guide"><b>공략 해금 · ${entry.pattern.name}</b><p>${entry.pattern.guide}</p><p><b>약점:</b> ${entry.weakness}</p></section>` : `<section class="codex-locked-guide">공략 데이터 복구 중: ${kills}/${entry.guideKills} 처치</section>`}</article>`;
    }).join('')}</div>`;
  }

  renderLore() {
    return `<div class="lore-list">${LORE_DATA.map(note => note.unlockDay <= this.day ? `<article class="codex-entry lore-entry"><div class="codex-grade">[DAY ${note.unlockDay} 기록]</div><h3>${note.title}</h3><p>${note.text}</p></article>` : `<article class="codex-entry locked"><h3>잠긴 기록</h3><p>DAY ${note.unlockDay}에 도달하면 복원됩니다.</p></article>`).join('')}</div>`;
  }
}

window.bestiarySystem = new BestiarySystem();
