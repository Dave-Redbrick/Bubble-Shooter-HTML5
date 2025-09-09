// dailychallenge system(removed)
export class DailyChallengeManager {
  constructor(game) {
    this.game = game;
    this.challenges = [];
    this.currentChallenge = null;
    this.completedChallenges = new Set();
    this.loadProgress();
    this.generateDailyChallenges();
  }

  loadProgress() {
    const saved = localStorage.getItem('bubbleShooterDailyChallenges');
    if (saved) {
      const data = JSON.parse(saved);
      this.completedChallenges = new Set(data.completed || []);
    }
  }

  saveProgress() {
    const data = {
      completed: Array.from(this.completedChallenges),
      lastUpdate: new Date().toDateString()
    };
    localStorage.setItem('bubbleShooterDailyChallenges', JSON.stringify(data));
  }

  generateDailyChallenges() {
    const today = new Date().toDateString();
    const seed = this.hashCode(today);
    
    this.challenges = [
      {
        id: `${today}-1`,
        title: '정확한 사수',
        description: '10번의 발사로 50개 이상의 버블을 터뜨리세요',
        type: 'efficiency',
        target: { shots: 10, bubbles: 50 },
        reward: { type: 'aimGuide', amount: 2 },
        progress: { shots: 0, bubbles: 0 }
      },
      {
        id: `${today}-2`,
        title: '콤보 마스터',
        description: '5콤보 이상을 3번 달성하세요',
        type: 'combo',
        target: { combos: 3, minCombo: 5 },
        reward: { type: 'bombBubble', amount: 1 },
        progress: { combos: 0 }
      },
      {
        id: `${today}-3`,
        title: '스피드 러너',
        description: '3분 안에 레벨 3에 도달하세요',
        type: 'speed',
        target: { time: 180, level: 3 },
        reward: { type: 'score', amount: 5000 },
        progress: { startTime: null, completed: false }
      }
    ];
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  startChallenge(challengeId) {
    this.currentChallenge = this.challenges.find(c => c.id === challengeId);
    if (this.currentChallenge && this.currentChallenge.type === 'speed') {
      this.currentChallenge.progress.startTime = Date.now();
    }
  }

  updateProgress(type, data) {
    if (!this.currentChallenge) return;

    const challenge = this.currentChallenge;
    
    switch (type) {
      case 'bubbleShot':
        if (challenge.type === 'efficiency') {
          challenge.progress.shots++;
        }
        break;
        
      case 'bubblesPopped':
        if (challenge.type === 'efficiency') {
          challenge.progress.bubbles += data.count;
        }
        break;
        
      case 'combo':
        if (challenge.type === 'combo' && data.count >= challenge.target.minCombo) {
          challenge.progress.combos++;
        }
        break;
        
      case 'levelReached':
        if (challenge.type === 'speed' && data.level >= challenge.target.level) {
          const elapsed = (Date.now() - challenge.progress.startTime) / 1000;
          if (elapsed <= challenge.target.time) {
            challenge.progress.completed = true;
          }
        }
        break;
    }

    this.checkCompletion();
  }

  checkCompletion() {
    if (!this.currentChallenge) return;

    const challenge = this.currentChallenge;
    let completed = false;

    switch (challenge.type) {
      case 'efficiency':
        completed = challenge.progress.shots <= challenge.target.shots && 
                   challenge.progress.bubbles >= challenge.target.bubbles;
        break;
        
      case 'combo':
        completed = challenge.progress.combos >= challenge.target.combos;
        break;
        
      case 'speed':
        completed = challenge.progress.completed;
        break;
    }

    if (completed && !this.completedChallenges.has(challenge.id)) {
      this.completeChallenge(challenge);
    }
  }

  completeChallenge(challenge) {
    this.completedChallenges.add(challenge.id);
    this.saveProgress();

    // 보상 지급
    if (challenge.reward.type === 'score') {
      this.game.updateScore(challenge.reward.amount);
    } else if (this.game.items[challenge.reward.type]) {
      this.game.items[challenge.reward.type].available += challenge.reward.amount;
    }

    // 완료 알림
    this.showCompletionNotification(challenge);
  }

  showCompletionNotification(challenge) {
    const notification = document.createElement('div');
    notification.className = 'challenge-notification';
    notification.innerHTML = `
      <div class="challenge-icon">🎯</div>
      <div class="challenge-text">
        <div class="challenge-title">도전 완료!</div>
        <div class="challenge-name">${challenge.title}</div>
        <div class="challenge-reward">보상: ${this.getRewardText(challenge.reward)}</div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 4000);
  }

  getRewardText(reward) {
    switch (reward.type) {
      case 'aimGuide': return `조준 가이드 ${reward.amount}개`;
      case 'bombBubble': return `폭탄 버블 ${reward.amount}개`;
      case 'score': return `${reward.amount.toLocaleString()}점`;
      default: return '특별 보상';
    }
  }

  showChallengesModal() {
    const modal = document.createElement('div');
    modal.className = 'challenges-modal';
    
    let challengesHTML = '';
    this.challenges.forEach(challenge => {
      const isCompleted = this.completedChallenges.has(challenge.id);
      const progressText = this.getProgressText(challenge);
      
      challengesHTML += `
        <div class="challenge-item ${isCompleted ? 'completed' : ''}">
          <div class="challenge-header">
            <div class="challenge-title">${challenge.title}</div>
            <div class="challenge-status">${isCompleted ? '✅ 완료' : '⏳ 진행중'}</div>
          </div>
          <div class="challenge-description">${challenge.description}</div>
          <div class="challenge-progress">${progressText}</div>
          <div class="challenge-reward">보상: ${this.getRewardText(challenge.reward)}</div>
          ${!isCompleted ? `<button class="start-challenge" data-id="${challenge.id}">도전 시작</button>` : ''}
        </div>
      `;
    });

    modal.innerHTML = `
      <div class="challenges-content">
        <div class="challenges-header">
          <h2>🎯 일일 도전</h2>
          <button class="challenges-close">&times;</button>
        </div>
        <div class="challenges-list">
          ${challengesHTML}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 이벤트 리스너
    modal.querySelector('.challenges-close').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelectorAll('.start-challenge').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const challengeId = e.target.dataset.id;
        this.startChallenge(challengeId);
        this.game.newGame();
        modal.remove();
      });
    });
  }

  getProgressText(challenge) {
    const progress = challenge.progress;
    
    switch (challenge.type) {
      case 'efficiency':
        return `발사: ${progress.shots}/${challenge.target.shots}, 터뜨린 버블: ${progress.bubbles}/${challenge.target.bubbles}`;
      case 'combo':
        return `달성한 콤보: ${progress.combos}/${challenge.target.combos}`;
      case 'speed':
        return progress.completed ? '완료!' : '진행중...';
      default:
        return '진행중...';
    }
  }
}