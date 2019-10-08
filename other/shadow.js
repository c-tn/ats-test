let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

canvas.width = 2048;
canvas.height = 1080;

const { cos, sin } = Math;

let sun = {
    x: 0,
    y: 0,
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
    ctx.fillStyle = '#000';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';

    drawBuild();

    requestAnimationFrame(loop);
}

function drawBuild() {
    ctx.lineWidth = 1;

    const f = figures[0];

    const a = Math.atan2(f.y1 - sun.y, f.x1 - sun.x) + Math.PI;
    const o = Math.sqrt((f.x1 - sun.x)**2 + (f.y1 - sun.y)**2) / 50;

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
        ctx.strokeStyle = '#444';
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

    sun.x = x;
    sun.y = y;
});

ctx.font = '20px Arial';
loop();