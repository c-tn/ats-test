let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

canvas.width = 2048;
canvas.height = 1080;

ctx.fillStyle = '#fff';
ctx.strokeStyle = '#fff';

let offset = {
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
    isClick: false
}

let lines = [];
ctx.font = "25px sans-serif";

function drawLines() {
    ctx.fillStyle = '#f00';
    ctx.strokeStyle = '#fff';

    lines.forEach(line => {
        ctx.beginPath();

        ctx.moveTo(line.x1 - offset.x, line.y1 - offset.y);
        ctx.lineTo(line.x2 - offset.x, line.y2 - offset.y);

        ctx.stroke();
    });
}

function loop() {
    if (offset.isClick) {
        offset.x -= window.innerWidth / 50 - offset.offsetX / 25;
        offset.y -= window.innerHeight / 50 - offset.offsetY / 25;
    }

    ctx.fillStyle = '#000';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawLines(lines);

    requestAnimationFrame(loop);
}

const angleOffset = 25;
let angle = (angleOffset * Math.random() * Math.PI / 180) - (angleOffset * 2 * Math.random() * Math.PI / 180);

const maxAngle = 360 * Math.PI / 180;
let length = 50;

function generateRoads(lvl = 0, angle, lastLine, count = 20, currentCount = 0, isNew) {
    if (!lastLine) {
        lastLine = {
            x1: 100,
            y1: canvas.height / 2,
            x2: 100 + Math.cos(angle) * length,
            y2: canvas.height / 2 + Math.sin(angle) * length
        }

        lines.push(lastLine);
    }

    angle += (angleOffset * Math.random() * Math.PI / 180) - (angleOffset * Math.random() * Math.PI / 180);

    if (angle > 0 + maxAngle) {
        angle = maxAngle;
    }
    if (angle < 0 - maxAngle) {
        angle = 0 - maxAngle;
    }

    let newLine = {
        x1: lastLine.x2,
        y1: lastLine.y2,
        x2: lastLine.x2 + Math.cos(angle) * length,
        y2: lastLine.y2 + Math.sin(angle) * length
    };

    check(newLine);

    newLine.build = Math.random() > 0.7 && !newLine.inter;

    if (!isNew && !newLine.inter && Math.random() > 0.8 && lvl < 2) {
        let direction = Math.random() > 0.5
            ? 1
            : -1;

        generateRoads(lvl + 1, angle + 90 * Math.PI / 180 * direction, lastLine, count, 5, true);
    }

    lines.push(newLine);

    if (lvl <= 3 && currentCount < count && !newLine.inter) {
        generateRoads(lvl, angle, newLine, count, currentCount + 1);
    }
}

generateRoads(0, angle);

function check(line) {
    lines.forEach(line2 => {
        if (
            line === line2 ||
            line.x2 === line2.x1 ||
            line.y2 === line2.y1 ||
            line.x1 === line2.x2 ||
            line.y1 === line2.y2
        ) return;

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
            line.x2 = point.x;
            line.y2 = point.y;
            line.inter = point;
        }
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

    let m12 = (y2 - y1) / (x2 - x1);
    let m34 = (y4 - y3) / (x4 - x3);
    let m = m34 / m12;
    let x = (x1 - y1 / m12 - m * x3 + y3 / m12) / (1 - m);
    let y = m12 * (x - x1) + y1;

    return { x, y }
}

canvas.addEventListener('mousedown', ({ offsetX, offsetY }) => {
    offset.isClick = true;

    offset.offsetX = offsetX;
    offset.offsetY = offsetY;
});

canvas.addEventListener('mouseup', () => {
    offset.isClick = false;
});

canvas.addEventListener('mousemove', ({ offsetX, offsetY }) => {
    if (!offset.isClick) return;

    offset.offsetX = offsetX;
    offset.offsetY = offsetY;
});

canvas.addEventListener('wheel', () => {
    generateRoads(0, angle, lines[lines.length - 1]);
});

loop();