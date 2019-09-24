let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

canvas.width = 2048;
canvas.height = 1080;

const fields = 6;
const qTreeCenterX = canvas.width * fields / 2;
const qTreeCenterY = canvas.height * fields / 2;
const seedValue = Math.random().toString(36).substr(2);
console.log(seedValue);

let cameraData = {
    isMoving: false,
    startX: 0,
    startY: 0,
    offsetX: -canvas.width / 2,
    offsetY: -canvas.height / 2,
    x: -canvas.width / 2,
    y: -canvas.height / 2
}
let globalRect = createRect(-qTreeCenterX, -qTreeCenterY, canvas.width * fields, canvas.height * fields);
let qtree = new QuadTree(globalRect, 4);
let seed = new RNG('yiauwbfk3oe' || seedValue);
let segments = [];
let debugRects = [];

const cos = Math.cos;
const sin = Math.sin;
const segmentLength = 50;
const angleOffset = 25;
const padding = 20;
const maxLevels = 2;

function generateSegments({ prevSegment, angle, counter = 0, maxSegments = 50, lvl = 0 }) {
    const lastPoint = createPoint(prevSegment.coords[0], prevSegment.coords[1], prevSegment);

    qtree.insert(lastPoint);

    angle += angleOffset * seed.unit() * Math.PI / 180 - angleOffset * seed.unit() * Math.PI / 180;

    let nextSegment = {
        coords: [
            prevSegment.coords[2],
            prevSegment.coords[3],
            prevSegment.coords[2] + cos(angle) * segmentLength,
            prevSegment.coords[3] + sin(angle) * segmentLength
        ],
        padding: []
    }

    createPadding(nextSegment, angle);
    connectPaddings(prevSegment, nextSegment);

    segments.push(nextSegment);

    if (seed.unit() > 0.95 && lvl < maxLevels && !prevSegment.cross) {
        splitSegment({
            prevSegment: nextSegment,
            angle: angle + Math.PI / 2,
            counter: 0,
            maxSegments: maxSegments / 2,
            lvl: lvl + 1
        });
    }

    if (counter < maxSegments) {
        generateSegments({
            prevSegment: nextSegment,
            angle,
            counter: ++counter,
            maxSegments,
            lvl
        });
    }
}

function splitSegment(data) {
    const coords = data.prevSegment.coords;

    let splitedSegment = {
        coords: [
            coords[0],
            coords[1],
            coords[0] + cos(data.angle) * segmentLength,
            coords[1] + sin(data.angle) * segmentLength
        ],
        padding: []
    }

    createPadding(splitedSegment, data.angle);

    segments.push(splitedSegment);

    generateSegments({ ...data, prevSegment: splitedSegment });
}

function createPadding(segment, angle) {
    if (segment.padding.length) return;

    const coords = segment.coords;

    segment.padding = [
        [ cos(angle) - padding * sin(angle) + coords[0], sin(angle) + padding * cos(angle) + coords[1] ],
        [ cos(angle) - padding * sin(angle) + coords[2], sin(angle) + padding * cos(angle) + coords[3] ],
        [ cos(angle) + padding * sin(angle) + coords[2], sin(angle) - padding * cos(angle) + coords[3] ],
        [ cos(angle) + padding * sin(angle) + coords[0], sin(angle) - padding * cos(angle) + coords[1] ]
    ];
}

function connectPaddings(prevSegment, nextSegment) {
    const prevPaddings = prevSegment.padding;
    const nextPaddings = nextSegment.padding;

    for (let i = 0; i < 3; i += 2) {
        const prevLine = [ prevPaddings[i][0], prevPaddings[i][1], prevPaddings[i + 1][0], prevPaddings[i + 1][1] ];
        const nextLine = [ nextPaddings[i][0], nextPaddings[i][1], nextPaddings[i + 1][0], nextPaddings[i + 1][1] ];

        const interData = checkIntersects(prevLine, nextLine);

        if (i === 0) {
            prevPaddings[i + 1] = [ interData.x, interData.y ];
            nextPaddings[i + 0] = [ interData.x, interData.y ];
        }
        else {
            prevPaddings[i + 0] = [ interData.x, interData.y ];
            nextPaddings[i + 1] = [ interData.x, interData.y ];
        }
    }
}

