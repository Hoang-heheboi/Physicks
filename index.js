let collisionsEnabled = true; // true = balls collide, false = ignore collisions





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
  draw();

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



function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let body of bodies) {
    ctx.beginPath();
    ctx.arc(body.position.x, body.position.y, body.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
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

// Reset button
resetBtn.addEventListener("click", () => {
  bodies.length = 0; // remove all balls
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



