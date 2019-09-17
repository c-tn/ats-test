let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

canvas.width = 2048;
canvas.height = 1080;

function loop() {
    ctx.fillStyle = '#000';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';

    qt.draw();

    for (let line of lines) {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
        ctx.closePath();
    }

    for (let line of city.roads) {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
        ctx.closePath();
    }
    
    ctx.strokeStyle = '#f00';
    ctx.fillStyle = '#f00';
    ctx.strokeRect(cursorRect.x, cursorRect.y, cursorRect.w, cursorRect.h);

    for (let p of selectedPoints) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
    requestAnimationFrame(loop);
}

function random(value) {
    return ~~(Math.random() * value);
}

function createPoint(x, y) {
    return { x, y }
}

function createRect(x, y, w, h) {
    return { x, y, w, h }
}

function createLine(p1, p2) {
    return {
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y
    }
}

function checkPointInBoundary(boundary, point) {
    return (
        point.x > boundary.x &&
        point.x < boundary.x + boundary.w &&
        point.y > boundary.y &&
        point.y < boundary.y + boundary.h
    );
}

function checkBoundariesIntersects(b1, b2) {
    return (
        b1.x > b2.x ||
        b1.x + b1.w < b2.x + b2.w ||
        b1.y > b2.y ||
        b1.y + b1.h < b2.y + b2.h
    );
}

class QuadTree {
    constructor(boundary, n) {
        this.boundary = boundary;
        this.capacity = n;
        this.points = [];
        this.isDivided = false;
    }

    subdivide() {
        const x = this.boundary.x;
        const y = this.boundary.y;
        const w = this.boundary.w / 2;
        const h = this.boundary.h / 2;

        const tl = createRect(x, y, w, h);
        this.topLeft = new QuadTree(tl, this.capacity);

        const tr = createRect(x + w, y, w, h);
        this.topRight = new QuadTree(tr, this.capacity);

        const bl = createRect(x, y + h, w, h);
        this.bottomLeft = new QuadTree(bl, this.capacity);

        const br = createRect(x + w, y + h, w, h);
        this.bottomRight = new QuadTree(br, this.capacity);

        this.isDivided = true;
    }

    query(range, arr = []) {
        if (!checkBoundariesIntersects(range, this.boundary)) {
            return arr;
        }
        else {
            for (let p of this.points) {
                if (checkPointInBoundary(range, p)) {
                    arr.push(p);
                }
            }

            if (this.isDivided) {
                this.topLeft.query(range, arr);
                this.topRight.query(range, arr);
                this.bottomLeft.query(range, arr);
                this.bottomRight.query(range, arr);
            }
            
            return arr;
        }
    }

    insert(point) {
        if (!checkPointInBoundary(this.boundary, point)) {
            return;
        }

        if (this.points.length < this.capacity) {
            this.points.push(point);
        }
        else {
            if (!this.isDivided) {
                this.subdivide();
            }

            this.topLeft.insert(point);
            this.topRight.insert(point);
            this.bottomLeft.insert(point);
            this.bottomRight.insert(point);
        }
    }

    draw() {
        ctx.beginPath();
        ctx.strokeStyle = '#fff';
        ctx.fillStyle = '#fff';

        ctx.rect(
            this.boundary.x,
            this.boundary.y,
            this.boundary.w,
            this.boundary.h
        );

        ctx.stroke();
        ctx.closePath();

        if (this.isDivided) {
            this.topLeft.draw();
            this.topRight.draw();
            this.bottomLeft.draw();
            this.bottomRight.draw();
        }

        for (let p of this.points) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
    }
}

function findNearestPoint(currentPoint) {
    let nearestPoint;
    let minDist = Infinity;

    for (let point of selectedPoints) {
        const d = Math.sqrt((currentPoint.x - point.x)**2 + (currentPoint.y - point.y));

        if (d < minDist) {
            minDist = d;
            nearestPoint = point;
        }
    }

    return nearestPoint;
}

const bWidth = canvas.width;
const bHeight = canvas.height;

let boundary = createRect(0, 0, bWidth, bHeight);
let qt = new QuadTree(boundary, 500);

let cursorRect = createRect(0, 0, 0, 0);
let selectedPoints = [];
let lines = [];
let isCreateLine = false;

const rectWidth = 15;
const rectHeight = 15;

const city = {
    angleOffset: 25,
    angle: (25 * Math.random() * Math.PI / 180) - (25 * 2 * Math.random() * Math.PI / 180),
    segmentLength: rectWidth + rectWidth / 10,
    roads: [],
}

canvas.addEventListener('mousemove', ({ offsetX, offsetY }) => {
    const x = offsetX / window.innerWidth * canvas.width;
    const y = offsetY / window.innerHeight * canvas.height;
    
    cursorRect = createRect(
        x - rectWidth / 2,
        y - rectHeight / 2,
        rectWidth,
        rectHeight
    );

    selectedPoints = qt.query(cursorRect);
});

