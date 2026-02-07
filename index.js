let collisionsEnabled = true; // true = balls collide, false = ignore collisions

let saulAutoSpawnInterval = null;




let autoClickerInterval = null;

const ballImage = new Image();
ballImage.src = "image.png"; // make sure image.png is in the same folder

let saulsMode = false;   // Saul's Mode off by default
let shakeAmount = 9999999;
let shakeDecay = 99999;
let shakeOffset = { x: 0, y: 0 };




const shakeStrength = 10; // how strong the shake is

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (!saulsMode) {
    // NORMAL MODE → fading trail
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  // SAUL MODE → NO CLEARING (permanent trail)

  for (let body of bodies) {
    if (saulsMode && ballImage.complete) {
      // Saul image
      ctx.drawImage(
        ballImage,
        body.position.x - body.radius,
        body.position.y - body.radius,
        body.radius * 2,
        body.radius * 2
      );
    } else {
      // Normal white ball
      ctx.beginPath();
      ctx.arc(body.position.x, body.position.y, body.radius, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
    }
  }
}











class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  scale(s) {
    this.x *= s;
    this.y *= s;
    return this;
  }

  clone() {
    return new Vec2(this.x, this.y);
  }
}
class Body {
  constructor(x, y, radius = 10) {
    this.position = new Vec2(x, y);
    this.velocity = new Vec2(0, 0);
    this.acceleration = new Vec2(0, 0);
    this.radius = radius;
    this.mass = 1;
  }

  applyForce(force) {
    this.acceleration.add(force.clone().scale(1 / this.mass));
  }

  update(dt) {
    this.velocity.add(this.acceleration.clone().scale(dt));
    this.position.add(this.velocity.clone().scale(dt));
    this.acceleration = new Vec2(0, 0);
  }
}
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const gravity = new Vec2(0, 500); // pixels/sec²
const bodies = [];

let isDragging = false; // true when drag mode is active

const draggOnBtn = document.getElementById("draggOnBtn");
const draggOffBtn = document.getElementById("draggOffBtn");

draggOnBtn.addEventListener("click", () => {
  isDragging = true;
});

draggOffBtn.addEventListener("click", () => {
  isDragging = false;
});

let mouseDown = false;

canvas.addEventListener("mousedown", (e) => {
  mouseDown = true;
});

canvas.addEventListener("mouseup", (e) => {
  mouseDown = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (isDragging && mouseDown) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    bodies.push(new Body(x, y, 12));
  }
});




function resolveBallCollisions() {
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i];
      const b = bodies[j];

      const dx = b.position.x - a.position.x;
      const dy = b.position.y - a.position.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.radius + b.radius;

      if (dist === 0 || dist >= minDist) continue;

      const nx = dx / dist;
      const ny = dy / dist;

      // Relative velocity
      const dvx = b.velocity.x - a.velocity.x;
      const dvy = b.velocity.y - a.velocity.y;
      const dot = dvx * nx + dvy * ny;

      // Skip if balls are moving away
      if (dot > 0) continue;

      // Simple elastic collision for equal mass
      const impulse = dot;
      a.velocity.x += nx * impulse;
      a.velocity.y += ny * impulse;
      b.velocity.x -= nx * impulse;
      b.velocity.y -= ny * impulse;

      // Positional correction
      const overlap = minDist - dist;
      a.position.x -= nx * overlap / 2;
      a.position.y -= ny * overlap / 2;
      b.position.x += nx * overlap / 2;
      b.position.y += ny * overlap / 2;
    }
  }
}





let lastTime = performance.now();

function loop(time) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  update(dt);
  draw(); // must be the draw() with Saul's Mode logic

  requestAnimationFrame(loop);
}




