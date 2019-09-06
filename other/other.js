let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

canvas.width = 1600;
canvas.height = 1200;

ctx.fillStyle = '#000';
ctx.fillStyle = '#fff';
ctx.strokeStyle = '#fff';

let lines = [
    {
        x1: 300, y1: 300,
        x2: 500, y2: 500
    }
]

function drawLines() {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';

    lines.forEach(line => {
        ctx.save();
            ctx.beginPath();

            ctx.moveTo(line.x1, line.y1);
            ctx.lineTo(line.x2, line.y2);

            ctx.stroke();

            lines.forEach(line2 => {
                if (line === line2) return;

                const point = checkIntersects(line, line2);

                if (
                    point.x >= Math.min(line.x1, line.x2) &&
                    point.x <= Math.max(line.x1, line.x2) &&
                    point.x >= Math.min(line2.x1, line2.x2) &&
                    point.x <= Math.max(line2.x1, line2.x2) &&
                    point.y >= Math.min(line.y1, line.y2) &&
                    point.y <= Math.max(line.y1, line.y2) &&
                    point.y >= Math.min(line2.y1, line2.y2) &&
                    point.y <= Math.max(line2.y1, line2.y2)                    
                ) {
                    ctx.fillRect(point.x - 5, point.y - 5, 10, 10);
                }
            });
        ctx.restore();
    });
}

function checkIntersects(l1, l2) {
    const x1 = l1.x1;
    const x2 = l1.x2;
    const x3 = l2.x1;
    const x4 = l2.x2;
    
    const y1 = l1.y1;
    const y2 = l1.y2;
    const y3 = l2.y1;
    const y4 = l2.y2;

    const d = (x1 - x2) * (y3 - y4) - (x3 - x4) * (y1 - y2);
    const nx = (x1*y2 - x2*y1) * (x3 - x4) - (x3*y4 - x4*y3) * (x1 - x2);
    const ny = (x1*y2 - x2*y1) * (y3 - y4) - (x3*y4 - x4*y3) * (y1 - y2);

    return {
        x: Math.round(nx / d),
        y: Math.round(ny / d)
    }
}

function loop() {
    ctx.fillStyle = '#000';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawLines();

    requestAnimationFrame(loop);
}

canvas.addEventListener('mousemove', ({ offsetX, offsetY }) => {
    const x = offsetX / window.innerWidth * canvas.width;
    const y = offsetY / window.innerHeight * canvas.height;

    lines[lines.length - 1].x2 = x;
    lines[lines.length - 1].y2 = y;
});

canvas.addEventListener('click', ({ offsetX, offsetY }) => {
    const x = offsetX / window.innerWidth * canvas.width;
    const y = offsetY / window.innerHeight * canvas.height;

    lines.push({
        x1: x,
        y1: y,
        x2: x,
        y2: y
    });
});

loop();