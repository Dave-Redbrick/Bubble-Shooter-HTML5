import { getLocalizedString } from "./localization.js";

export class TutorialManager {
  constructor(game) {
    this.game = game;
    this.isActive = false;
    this.currentStep = 0;
    this.steps = [
      {
        titleKey: "tutorialStartTitle",
        descriptionKey: "tutorialStartDescription",
        highlight: "player",
      },
      {
        titleKey: "tutorialMatchTitle",
        descriptionKey: "tutorialMatchDescription",
        highlight: "bubbles",
      },
      {
        titleKey: "tutorialItemsTitle",
        descriptionKey: "tutorialItemsDescription",
        highlight: "items",
      },
      {
        titleKey: "tutorialDangerLineTitle",
        descriptionKey: "tutorialDangerLineDescription",
        highlight: "dangerline",
      },
    ];
    this.overlay = null;
    this.checkFirstTime();
  }

  checkFirstTime() {
    const hasPlayed = window.safeStorage.getItem("beadsShooterPlayed");
    if (!hasPlayed) {
      this.startTutorial();
      window.safeStorage.setItem("beadsShooterPlayed", "true");
    }
  }

  startTutorial() {
    this.isActive = true;
    this.currentStep = 0;
    this.createOverlay();
    this.showStep();
  }

  createOverlay() {
    this.overlay = document.createElement("div");
    this.overlay.className = "tutorial-overlay";
    this.overlay.innerHTML = `
      <div class="tutorial-content">
        <div class="tutorial-title"></div>
        <div class="tutorial-description"></div>
        <div class="tutorial-controls">
          <button class="modal-button modal-button-secondary tutorial-skip">${getLocalizedString("tutorialSkip")}</button>
          <button class="modal-button modal-button-primary tutorial-next">${getLocalizedString("tutorialNext")}</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.overlay);

    this.overlay
      .querySelector(".tutorial-skip")
      .addEventListener("click", () => this.endTutorial());

    this.overlay
      .querySelector(".tutorial-next")
      .addEventListener("click", () => this.nextStep());
  }

  showStep() {
    if (this.currentStep >= this.steps.length) {
      this.endTutorial();
      return;
    }
    const step = this.steps[this.currentStep];
    const titleEl = this.overlay.querySelector(".tutorial-title");
    const descEl = this.overlay.querySelector(".tutorial-description");
    const nextBtn = this.overlay.querySelector(".tutorial-next");

    titleEl.textContent = getLocalizedString(step.titleKey);
    descEl.textContent = getLocalizedString(step.descriptionKey);

    if (this.currentStep === this.steps.length - 1) {
      nextBtn.textContent = getLocalizedString("tutorialFinish");
      nextBtn.classList.add("tutorial-final-step");
    } else {
      nextBtn.textContent = getLocalizedString("tutorialNext");
      nextBtn.classList.remove("tutorial-final-step");
    }

    this.highlightElement(step.highlight);
  }

  highlightElement(target) {
    document.querySelectorAll(".tutorial-highlight").forEach((el) => {
      el.classList.remove("tutorial-highlight");
    });
    switch (target) {
      case "player":
        // add class to canvas container
        document
          .querySelector(".game-canvas-container")
          ?.classList.add("tutorial-highlight");
        break;
      case "bubbles":
        document
          .querySelector(".game-board")
          ?.classList.add("tutorial-highlight");
        break;
      case "items":
        document
          .querySelector(".game-items")
          ?.classList.add("tutorial-highlight");
        break;
      case "dangerline":
        document
          .querySelector(".danger-line")
          ?.classList.add("tutorial-highlight");
        break;
    }
  }

  nextStep() {
    this.currentStep++;
    this.showStep();
  }

  endTutorial() {
    this.isActive = false;
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    document.querySelectorAll(".tutorial-highlight").forEach((el) => {
      el.classList.remove("tutorial-highlight");
    });
  }
}