canvas.addEventListener('mousedown', ({ offsetX, offsetY }) => {
    console.log(selectedPoints);
    // const x = offsetX / window.innerWidth * canvas.width;
    // const y = offsetY / window.innerHeight * canvas.height;

    // let p1 = createPoint(x, y);
    // let p2 = createPoint(x, y);

    // const nearestPoint = findNearestPoint(p1);

    // if (nearestPoint) {
    //     p1 = createPoint(nearestPoint.x, nearestPoint.y);
    //     p2 = createPoint(nearestPoint.x, nearestPoint.y);
    // }

    // const newLine = createLine(p1, p2);

    // isCreateLine = true;

    // lines.push(newLine);
});

canvas.addEventListener('mouseup', () => {
    // isCreateLine = false;
    
    // const lastLine = lines[lines.length - 1];

    // const p1 = createPoint(lastLine.x1, lastLine.y1);
    // const p2 = createPoint(lastLine.x2, lastLine.y2);

    // if (p1.x === p2.x || p1.y === p2.y) {
    //     lines.splice(-1);
    // }

    // qt.insert(p1);
    // qt.insert(p2);
});

canvas.addEventListener('mousemove', ({ offsetX, offsetY }) => {
    // if (!isCreateLine) return;

    // let x = offsetX / window.innerWidth * canvas.width;
    // let y = offsetY / window.innerHeight * canvas.height;

    // const lastLine = lines[lines.length - 1];

    // const nearestPoint = findNearestPoint(createPoint(x, y));

    // if (nearestPoint) {
    //     x = nearestPoint.x;
    //     y = nearestPoint.y;
    // }

    // lastLine.x2 = x;
    // lastLine.y2 = y;
});





function generateRoads(city, lvl = 0, angle, lastSegment, maxSegments = 20, currentSegmentsCount = 0) {
    if (!lastSegment) {
        lastSegment = {
            x1: canvas.width / 2,
            y1: canvas.height / 2,
            x2: canvas.width / 2 + Math.cos(angle) * city.segmentLength,
            y2: canvas.height / 2 + Math.sin(angle) * city.segmentLength,
            angle
        }

        city.roads.push(lastSegment);
    }

    angle += (city.angleOffset * Math.random() * Math.PI / 180) - (city.angleOffset * Math.random() * Math.PI / 180);

    let newSegment = {
        x1: lastSegment.x2,
        y1: lastSegment.y2,
        x2: lastSegment.x2 + Math.cos(angle) * city.segmentLength,
        y2: lastSegment.y2 + Math.sin(angle) * city.segmentLength,
        angle
    };

    const interData = checkIntersects(newSegment, city.roads);

    if (interData) {
        newSegment.x2 = interData.x;
        newSegment.y2 = interData.y;
    }

    const selectRect = createRect(newSegment.x2, newSegment.y2, 10, 10);
    selectedPoints = qt.query(selectRect);

    const nearestPoint = findNearestPoint(createPoint(newSegment.x2, newSegment.y2));

    if (nearestPoint) {
        newSegment.x2 = nearestPoint.x;
        newSegment.y2 = nearestPoint.y;
    }

    if (currentSegmentsCount > 10 && !interData && Math.random() > 0.7 && lvl < 2) {
        let direction = Math.random() > 0.5
            ? 1
            : -1;

        generateRoads(city, lvl + 1, angle + 90 * Math.PI / 180 * direction, lastSegment, maxSegments, 0);
    }

    city.roads.push(newSegment);
    qt.insert(createPoint(newSegment.x1, newSegment.y1));
    qt.insert(createPoint(newSegment.x2, newSegment.y2));

    if (lvl <= 2 && currentSegmentsCount < maxSegments && !interData) {
        generateRoads(city, lvl, angle, newSegment, maxSegments, currentSegmentsCount + 1);
    }
}

function checkIntersects(newSegment, data) {
    for (let i = 0; i < data.length; i++) {
        const segment = data[i];

        if (
            newSegment === segment ||
            newSegment.x2 === segment.x1 ||
            newSegment.x1 === segment.x2
        ) break;

        const x1 = newSegment.x1;
        const x2 = newSegment.x2;
        const x3 = segment.x1;
        const x4 = segment.x2;
        
        const y1 = newSegment.y1;
        const y2 = newSegment.y2;
        const y3 = segment.y1;
        const y4 = segment.y2;

        const m12 = (y2 - y1) / (x2 - x1);
        const m34 = (y4 - y3) / (x4 - x3);
        const m = m34 / m12;
        const x = (x1 - y1 / m12 - m * x3 + y3 / m12) / (1 - m);
        const y = m12 * (x - x1) + y1;

        const point = { x, y };

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
            const d1 = Math.sqrt(Math.pow(x2 - x3, 2) + Math.pow(y2 - y1, 2));
            const d2 = Math.sqrt(Math.pow(x2 - x4, 2) + Math.pow(y2 - y2, 2));
    
            if (d1 > d2) {
                return {
                    x: x3,
                    y: y3,
                    point,
                    segment
                }
            }
            else {
                return {
                    x: x4,
                    y: y4,
                    point,
                    segment
                }
            }
        }
    }
}

generateRoads(city, 0, city.angle);

loop();

