let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

canvas.width = 2048;
canvas.height = 1080;

let sun = {
    x: -50000,
    y: -50000,
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

    drawRayCasts();

    ctx.beginPath();
    ctx.arc(sun.x, sun.y, 10, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    figures.forEach(line => {
        ctx.beginPath();

        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);

        ctx.stroke();

        ctx.closePath();
    });

    requestAnimationFrame(loop);
}

function drawRayCasts() {
    ctx.lineWidth = 1;

    let nearest = Infinity;
    let shadowAngle = 0;

    figures.forEach(line => {
        const dist = Math.sqrt((sun.x - line.x1)**2 + (sun.y - line.y1)**2) / canvas.width * 200;
        shadowAngle = Math.atan2(line.y1 - sun.y, line.x1 - sun.x) + Math.PI;

        if (dist < nearest) {
            nearest = dist;
        }
    });

    const shadowLength = nearest / 500 * 200;

    figures.forEach(line => {
        ctx.fillStyle = 'rgba(255, 255, 255, .3)';
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(
            Math.cos(shadowAngle - Math.PI) * shadowLength + line.x1,
            Math.sin(shadowAngle - Math.PI) * shadowLength + line.y1
        );
        ctx.lineTo(
            Math.cos(shadowAngle - Math.PI) * shadowLength + line.x2,
            Math.sin(shadowAngle - Math.PI) * shadowLength + line.y2
        );
        ctx.lineTo(line.x2, line.y2);

        ctx.closePath();
        ctx.fill();
    });
}

canvas.addEventListener('mousemove', ({ offsetX, offsetY }) => {
    const x = offsetX / window.innerWidth * canvas.width;
    const y = offsetY / window.innerHeight * canvas.height;

    sun.x = x;
    sun.y = y;
});

ctx.font = '20px Arial';
loop();