export class TutorialManager {
  constructor(game) {
    this.game = game;
    this.isActive = false;
    this.currentStep = 0;
    this.steps = [
      {
        title: "Let's Start!",
        description: "Aim with your mouse and click to shoot a bubble.",
        highlight: "player",
      },
      {
        title: "Match Colors",
        description: "Connect 3 or more bubbles of the same color to pop them.",
        highlight: "bubbles",
      },
      {
        title: "Use Items",
        description: "Click the items at the bottom to use special abilities.",
        highlight: "items",
      },
      {
        title: "Watch the Danger Line",
        description:
          "If the bubbles cross the red dotted line, the game is over!",
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
          <button class="modal-button modal-button-secondary tutorial-skip">Skip</button>
          <button class="modal-button modal-button-primary tutorial-next">Next</button>
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

    titleEl.textContent = step.title;
    descEl.textContent = step.description;

    if (this.currentStep === this.steps.length - 1) {
      nextBtn.textContent = "Finish";
      nextBtn.classList.add("tutorial-final-step");
    } else {
      nextBtn.textContent = "Next";
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
