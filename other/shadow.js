let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

canvas.width = 2048;
canvas.height = 1080;

const { cos, sin } = Math;

let camera = {
    x: 0,
    y: 0,
}

let sun = {
    angle: Math.PI,
    x: 0,
    y: 0,
    r: 500,
    s: 0.01
}

let figures = [
    {
        x1: canvas.width / 2 - 100,
        y1: canvas.height / 2,
        x2: canvas.width / 2 + 100,
        y2: canvas.height / 2
    }, {
        x1: canvas.width / 2 + 100,
        y1: canvas.height / 2,
        x2: canvas.width / 2 + 100,
        y2: canvas.height / 2 - 100
    }, {
        x1: canvas.width / 2 + 100,
        y1: canvas.height / 2 - 100,
        x2: canvas.width / 2 - 100,
        y2: canvas.height / 2 - 100
    }, {
        x1: canvas.width / 2 - 100,
        y1: canvas.height / 2 - 100,
        x2: canvas.width / 2 - 100,
        y2: canvas.height / 2
    }
]

function loop() {
    ctx.lineWidth = 4;
    ctx.fillStyle = '#fff';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff0';
    ctx.strokeStyle = '#fff';

    ctx.beginPath();
    ctx.arc(
        sun.x,
        sun.y,
        20,
        0,
        Math.PI * 2
    );
    ctx.fill();

    sun.angle += sun.s;
    sun.x = cos(sun.angle) * sun.r + canvas.width / 2;
    sun.y = sin(sun.angle) * sun.r + canvas.height / 2;

    drawBuild();

    requestAnimationFrame(loop);
}

function drawBuild() {
    ctx.lineWidth = 1;

    const f = figures[0];

    const a = Math.atan2(f.y1 - camera.y, f.x1 - camera.x) + Math.PI;
    const o = Math.sqrt((f.x1 - camera.x)**2 + (f.y1 - camera.y)**2) / 50;

    figures.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);

        const so = Math.sqrt((canvas.width / 2 - sun.x)**2 + (canvas.height / 2 - sun.y)**2) / sun.r * 50;
        const sa = Math.atan2(canvas.height / 2 - sun.y, canvas.width / 2 - sun.x);

        ctx.lineTo(
            line.x1 - cos(sa - Math.PI),
            line.y1 - sin(sa - Math.PI)
        );
        ctx.lineTo(
            line.x2 - cos(sa - Math.PI),
            line.y2 - sin(sa - Math.PI)
        );
        ctx.lineTo(
            line.x2 - cos(sa - Math.PI) * so,
            line.y2 - sin(sa - Math.PI) * so
        );
        ctx.lineTo(
            line.x1 - cos(sa - Math.PI) * so,
            line.y1 - sin(sa - Math.PI) * so
        );

        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 0, .1)';
        ctx.fill();
    });

    figures.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(
            line.x1 - cos(a),
            line.y1 - sin(a)
        );
        ctx.lineTo(
            line.x2 - cos(a),
            line.y2 - sin(a)
        );
        ctx.lineTo(
            line.x2 - cos(a) * o,
            line.y2 - sin(a) * o
        );
        ctx.lineTo(
            line.x1 - cos(a) * o,
            line.y1 - sin(a) * o
        );

        ctx.fillStyle = '#555';
        ctx.strokeStyle = '#555';
        ctx.fill();
        ctx.stroke();
    });

    ctx.moveTo(
        f.x1 - cos(a) * o,
        f.y1 - sin(a) * o
    );
    ctx.beginPath();

    figures.forEach(line => {
        ctx.lineTo(
            line.x2 - cos(a) * o,
            line.y2 - sin(a) * o
        );
    });

    ctx.closePath();

    ctx.fillStyle = '#888';
    ctx.strokeStyle = '#888';
    ctx.fill();
    ctx.stroke();
}

canvas.addEventListener('mousemove', ({ offsetX, offsetY }) => {
    const x = offsetX / window.innerWidth * canvas.width;
    const y = offsetY / window.innerHeight * canvas.height;

    camera.x = x;
    camera.y = y;
});

canvas.addEventListener('click', () => {
    sun.s = sun.s === 0
        ? 0.01
        : 0;
});

ctx.font = '20px Arial';
loop();