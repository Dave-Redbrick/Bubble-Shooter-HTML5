import { CONFIG, BUBBLE_COLORS } from "./config.js";

export class Particle {
  constructor(x, y, color, angle, speed) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
    this.life = CONFIG.PARTICLES.LIFE;
    this.maxLife = CONFIG.PARTICLES.LIFE;
    this.size = CONFIG.PARTICLES.SIZE;
    this.alpha = 1;
    this.gravity = CONFIG.PARTICLES.GRAVITY;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt; // 중력 적용

    this.life -= dt;
    this.alpha = Math.max(0, this.life / this.maxLife);
    this.size = CONFIG.PARTICLES.SIZE * this.alpha;

    return this.life > 0;
  }

  render(ctx) {
    if (this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    // 파티클 그라디언트
    const gradient = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.size
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class ParticleSystem {
  constructor(game) {
    this.game = game;
    this.particles = [];
    this.quality = 'high'; // low, medium, high
  }

  setQuality(quality) {
    this.quality = quality;
  }

  getParticleCount(baseCount) {
    switch (this.quality) {
      case 'low': return Math.floor(baseCount * 0.3);
      case 'medium': return Math.floor(baseCount * 0.6);
      case 'high': return baseCount;
      default: return baseCount;
    }
  }

  createBurstEffect(x, y, color, count = CONFIG.PARTICLES.COUNT) {
    const particleCount = this.getParticleCount(count);
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = CONFIG.PARTICLES.SPEED + Math.random() * 100;

      this.particles.push(new Particle(x, y, color, angle, speed));
    }
  }

  createPopEffect(x, y, color) {
    const particleCount = this.getParticleCount(8);
    // 중심에서 퍼지는 효과
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 200 + Math.random() * 150;

      this.particles.push(new Particle(x, y, color, angle, speed));
    }

    // 추가 작은 파티클들
    const smallParticleCount = this.getParticleCount(6);
    for (let i = 0; i < smallParticleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 100;

      const particle = new Particle(
        x,
        y,
        "rgba(255, 255, 255, 0.8)",
        angle,
        speed
      );
      particle.size = 3;
      this.particles.push(particle);
    }
  }

  // 연쇄 터짐 효과 - 더 강화된 버전
  createChainPopEffect(x, y, color, delay = 0) {
    // 메인 폭발 효과
    setTimeout(() => {
      const mainParticleCount = this.getParticleCount(12);
      // 큰 폭발 파티클
      for (let i = 0; i < mainParticleCount; i++) {
        const angle = (Math.PI * 2 * i) / mainParticleCount + Math.random() * 0.3;
        const speed = 250 + Math.random() * 200;

        const particle = new Particle(x, y, color, angle, speed);
        particle.size = 8 + Math.random() * 4;
        this.particles.push(particle);
      }

      const sparkParticleCount = this.getParticleCount(15);
      // 반짝이는 작은 파티클들
      for (let i = 0; i < sparkParticleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 150 + Math.random() * 150;

        const sparkColor =
          Math.random() > 0.5 ? "rgba(255, 255, 255, 0.9)" : color;
        const particle = new Particle(x, y, sparkColor, angle, speed);
        particle.size = 2 + Math.random() * 3;
        particle.life = 0.8 + Math.random() * 0.4;
        particle.maxLife = particle.life;
        this.particles.push(particle);
      }

      const centerParticleCount = this.getParticleCount(6);
      // 중심 폭발 효과
      for (let i = 0; i < centerParticleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 100;

        const particle = new Particle(
          x,
          y,
          "rgba(255, 255, 0, 0.8)",
          angle,
          speed
        );
        particle.size = 6;
        particle.life = 0.5;
        particle.maxLife = 0.5;
        this.particles.push(particle);
      }
    }, delay * 1000);
  }

  // 폭탄 폭발 효과
  createBombEffect(x, y) {
    const ringParticleCount = this.getParticleCount(20);
    // 큰 폭발 링
    for (let i = 0; i < ringParticleCount; i++) {
      const angle = (Math.PI * 2 * i) / ringParticleCount;
      const speed = 400 + Math.random() * 200;

      const particle = new Particle(x, y, "#ff6600", angle, speed);
      particle.size = 12 + Math.random() * 8;
      particle.life = 1.5;
      particle.maxLife = 1.5;
      this.particles.push(particle);
    }

    const innerParticleCount = this.getParticleCount(15);
    // 내부 폭발
    for (let i = 0; i < innerParticleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 200 + Math.random() * 300;

      const particle = new Particle(x, y, "#ffaa00", angle, speed);
      particle.size = 8 + Math.random() * 6;
      particle.life = 1.2;
      particle.maxLife = 1.2;
      this.particles.push(particle);
    }

    const fireParticleCount = this.getParticleCount(25);
    // 불꽃 파티클
    for (let i = 0; i < fireParticleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 400;

      const colors = ["#ff3300", "#ff6600", "#ffaa00", "#ffff00"];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const particle = new Particle(x, y, color, angle, speed);
      particle.size = 4 + Math.random() * 4;
      particle.life = 0.8 + Math.random() * 0.6;
      particle.maxLife = particle.life;
      this.particles.push(particle);
    }

    const smokeParticleCount = this.getParticleCount(10);
    // 연기 효과
    for (let i = 0; i < smokeParticleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;

      const particle = new Particle(
        x,
        y,
        "rgba(100, 100, 100, 0.6)",
        angle,
        speed
      );
      particle.size = 15 + Math.random() * 10;
      particle.life = 2.0;
      particle.maxLife = 2.0;
      particle.gravity = -50; // 연기는 위로 올라감
      this.particles.push(particle);
    }
  }

  // 레벨 완료 축하 효과
  createLevelCompleteEffect() {
    const canvas = this.game.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // 폭죽 효과
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const x = centerX + (Math.random() - 0.5) * 400;
        const y = centerY + (Math.random() - 0.5) * 200;
        
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        this.createBurstEffect(x, y, color, 20);
      }, i * 300);
    }
  }

  update(dt) {
    this.particles = this.particles.filter((particle) => particle.update(dt));
  }

  render(ctx) {
    this.particles.forEach((particle) => particle.render(ctx));
  }

  clear() {
    this.particles = [];
  }
}