function update(dt) {
  for (let body of bodies) {
    body.applyForce(gravity);
    body.update(dt);

    // floor collision
    if (body.position.y + body.radius > canvas.height) {
      body.position.y = canvas.height - body.radius;
      body.velocity.y *= -0.7;
    }

    // left wall
    if (body.position.x - body.radius < 0) {
      body.position.x = body.radius;
      body.velocity.x *= -0.7;
    }

    // right wall
    if (body.position.x + body.radius > canvas.width) {
      body.position.x = canvas.width - body.radius;
      body.velocity.x *= -0.7;
    }
  }

  if (collisionsEnabled) {
    resolveBallCollisions();
  }
}



requestAnimationFrame(loop);

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const ball = new Body(x, y, 12); // spawn a ball at click
  bodies.push(ball);               // add it to your simulation
});


function autoClickCanvas(interval = 1000) {
  setInterval(() => {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height / 2; // spawn in upper half
    const ball = new Body(x, y, 12);
    bodies.push(ball);
  }, interval);
}

// Start auto-clicker
let autoSpawnInterval = null; // store interval ID

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");

// Start auto-spawning when clicked
startBtn.addEventListener("click", () => {
  if (!autoSpawnInterval) { // only start if not already running
    autoSpawnInterval = setInterval(() => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height / 2;
      bodies.push(new Body(x, y, 12));
    }, 1); // spawn every 500ms
  }
});

// Stop auto-spawning when clicked
stopBtn.addEventListener("click", () => {
  clearInterval(autoSpawnInterval);
  autoSpawnInterval = null; // reset so it can be started again
});

resetBtn.addEventListener("click", () => {
  bodies.length = 0;       // remove all balls
  saulsMode = false;       // turn off Saul's Mode
  shakeAmount = 0;         // stop shaking

  // Stop all intervals
  if (autoSpawnInterval) {
    clearInterval(autoSpawnInterval);
    autoSpawnInterval = null;
  }
  if (saulAutoSpawnInterval) {
    clearInterval(saulAutoSpawnInterval);
    saulAutoSpawnInterval = null;
  }
  if (autoClickerInterval) {
    clearInterval(autoClickerInterval);
    autoClickerInterval = null;
  }

  // Stop drag
  isDragging = false;
});



canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const ball = new Body(x, y, 12);
  bodies.push(ball);

  console.log(`Ball spawned at x: ${x}, y: ${y}`);
});

startBtn.addEventListener("click", () => {
  if (!autoSpawnInterval) {
    autoSpawnInterval = setInterval(() => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height / 2;
      const ball = new Body(x, y, 12);
      bodies.push(ball);

      console.log(`Ball auto-spawned at x: ${x.toFixed(1)}, y: ${y.toFixed(1)}`);
    }, 500);
  }
});


const collideOnBtn = document.getElementById("collideOnBtn");
const collideOffBtn = document.getElementById("collideOffBtn");

collideOnBtn.addEventListener("click", () => collisionsEnabled = true);
collideOffBtn.addEventListener("click", () => collisionsEnabled = false);

let mouseX = 0;
let mouseY = 0;

let mouseOverCanvas = false;

canvas.addEventListener("mouseenter", () => {
  mouseOverCanvas = true;
});

