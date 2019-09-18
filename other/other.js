let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

canvas.width = 2048;
canvas.height = 1080;

let segments = [];

const cos = Math.cos;
const sin = Math.sin;
const segmentLength = 100;
const angleOffset = 25;
const padding = 25;

function generateSegments(angle, prevSegment) {    
    prevSegment.zone.push(
        [cos(angle) - padding * sin(angle) + prevSegment.x1, sin(angle) + padding * cos(angle) + prevSegment.y1],
        [cos(angle) - padding * sin(angle) + prevSegment.x2, sin(angle) + padding * cos(angle) + prevSegment.y2],
        [cos(angle) + padding * sin(angle) + prevSegment.x2, sin(angle) - padding * cos(angle) + prevSegment.y2],
        [cos(angle) + padding * sin(angle) + prevSegment.x1, sin(angle) - padding * cos(angle) + prevSegment.y1]
    );

    segments.push(prevSegment);

    for (let i = 0; i < 10; i++) {
        angle += (angleOffset * Math.random() * Math.PI / 180) - (angleOffset * Math.random() * Math.PI / 180);

        const newSegment = {
            x1: prevSegment.x2,
            y1: prevSegment.y2,
            x2: prevSegment.x2 + Math.cos(angle) * segmentLength,
            y2: prevSegment.y2 + Math.sin(angle) * segmentLength,
            zone: []
        }

        createBuildingZone(newSegment, prevSegment, angle, padding);

        segments.push(newSegment);
        prevSegment = newSegment;
    }
}

function createBuildingZone(newSegment, prevSegment, angle, padding) {
    newSegment.zone.push(
        [cos(angle) - padding * sin(angle) + newSegment.x1, sin(angle) + padding * cos(angle) + newSegment.y1],
        [cos(angle) - padding * sin(angle) + newSegment.x2, sin(angle) + padding * cos(angle) + newSegment.y2],
        [cos(angle) + padding * sin(angle) + newSegment.x2, sin(angle) - padding * cos(angle) + newSegment.y2],
        [cos(angle) + padding * sin(angle) + newSegment.x1, sin(angle) - padding * cos(angle) + newSegment.y1]
    );

    const topPoint = checkIntersects(
        [prevSegment.zone[0][0], prevSegment.zone[0][1], prevSegment.zone[1][0], prevSegment.zone[1][1]],
        [newSegment.zone[0][0], newSegment.zone[0][1], newSegment.zone[1][0], newSegment.zone[1][1]]
    );

    const bottomPoint = checkIntersects(
        [prevSegment.zone[3][0], prevSegment.zone[3][1], prevSegment.zone[2][0], prevSegment.zone[2][1]],
        [newSegment.zone[3][0], newSegment.zone[3][1], newSegment.zone[2][0], newSegment.zone[2][1]]
    );

    prevSegment.zone[1] = [ topPoint.x, topPoint.y ];
    newSegment.zone[0] = [ topPoint.x, topPoint.y ];

    prevSegment.zone[2] = [ bottomPoint.x, bottomPoint.y ];
    newSegment.zone[3] = [ bottomPoint.x, bottomPoint.y ];
}

function checkIntersects(l1, l2) {
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

    return point;
}

function drawSegments() {
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        
        ctx.beginPath();
        ctx.moveTo(segment.x1, segment.y1);
        ctx.lineTo(segment.x2, segment.y2);

        ctx.strokeStyle = '#fff';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(segment.zone[0], segment.zone[1]);

        for (let j = 0; j < segment.zone.length; j++) {
            const zone = segment.zone[j];

            ctx.lineTo(zone[0], zone[1]);
        }

        ctx.strokeStyle = '#faf';
        ctx.closePath();
        ctx.stroke();
    }
}

function loop() {
    ctx.fillStyle = '#000';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    
    drawSegments();

    requestAnimationFrame(loop);
}

const startAngle = (360 * Math.random() * Math.PI / 180) - (360 * Math.random() * Math.PI / 180);
const startSegment = {
    x1: canvas.width / 2,
    y1: canvas.height / 2,
    x2: canvas.width / 2 + Math.cos(startAngle) * segmentLength,
    y2: canvas.height / 2 + Math.sin(startAngle) * segmentLength,
    zone: []
}

generateSegments(startAngle, startSegment);
loop();