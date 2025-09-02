// 설정 시스템
export class SettingsManager {
  constructor(game) {
    this.game = game;
    this.settings = {
      masterVolume: 0.7,
      sfxVolume: 0.8,
      musicVolume: 0.5,
      showFPS: false,
      showTrajectory: true,
      particleQuality: 'high', // low, medium, high
      screenShake: true,
      colorBlindMode: false
    };
    this.loadSettings();
    this.modal = null;
  }

  loadSettings() {
    const saved = localStorage.getItem('bubbleShooterSettings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
    this.applySettings();
  }

  saveSettings() {
    localStorage.setItem('bubbleShooterSettings', JSON.stringify(this.settings));
    this.applySettings();
  }

  applySettings() {
    // 사운드 설정 적용
    if (this.game.sound) {
      this.game.sound.setMasterVolume(this.settings.masterVolume);
      this.game.sound.setSFXVolume(this.settings.sfxVolume);
      this.game.sound.setMusicVolume(this.settings.musicVolume);
    }

    // 파티클 품질 설정
    if (this.game.particles) {
      this.game.particles.setQuality(this.settings.particleQuality);
    }

    // 색맹 모드 설정
    if (this.settings.colorBlindMode) {
      this.enableColorBlindMode();
    }
  }

  showSettingsModal() {
    this.createModal();
  }

  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'settings-modal';
    this.modal.innerHTML = `
      <div class="settings-content">
        <div class="modal-header">
          <h2>설정</h2>
          <button class="modal-close">&times;</button>
        </div>
        
        <div class="settings-body">
          <div class="setting-group">
            <h3>사운드</h3>
            <div class="setting-item">
              <label>마스터 볼륨</label>
              <input type="range" id="masterVolume" min="0" max="1" step="0.1" value="${this.settings.masterVolume}">
              <span class="volume-value">${Math.round(this.settings.masterVolume * 100)}%</span>
            </div>
            <div class="setting-item">
              <label>효과음 볼륨</label>
              <input type="range" id="sfxVolume" min="0" max="1" step="0.1" value="${this.settings.sfxVolume}">
              <span class="volume-value">${Math.round(this.settings.sfxVolume * 100)}%</span>
            </div>
          </div>

          <div class="setting-group">
            <h3>그래픽</h3>
            <div class="setting-item">
              <label>파티클 품질</label>
              <select id="particleQuality">
                <option value="low" ${this.settings.particleQuality === 'low' ? 'selected' : ''}>낮음</option>
                <option value="medium" ${this.settings.particleQuality === 'medium' ? 'selected' : ''}>보통</option>
                <option value="high" ${this.settings.particleQuality === 'high' ? 'selected' : ''}>높음</option>
              </select>
            </div>
            <div class="setting-item">
              <label>
                <input type="checkbox" id="screenShake" ${this.settings.screenShake ? 'checked' : ''}>
                화면 흔들림 효과
              </label>
            </div>
            <div class="setting-item">
              <label>
                <input type="checkbox" id="showFPS" ${this.settings.showFPS ? 'checked' : ''}>
                FPS 표시
              </label>
            </div>
          </div>

          <div class="setting-group">
            <h3>접근성</h3>
            <div class="setting-item">
              <label>
                <input type="checkbox" id="colorBlindMode" ${this.settings.colorBlindMode ? 'checked' : ''}>
                색맹 지원 모드
              </label>
            </div>
            <div class="setting-item">
              <label>
                <input type="checkbox" id="showTrajectory" ${this.settings.showTrajectory ? 'checked' : ''}>
                궤적 표시 (기본)
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="modal-button modal-button-secondary settings-reset">초기화</button>
          <button class="modal-button modal-button-primary settings-save">저장</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
    this.setupModalEvents();
  }

  setupModalEvents() {
    // 닫기 버튼
    this.modal.querySelector('.modal-close').addEventListener('click', () => {
      this.closeModal();
    });

    // 볼륨 슬라이더
    const volumeSliders = this.modal.querySelectorAll('input[type="range"]');
    volumeSliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        const valueSpan = e.target.nextElementSibling;
        valueSpan.textContent = `${Math.round(value * 100)}%`;
      });
    });

    // 저장 버튼
    this.modal.querySelector('.settings-save').addEventListener('click', () => {
      this.saveSettingsFromModal();
      this.closeModal();
    });

    // 초기화 버튼
    this.modal.querySelector('.settings-reset').addEventListener('click', () => {
      this.resetSettings();
    });

    // 모달 외부 클릭시 닫기
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });
  }

  saveSettingsFromModal() {
    this.settings.masterVolume = parseFloat(this.modal.querySelector('#masterVolume').value);
    this.settings.sfxVolume = parseFloat(this.modal.querySelector('#sfxVolume').value);
    this.settings.particleQuality = this.modal.querySelector('#particleQuality').value;
    this.settings.screenShake = this.modal.querySelector('#screenShake').checked;
    this.settings.showFPS = this.modal.querySelector('#showFPS').checked;
    this.settings.colorBlindMode = this.modal.querySelector('#colorBlindMode').checked;
    this.settings.showTrajectory = this.modal.querySelector('#showTrajectory').checked;

    this.saveSettings();
  }

  resetSettings() {
    this.settings = {
      masterVolume: 0.7,
      sfxVolume: 0.8,
      musicVolume: 0.5,
      showFPS: false,
      showTrajectory: true,
      particleQuality: 'high',
      screenShake: true,
      colorBlindMode: false
    };
    this.saveSettings();
    this.closeModal();
    this.showSettingsModal(); // 다시 열어서 업데이트된 값 표시
  }

  closeModal() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }

  enableColorBlindMode() {
    // 색맹 지원을 위한 패턴 추가
    document.body.classList.toggle('colorblind-mode', this.settings.colorBlindMode);
  }
}
