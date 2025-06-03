const canvas = document.getElementById('pinball');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const startBtn = document.getElementById('start-btn');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let score = 0;
let lives = 3;
let balls = [];
let gameStarted = false;
let gameOver = false;

const keys = { left: false, right: false };

class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 10;
    this.vx = 0;
    this.vy = 0;
    this.launched = false;
    this.gravity = 0.08;
  }
  draw() {
    ctx.beginPath();
    const grad = ctx.createRadialGradient(this.x, this.y, this.r / 2, this.x, this.y, this.r);
    grad.addColorStop(0, '#fffcaa');
    grad.addColorStop(1, '#ffaa00');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#ffbb33';
    ctx.shadowBlur = 10;
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  update() {
    if (!this.launched) return;

    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;

    if (this.x + this.r > WIDTH) {
      this.x = WIDTH - this.r;
      this.vx *= -1;
    }
    if (this.x - this.r < 0) {
      this.x = this.r;
      this.vx *= -1;
    }
    if (this.y - this.r < 0) {
      this.y = this.r;
      this.vy *= -1;
    }

    if (this.y - this.r > HEIGHT) {
      loseBall(this);
    }

    bumpers.forEach(bumper => {
      const dx = this.x - bumper.x;
      const dy = this.y - bumper.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.r + bumper.r) {
        const angle = Math.atan2(dy, dx);
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        this.vx = Math.cos(angle) * speed * 1.2;
        this.vy = Math.sin(angle) * speed * 1.2 * -1;
        const overlap = this.r + bumper.r - dist;
        this.x += Math.cos(angle) * overlap;
        this.y += Math.sin(angle) * overlap;
        score += 10;
        scoreEl.textContent = score;
      }
    });

    flippers.forEach(flipper => {
      if (flipper.isColliding(this)) {
        flipper.bounceBall(this);
      }
    });
  }
}

class Bumper {
  constructor(x, y, r = 25) {
    this.x = x;
    this.y = y;
    this.r = r;
  }
  draw() {
    const grad = ctx.createRadialGradient(this.x, this.y, this.r / 2, this.x, this.y, this.r);
    grad.addColorStop(0, '#ff4466');
    grad.addColorStop(1, '#aa2233');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#ff5577';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

class Flipper {
  constructor(x, y, width, height, isLeft) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.isLeft = isLeft;
    this.angle = 0;
    this.maxAngle = Math.PI / 4;
    this.angularSpeed = 0.05;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.isLeft ? -this.angle : this.angle);
    ctx.fillStyle = '#33ccff';
    ctx.shadowColor = '#33aaff';
    ctx.shadowBlur = 15;
    ctx.fillRect(0, -this.height / 2, this.width, this.height);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  update() {
    if (this.isLeft) {
      if (keys.left && this.angle < this.maxAngle) this.angle += this.angularSpeed;
      else if (!keys.left && this.angle > 0) this.angle -= this.angularSpeed;
    } else {
      if (keys.right && this.angle < this.maxAngle) this.angle += this.angularSpeed;
      else if (!keys.right && this.angle > 0) this.angle -= this.angularSpeed;
    }
  }
  isColliding(ball) {
    let relX = ball.x - this.x;
    let relY = ball.y - this.y;
    let angle = this.isLeft ? -this.angle : this.angle;
    let cosA = Math.cos(-angle);
    let sinA = Math.sin(-angle);
    let localX = relX * cosA - relY * sinA;
    let localY = relX * sinA + relY * cosA;
    return (
      localX > 0 &&
      localX < this.width &&
      localY > -this.height / 2 - ball.r &&
      localY < this.height / 2 + ball.r
    );
  }
  bounceBall(ball) {
    ball.vy = -Math.abs(ball.vy) * 1.5;
    ball.vx += this.isLeft ? -2 : 2;
    if (this.isLeft) ball.x = this.x + this.width + ball.r;
    else ball.x = this.x - ball.r;
  }
}

const bumpers = [
  new Bumper(150, 200),
  new Bumper(250, 300),
  new Bumper(100, 400),
  new Bumper(300, 450),
];

const flippers = [
  new Flipper(120, HEIGHT - 50, 80, 15, true),
  new Flipper(WIDTH - 120 - 80, HEIGHT - 50, 80, 15, false),
];

function loseBall(ball) {
  balls = balls.filter(b => b !== ball);
  lives--;
  livesEl.textContent = lives;

  if (lives > 0) {
    const newBall = new Ball(WIDTH / 2, HEIGHT - 100);
    newBall.launched = false;
    balls.push(newBall);
  } else {
    gameOver = true;
    showGameOver();
  }
}

function showGameOver() {
  finalScoreEl.textContent = score;
  gameOverScreen.style.display = 'flex';
  canvas.style.filter = 'blur(4px)';
  document.getElementById('ui').style.filter = 'blur(4px)';
}

function startGame() {
  score = 0;
  lives = 3;
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  balls = [new Ball(WIDTH / 2, HEIGHT - 100)];
  balls[0].launched = false;
  gameStarted = true;
  gameOver = false;
  startScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';
  canvas.style.filter = 'none';
  document.getElementById('ui').style.filter = 'none';
  animate();
}

restartBtn.addEventListener('click', () => startGame());
startBtn.addEventListener('click', () => startGame());

function clearCanvas() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

function animate() {
  if (!gameStarted) return;
  clearCanvas();
  bumpers.forEach(b => b.draw());
  flippers.forEach(f => {
    f.update();
    f.draw();
  });
  balls.forEach(ball => {
    ball.update();
    ball.draw();
  });
  if (!gameOver) requestAnimationFrame(animate);
}

document.addEventListener('keydown', e => {
  if (e.code === 'Space' && gameStarted && balls.length > 0 && !balls[0].launched) {
    balls[0].vx = 0;
    balls[0].vy = -3;
    balls[0].launched = true;
  }
  if (e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'ArrowRight') keys.right = true;
});
document.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'ArrowRight') keys.right = false;
});

// Touch controls for mobile
document.getElementById('left-btn').addEventListener('touchstart', () => keys.left = true);
document.getElementById('left-btn').addEventListener('touchend', () => keys.left = false);
document.getElementById('right-btn').addEventListener('touchstart', () => keys.right = true);
document.getElementById('right-btn').addEventListener('touchend', () => keys.right = false);
document.getElementById('launch-btn').addEventListener('touchstart', () => {
  if (gameStarted && balls.length > 0 && !balls[0].launched) {
    balls[0].vx = 0;
    balls[0].vy = -3;
    balls[0].launched = true;
  }
});