function checkIntersects(l1, l2, isLineIntersects) {
    const x1 = l1[0];
    const x2 = l1[2];
    const x3 = l2[0];
    const x4 = l2[2];
    
    const y1 = l1[1];
    const y2 = l1[3];
    const y3 = l2[1];
    const y4 = l2[3];

    const m12 = (y2 - y1) / (x2 - x1);
    const m34 = (y4 - y3) / (x4 - x3);
    const m = m34 / m12;
    const x = (x1 - y1 / m12 - m * x3 + y3 / m12) / (1 - m);
    const y = m12 * (x - x1) + y1;

    const point = { x, y };

    if (isLineIntersects) {
        if (
            point.x >= Math.min(x1, x2) &&
            point.x <= Math.max(x1, x2) &&
            point.x >= Math.min(x3, x4) &&
            point.x <= Math.max(x3, x4) &&
            point.y >= Math.min(y1, y2) &&
            point.y <= Math.max(y1, y2) &&
            point.y >= Math.min(y1, y2) &&
            point.y <= Math.max(y1, y2)
        ) {
            return point;
        }
    }
    else {
        return point;
    }
}

function loop() {
    ctx.fillStyle = '#000';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';

    qtree.draw();
    drawSegments();

    requestAnimationFrame(loop);
}

function drawSegments() {
    for (let i = 0; i < segments.length; i++) {
        const coords = segments[i].coords;
        const paddings = segments[i].padding;

        if (!paddings[0]) break;

        ctx.beginPath();
        ctx.moveTo(coords[0] - cameraData.x, coords[1] - cameraData.y);
        ctx.lineTo(coords[2] - cameraData.x, coords[3] - cameraData.y);
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(coords[0] - cameraData.x, coords[1] - cameraData.y, segmentLength, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(paddings[0][0] - cameraData.x, paddings[0][1] - cameraData.y);
        
        for (let i = 1; i < paddings.length; i++) {
            ctx.lineTo(paddings[i][0] - cameraData.x, paddings[i][1] - cameraData.y);
        }

        ctx.closePath();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
    }

    ctx.strokeStyle = '#f00';
    debugRects.forEach(d => {
        ctx.strokeRect(d.x - cameraData.x, d.y - cameraData.y, d.w, d.h);
    });
}

const startAngle = Math.PI * 2 * seed.unit();
const startSegment = {
    coords: [
        0,
        0,
        cos(startAngle) * segmentLength + 0,
        sin(startAngle) * segmentLength + 0
    ],
    padding: []
}

createPadding(startSegment, startAngle);
segments.push(startSegment);
generateSegments({
    prevSegment: startSegment,
    angle: startAngle
});

loop();

canvas.addEventListener('mousedown', ({ offsetX, offsetY }) => {
    const x = offsetX / window.innerWidth * canvas.width;
    const y = offsetY / window.innerHeight * canvas.height;

    cameraData.isMoving = true;
    cameraData.startX = x + cameraData.offsetX;
    cameraData.startY = y + cameraData.offsetY;
});

canvas.addEventListener('mouseup', () => {
    cameraData.isMoving = false;
});

canvas.addEventListener('mousemove', ({ offsetX, offsetY }) => {
    if (!cameraData.isMoving) return;

    const x = offsetX / window.innerWidth * canvas.width;
    const y = offsetY / window.innerHeight * canvas.height;

    cameraData.offsetX = cameraData.startX - x;
    cameraData.offsetY = cameraData.startY - y;

    cameraData.x = cameraData.offsetX;
    cameraData.y = cameraData.offsetY;
});