// 업적 시스템
export class AchievementManager {
  constructor(game) {
    this.game = game;
    this.achievements = {
      firstPop: {
        name: "First Pop",
        description: "Pop your first cluster of bubbles.",
        unlocked: false,
        reward: { type: 'aimGuide', amount: 1 }
      },
      combo10: {
        name: "Combo Master",
        description: "Pop 10 or more bubbles in a single shot.",
        unlocked: false,
        reward: { type: 'bombBubble', amount: 2 }
      },
      level5: {
        name: "Getting Started",
        description: "Reach level 5.",
        unlocked: false,
        reward: { type: 'multiShot', amount: 1 }
      },
      perfectShot: {
        name: "Perfect Shot",
        description: "Pop bubbles using a wall bounce.",
        unlocked: false,
        reward: { type: 'precisionAim', amount: 1 }
      },
      scoreHunter: {
        name: "Score Hunter",
        description: "Achieve a score of 10,000 points.",
        unlocked: false,
        reward: { type: 'colorBomb', amount: 1 }
      }
    };
    
    this.loadAchievements();
  }

  checkAchievement(type, value = 0) {
    switch (type) {
      case 'firstPop':
        if (!this.achievements.firstPop.unlocked) {
          this.unlockAchievement('firstPop');
        }
        break;
      
      case 'combo':
        if (value >= 10 && !this.achievements.combo10.unlocked) {
          this.unlockAchievement('combo10');
        }
        break;
      
      case 'level':
        if (value >= 5 && !this.achievements.level5.unlocked) {
          this.unlockAchievement('level5');
        }
        break;
      
      case 'wallBounce':
        if (!this.achievements.perfectShot.unlocked) {
          this.unlockAchievement('perfectShot');
        }
        break;
      
      case 'score':
        if (value >= 10000 && !this.achievements.scoreHunter.unlocked) {
          this.unlockAchievement('scoreHunter');
        }
        break;
    }
  }

  unlockAchievement(id) {
    const achievement = this.achievements[id];
    if (!achievement || achievement.unlocked) return;

    achievement.unlocked = true;
    
    // 보상 지급
    if (achievement.reward) {
      if (this.game.powerUps) {
        this.game.powerUps.addPowerUp(achievement.reward.type, achievement.reward.amount);
      } else if (this.game.items[achievement.reward.type]) {
        this.game.items[achievement.reward.type].available += achievement.reward.amount;
      }
    }

    // 업적 알림 표시
    this.showAchievementNotification(achievement);
    this.saveAchievements();
  }

  showAchievementNotification(achievement) {
    // 업적 달성 알림 UI 생성
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">🏆</div>
      <div class="achievement-text">
        <div class="achievement-title">${achievement.name}</div>
        <div class="achievement-desc">${achievement.description}</div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // 3초 후 제거
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  saveAchievements() {
    localStorage.setItem('bubbleShooterAchievements', JSON.stringify(this.achievements));
  }

  loadAchievements() {
    const saved = localStorage.getItem('bubbleShooterAchievements');
    if (saved) {
      const savedAchievements = JSON.parse(saved);
      Object.keys(savedAchievements).forEach(key => {
        if (this.achievements[key]) {
          this.achievements[key].unlocked = savedAchievements[key].unlocked;
        }
      });
    }
  }
}
