let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

canvas.width = 2048;
canvas.height = 1080;

const fields = 6;
const qTreeCenterX = canvas.width * fields / 2;
const qTreeCenterY = canvas.height * fields / 2;
const seedValue = Math.random().toString(36).substr(2);
console.log(seedValue);

/**
 * TODO
 * cross controll
 * extrime angle controll
 * x2 and y2 intersects check
 * 
 * Bugs seed
 * dtkr6objfll - extra angle
 * qf487ahug1h - extra angle
 * 
 * 7c6htacsbho - problem with split
 * 
 * goxemy4mo94 - no intersects in x2 and y2
 */

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
let seed = new RNG('' || seedValue);
let segments = [];
let isDebug = true;
let debugRects = [];
let debugPoints = [];

const cos = Math.cos;
const sin = Math.sin;
const segmentLength = 50;
const angleOffset = 25;
const padding = 20;
const maxLevels = 3;
const initCrossCounter = 6;

function generateSegments({ prevSegment, angle, counter = 0, maxSegments = 50, lvl = 0, crossCounter = initCrossCounter }) {
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

    const selectCircle = createCircle(nextSegment.coords[0], nextSegment.coords[1], segmentLength * 0.9);
    const crossCircle = createCircle(nextSegment.coords[0], nextSegment.coords[1], segmentLength * 1.9);
    const selectedPoints = qtree.query(selectCircle);
    const crossPoints = qtree.query(crossCircle);

    if (selectedPoints.length) {
        if (!prevSegment.prevSegment) return;
        
        isDebug && debugPoints.push(...selectedPoints);
        prevSegment.coords[2] = selectedPoints[0].x;
        prevSegment.coords[3] = selectedPoints[0].y;

        prevSegment.padding = [];

        const newAngle = Math.atan2(prevSegment.coords[1] - selectedPoints[0].y, prevSegment.coords[0] - selectedPoints[0].x) + Math.PI;

        createPadding(prevSegment, newAngle);
        connectPaddings(prevSegment.prevSegment, prevSegment);

        const mainPaddings = prevSegment.padding;
        const nextPaddings = selectedPoints[0].data.padding;
        const prevPaddings = selectedPoints[0].data.prevSegment
            ? selectedPoints[0].data.prevSegment.padding
            : selectedPoints[0].data.padding;

        const interData = cutPaddings(mainPaddings, prevPaddings, nextPaddings);

        mainPaddings[1] = [ interData.firstIntersect.x, interData.firstIntersect.y ];
        mainPaddings[2] = [ interData.secondInterset.x, interData.secondInterset.y ];

        return;
    }

    createPadding(nextSegment, angle);
    connectPaddings(prevSegment, nextSegment);
    nextSegment.prevSegment = prevSegment;

    segments.push(nextSegment);

    if (seed.unit() > 0.9 && lvl < maxLevels && counter > 0 && crossCounter < 0 && crossPoints.length < 2) {
        const direction = seed.unit() > 0.5 ? 1 : -1;

        crossCounter = initCrossCounter;

        prevSegment.cross = nextSegment;

        splitSegment({
            prevSegment: nextSegment,
            angle: angle + Math.PI / 2 * direction,
            counter: 0,
            maxSegments: maxSegments / 2,
            lvl: lvl + 1,
            direction,
            crossCounter: initCrossCounter
        });
    }

    if (counter < maxSegments) {
        generateSegments({
            prevSegment: nextSegment,
            angle,
            counter: counter + 1,
            maxSegments,
            lvl,
            crossCounter: crossCounter - 1
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

    const splitedPaddings = splitedSegment.padding;
    const nextPaddings = data.prevSegment.prevSegment.padding;
    const prevPaddings = data.prevSegment.padding;

    const interData = cutPaddings(splitedPaddings, nextPaddings, prevPaddings, true, data.direction);

    splitedSegment.padding[0] = [ interData.firstIntersect.x, interData.firstIntersect.y ];
    splitedSegment.padding[3] = [ interData.secondInterset.x, interData.secondInterset.y ];

    segments.push(splitedSegment);

    generateSegments({ ...data, prevSegment: splitedSegment });
}

function cutPaddings(mainPaddings, nextPaddings, prevPaddings, isCutByDirection, direction) {
    const bottomLine = [ mainPaddings[0][0], mainPaddings[0][1], mainPaddings[1][0], mainPaddings[1][1] ];
    const topLine = [ mainPaddings[2][0], mainPaddings[2][1], mainPaddings[3][0], mainPaddings[3][1] ];
    
    let firstIntersect = null;
    let secondInterset = null;

    if (isCutByDirection) {
        const rightLine = direction === 1
            ? [ nextPaddings[0][0], nextPaddings[0][1], nextPaddings[1][0], nextPaddings[1][1] ]
            : [ nextPaddings[2][0], nextPaddings[2][1], nextPaddings[3][0], nextPaddings[3][1] ];
            
        const leftLine = direction === 1
            ? [ prevPaddings[0][0], prevPaddings[0][1], prevPaddings[1][0], prevPaddings[1][1] ]
            : [ prevPaddings[2][0], prevPaddings[2][1], prevPaddings[3][0], prevPaddings[3][1] ];

        firstIntersect = checkIntersects(bottomLine, rightLine);
        secondInterset = checkIntersects(topLine, leftLine);
    }
    else {
        for (let i = 0; i < 3; i += 2) {
            const l1 = [ nextPaddings[i][0], nextPaddings[i][1], nextPaddings[i + 1][0], nextPaddings[i + 1][1] ];
            const l2 = [ prevPaddings[i][0], prevPaddings[i][1], prevPaddings[i + 1][0], prevPaddings[i + 1][1] ];
    
            const bottomInterData = checkIntersects(bottomLine, l2);
            const topInterData = checkIntersects(topLine, l1);
    
            if (i === 0) {
                firstIntersect = bottomInterData;
                secondInterset = topInterData;
            }
            else {
                const x1 = mainPaddings[0][0];
                const y1 = mainPaddings[0][1];
    
                const d1 = Math.sqrt((x1 - firstIntersect.x)**2 + (y1 - firstIntersect.y)**2);
                const d2 = Math.sqrt((x1 - bottomInterData.x)**2 + (y1 - bottomInterData.y)**2);

                if (d2 < d1) {
                    firstIntersect = bottomInterData;
                    secondInterset = topInterData;
                }
            }
        }
    }

    return {
        firstIntersect,
        secondInterset
    }
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
        isDebug && ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(paddings[0][0] - cameraData.x, paddings[0][1] - cameraData.y);
        
        for (let i = 1; i < paddings.length; i++) {
            ctx.lineTo(paddings[i][0] - cameraData.x, paddings[i][1] - cameraData.y);
        }

        ctx.closePath();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        !isDebug && ctx.fill();
    }

    // Debug stuff
    ctx.fillStyle = '#f00';
    debugPoints.forEach(d => {
        ctx.fillRect(d.x - cameraData.x - 2.5, d.y - cameraData.y - 2.5, 5, 5);
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