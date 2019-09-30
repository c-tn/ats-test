let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

let container = document.querySelector('.container');
let camera = document.querySelector('.camera-shake');

canvas.width = 2048;
canvas.height = 1080;

const length = 500;
const angle = Math.PI / 4;
const gradient = ctx.createLinearGradient(
    canvas.width / 1.5 - length,
    canvas.height / 1.5 - length,
    Math.cos(Math.PI) * length + canvas.width / 1.5,
    Math.sin(Math.PI) * length + canvas.height / 1.5
);
gradient.addColorStop(0, '#222');
gradient.addColorStop(1, '#aaa');

let particles = [];

const triangle = {
    x1: Math.cos(-angle) * length * 3 + canvas.width / 2,
    y1: Math.sin(-angle) * length * 3 + canvas.height / 2 + length / 2,

    x2: canvas.width / 2,
    y2: canvas.height / 2 + length / 2,

    x3: Math.cos(angle) * -length * 3 + canvas.width / 2,
    y3: Math.sin(angle) * -length * 3 + canvas.height / 2 + length / 2
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateParticles();
    drawParticles();
    setShadowsParam();

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 16;

    ctx.beginPath();

    ctx.moveTo(triangle.x1, triangle.y1);

    ctx.lineTo(triangle.x2, triangle.y2);

    ctx.lineTo(triangle.x3, triangle.y3);

    ctx.closePath();
    ctx.stroke();

    requestAnimationFrame(loop);
}

function updateParticles() {
    for(let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.y -= p.velocity;
        p.alpha = p.y / (canvas.height + length / 2);

        p.isInside = checkInside(p);

        if (p.y <= 0) {
            p.y = canvas.height + length * Math.random();
            p.alpha = 1;
        }
    }
}

function checkInside({ x, y }) {
    const { x1, y1, x2, y2, x3, y3 } = triangle;

    const res1 = (x1 - x) * (y2 - y1) - (x2 - x1) * (y1 - y);
    const res2 = (x2 - x) * (y3 - y2) - (x3 - x2) * (y2 - y);
    const res3 = (x3 - x) * (y1 - y3) - (x1 - x3) * (y3 - y);

    if (res1 > 0 && res2 > 0 && res3 > 0) return true;
}

function drawParticles() {
    ctx.lineWidth = 1;
    
    for(let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        if (p.isInside) {
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
            setShadowsParam(0, 0, p.size * 2, `rgba(255, 255, 255, ${p.alpha})`);
        }
        else {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
            setShadowsParam(0, 0, p.size * 2, `rgba(255, 255, 0, 1)`);
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

        ctx.fill();
        ctx.closePath();
    }
}

function createParticles() {
    for(let i = 0; i < 500; i++) {
        particles.push({
            x: canvas.width / 2 - length + (length * 2 * Math.random()),
            y: canvas.height + length * Math.random(),
            velocity: Math.random() * 3 + 0.1,
            angle: Math.PI,
            alpha: 1,
            size: 5 * Math.random()
        });
    }
}

function setShadowsParam(offsetX, offsetY, blur, color) {
    ctx.shadowOffsetX = offsetX || 0;
    ctx.shadowOffsetY = offsetY || 0;
    ctx.shadowBlur = blur || 0;
    ctx.shadowColor = color || 'rgba(0, 0, 0, 0)';
}

createParticles();
loop();