import { getLocalizedString, setLanguage } from "./localization.js";

// Settings System
export class SettingsManager {
  constructor(game) {
    this.game = game;
    this.settings = {
      masterVolume: 0.5,
      sfxVolume: 0.5,
      musicVolume: 0.5,
      showFPS: false,
      showTrajectory: true,
      particleQuality: "high", // low, medium, high
      screenShake: true,
      colorBlindMode: false,
      language: "en",
    };
    this.loadSettings();
    this.modal = null;
  }

  loadSettings() {
    const saved = window.safeStorage.getItem("beadsShooterSettings");
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
    this.applySettings();
  }

  saveSettings() {
    window.safeStorage.setItem(
      "beadsShooterSettings",
      JSON.stringify(this.settings)
    );
    this.applySettings();
  }

  applySettings() {
    setLanguage(this.settings.language);

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
    this.modal = document.createElement("div");
    this.modal.className = "settings-modal";
    this.modal.innerHTML = `
      <div class="settings-content">
        <div class="modal-header">
          <h2>${getLocalizedString("settings")}</h2>
          <button class="modal-close">&times;</button>
        </div>
        
        <div class="settings-body">
          <div class="setting-group">
            <h3>${getLocalizedString("language")}</h3>
            <div class="setting-item">
              <label>${getLocalizedString("language")}</label>
              <select id="language">
                <option value="en" ${
                  this.settings.language === "en" ? "selected" : ""
                }>English</option>
                <option value="fr" ${
                  this.settings.language === "fr" ? "selected" : ""
                }>Français</option>
                <option value="it" ${
                  this.settings.language === "it" ? "selected" : ""
                }>Italiano</option>
                <option value="de" ${
                  this.settings.language === "de" ? "selected" : ""
                }>Deutsch</option>
                <option value="es" ${
                  this.settings.language === "es" ? "selected" : ""
                }>Español</option>
                <option value="zh-CN" ${
                  this.settings.language === "zh-CN" ? "selected" : ""
                }>简体中文</option>
                <option value="ja" ${
                  this.settings.language === "ja" ? "selected" : ""
                }>日本語</option>
                <option value="ko" ${
                  this.settings.language === "ko" ? "selected" : ""
                }>한국어</option>
              </select>
            </div>
          </div>

          <div class="setting-group">
            <h3>${getLocalizedString("sound")}</h3>
            <div class="setting-item">
              <label>${getLocalizedString("masterVolume")}</label>
              <div class="slider-container">
                <input type="range" id="masterVolume" min="0" max="1" step="0.1" value="${
                  this.settings.masterVolume
                }">
                <div class="slider-track"></div>
              </div>
              <span class="volume-value">${Math.round(
                this.settings.masterVolume * 100
              )}%</span>
            </div>
            <div class="setting-item">
              <label>${getLocalizedString("sfxVolume")}</label>
              <div class="slider-container">
                <input type="range" id="sfxVolume" min="0" max="1" step="0.1" value="${
                  this.settings.sfxVolume
                }">
                <div class="slider-track"></div>
              </div>
              <span class="volume-value">${Math.round(
                this.settings.sfxVolume * 100
              )}%</span>
            </div>
            <div class="setting-item">
              <label>${getLocalizedString("musicVolume")}</label>
              <div class="slider-container">
                <input type="range" id="musicVolume" min="0" max="1" step="0.1" value="${
                  this.settings.musicVolume
                }">
                <div class="slider-track"></div>
              </div>
              <span class="volume-value">${Math.round(
                this.settings.musicVolume * 100
              )}%</span>
            </div>
          </div>

          <div class="setting-group">
            <h3>${getLocalizedString("graphics")}</h3>
            <div class="setting-item">
              <label>${getLocalizedString("particleQuality")}</label>
              <select id="particleQuality">
                <option value="low" ${
                  this.settings.particleQuality === "low" ? "selected" : ""
                }>${getLocalizedString("low")}</option>
                <option value="medium" ${
                  this.settings.particleQuality === "medium" ? "selected" : ""
                }>${getLocalizedString("medium")}</option>
                <option value="high" ${
                  this.settings.particleQuality === "high" ? "selected" : ""
                }>${getLocalizedString("high")}</option>
              </select>
            </div>
            <div class="setting-item">
              <label class="checkbox-container" for="screenShake">
                ${getLocalizedString("screenShake")}
                <input type="checkbox" id="screenShake" ${
                  this.settings.screenShake ? "checked" : ""
                }>
                <span class="checkmark"></span>
              </label>
            </div>
            <div class="setting-item">
              <label class="checkbox-container" for="showFPS">
                ${getLocalizedString("showFPS")}
                <input type="checkbox" id="showFPS" ${
                  this.settings.showFPS ? "checked" : ""
                }>
                <span class="checkmark"></span>
              </label>
            </div>
          </div>

          <div class="setting-group">
            <h3>${getLocalizedString("accessibility")}</h3>
            <div class="setting-item">
              <label class="checkbox-container" for="colorBlindMode">
                ${getLocalizedString("colorBlindMode")}
                <input type="checkbox" id="colorBlindMode" ${
                  this.settings.colorBlindMode ? "checked" : ""
                }>
                <span class="checkmark"></span>
              </label>
            </div>
            <div class="setting-item">
              <label class="checkbox-container" for="showTrajectory">
                ${getLocalizedString("showTrajectory")}
                <input type="checkbox" id="showTrajectory" ${
                  this.settings.showTrajectory ? "checked" : ""
                }>
                <span class="checkmark"></span>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="modal-button modal-button-secondary settings-reset">${getLocalizedString(
            "reset"
          )}</button>
          <button class="modal-button modal-button-primary settings-save">${getLocalizedString(
            "save"
          )}</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
    this.setupModalEvents();
  }

  setupModalEvents() {
    // 닫기 버튼
    this.modal.querySelector(".modal-close").addEventListener("click", () => {
      this.closeModal();
    });

    // 언어 변경
    this.modal.querySelector("#language").addEventListener("change", (e) => {
      this.settings.language = e.target.value;
      this.saveSettings();
      this.closeModal();
      this.showSettingsModal();
    });

    // 볼륨 슬라이더
    const volumeSliders = this.modal.querySelectorAll('input[type="range"]');
    volumeSliders.forEach((slider) => {
      slider.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        const valueSpan = e.target.parentElement.nextElementSibling;
        valueSpan.textContent = `${Math.round(value * 100)}%`;
      });
      slider.addEventListener("change", () => this.applySettings());
    });

    // 저장 버튼
    this.modal.querySelector(".settings-save").addEventListener("click", () => {
      this.saveSettingsFromModal();
      this.closeModal();
    });

    // 초기화 버튼
    this.modal
      .querySelector(".settings-reset")
      .addEventListener("click", () => {
        this.resetSettings();
      });

    // 모달 외부 클릭시 닫기
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });
  }

  saveSettingsFromModal() {
    this.settings.language = this.modal.querySelector("#language").value;
    this.settings.masterVolume = parseFloat(
      this.modal.querySelector("#masterVolume").value
    );
    this.settings.sfxVolume = parseFloat(
      this.modal.querySelector("#sfxVolume").value
    );
    this.settings.musicVolume = parseFloat(
      this.modal.querySelector("#musicVolume").value
    );
    this.settings.particleQuality =
      this.modal.querySelector("#particleQuality").value;
    this.settings.screenShake =
      this.modal.querySelector("#screenShake").checked;
    this.settings.showFPS = this.modal.querySelector("#showFPS").checked;
    this.settings.colorBlindMode =
      this.modal.querySelector("#colorBlindMode").checked;
    this.settings.showTrajectory =
      this.modal.querySelector("#showTrajectory").checked;

    this.saveSettings();
  }

  resetSettings() {
    this.settings = {
      masterVolume: 0.7,
      sfxVolume: 0.8,
      musicVolume: 0.5,
      showFPS: false,
      showTrajectory: true,
      particleQuality: "high",
      screenShake: true,
      colorBlindMode: false,
      language: "en",
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
    // Add patterns for colorblind support
    document.body.classList.toggle(
      "colorblind-mode",
      this.settings.colorBlindMode
    );
  }
}