canvas.addEventListener("mouseleave", () => {
  mouseOverCanvas = false;
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

const autoClickerBtn = document.getElementById("autoClickerBtn");
const autoClickerOffBtn = document.getElementById("autoClickerOffBtn");



function dispatchClick() {
  const rect = canvas.getBoundingClientRect();
  const event = new MouseEvent("click", {
    clientX: rect.left + mouseX,
    clientY: rect.top + mouseY,
    bubbles: true
  });

  canvas.dispatchEvent(event);
}

function startAutoClicker() {
  if (autoClickerInterval) return; // already running

  autoClickerInterval = setInterval(() => {
    if (mouseOverCanvas) dispatchClick(); // only click if mouse is inside
  }, 20); // 20 clicks per second
}


function stopAutoClicker() {
  clearInterval(autoClickerInterval);
  autoClickerInterval = null;
}






// Buttons
autoClickerBtn.addEventListener("click", startAutoClicker);
autoClickerOffBtn.addEventListener("click", stopAutoClicker);

const rgbButton = document.getElementById("saulsModeBtn");

let hue = 0; // starting hue

function updateButtonColor() {
  // HSL works well for smooth color cycling
  rgbButton.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;

  // increment hue for next frame
  hue = (hue + 1) % 360;

  requestAnimationFrame(updateButtonColor); // keep updating
}

// Start the RGB cycle
updateButtonColor();

// Wait for image to load first
ballImage.onload = () => {
  requestAnimationFrame(loop);
};

const saulsModeBtn = document.getElementById("saulsModeBtn");

saulsModeBtn.addEventListener("click", () => {
  saulsMode = !saulsMode; // toggle Saul Mode

  if (saulsMode) {
    // Start shaking
    shakeAmount = 10;

    // Start the dynamic auto-spawn
    if (!saulAutoSpawnInterval) {
      saulAutoSpawnInterval = setInterval(() => {
        const saulCount = countSaulBalls();
        let interval = 1000 / 50; // default 30 per second
        let spawnCount = 1;

        if (saulCount > 50) {
          interval = 1000 / 5; // 5 per second
        }

        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height / 2;
        bodies.push(new Body(x, y, 12));

      }, 30); // default ~30 per sec (1000ms / 30 ≈ 33ms)
    }
  } else {
    // Stop shaking
    shakeAmount = 0;

    // Stop Saul Mode auto-spawn
    if (saulAutoSpawnInterval) {
      clearInterval(saulAutoSpawnInterval);
      saulAutoSpawnInterval = null;
    }
  }
});

const bgMusic = new Audio("song.mp3");
bgMusic.loop = true; // loop the song

// Play immediately (or after a button click)
function playMusic() {
  bgMusic.play().catch(e => console.log("User interaction required to play music."));
}

// Pause music
function pauseMusic() {
  bgMusic.pause();
}

// Optional: add buttons
const playBtn = document.getElementById("playMusicBtn");
const pauseBtn = document.getElementById("pauseMusicBtn");

playBtn.addEventListener("click", playMusic);
pauseBtn.addEventListener("click", pauseMusic);




resetBtn.addEventListener("click", () => {
  bodies.length = 0;       // remove all balls
  saulsMode = false;       // turn off Saul's Mode
  shakeAmount = 0;         // stop shaking
});

function updateBackground() {
  if (saulsMode && ballImage.complete) {
    // Set body background to the image
    document.body.style.backgroundImage = `url(${ballImage.src})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    
    // Add RGB side borders using a gradient
    const borderWidth = 50; // width of colored sides
    document.body.style.background = `
      linear-gradient(
        to right,
        hsl(${hue}, 100%, 50%) ${borderWidth}px,
        transparent ${borderWidth}px,
        transparent calc(100% - ${borderWidth}px),
        hsl(${(hue + 180) % 360}, 100%, 50%) calc(100% - ${borderWidth}px),
        hsl(${(hue + 180) % 360}, 100%, 50%) 100%
      ),
      url(${ballImage.src})
    `;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundRepeat = "no-repeat";
  } else {
    // Reset background
    document.body.style.background = "gray";
  }
}

function loop(time) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  update(dt);
  draw();
  updateBackground();
  shakePage(); // 👈 THIS IS THE KEY

  requestAnimationFrame(loop);
}


function shakePage() {
  if (!saulsMode) {
    document.body.style.transform = "translate(0, 0)";
    return;
  }

  const x = (Math.random() - 0.5) * 30;
  const y = (Math.random() - 0.5) * 30;

  document.body.style.transform = `translate(${x}px, ${y}px)`;
}


function countSaulBalls() {
  return bodies.length; // all balls are considered Saul balls in Saul Mode
}

