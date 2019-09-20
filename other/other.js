let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

canvas.width = 2048;
canvas.height = 1080;

let segments = [];

const cos = Math.cos;
const sin = Math.sin;
const segmentLength = 40;
const angleOffset = 25;
const padding = 10;

function generateSegments(angle, prevSegment, count) {
    createOffset(prevSegment, angle);

    segments.push(prevSegment);

    for (let i = 0; i < count; i++) {
        angle += (angleOffset * Math.random() * Math.PI / 180) - (angleOffset * Math.random() * Math.PI / 180);

        const newSegment = {
            x1: prevSegment.x2,
            y1: prevSegment.y2,
            x2: prevSegment.x2 + Math.cos(angle) * segmentLength,
            y2: prevSegment.y2 + Math.sin(angle) * segmentLength,
            prevSegment,
            zone: [],
            offset: []
        }

        prevSegment.nextSegment = newSegment;

        for (let j = 0; j < segments.length; j++) {
            const segment = segments[j];

            if (newSegment.prevSegment === segment || newSegment.isEnd) continue;

            const interData = checkIntersects(
                [ newSegment.x1, newSegment.y1, newSegment.x2, newSegment.y2 ],
                [ segment.x1, segment.y1, segment.x2, segment.y2 ],
                true
            );

            if (interData) {
                newSegment.x2 = interData.point.x;
                newSegment.y2 = interData.point.y;
                newSegment.isEnd = true;
            }
        }


        createOffset(newSegment, angle);
        linkOffset(newSegment, prevSegment, angle, padding);

        segments.push(newSegment);
        prevSegment = newSegment;

        if (newSegment.isEnd) {
            delete newSegment.isEnd;
            break;
        }
    }
}

function splitSegment(prevSegment, nextSegment) {
    const direction = Math.random() > 0.5 ? 1 : -1;
    const angle = Math.atan2(prevSegment.y2 - prevSegment.y1, prevSegment.x2 - prevSegment.x1) + Math.PI + Math.PI / 2 * direction;

    let splitSegment = {
        x1: prevSegment.x2,
        y1: prevSegment.y2,
        x2: prevSegment.x2 + Math.cos(angle) * segmentLength,
        y2: prevSegment.y2 + Math.sin(angle) * segmentLength,
        cross: [prevSegment, nextSegment],
        zone: [],
        offset: []
    }

    createOffset(splitSegment, angle);

    if (direction === 1) {
        const leftTopIntersect = checkIntersects(
            [prevSegment.offset[3][0], prevSegment.offset[3][1], prevSegment.offset[2][0], prevSegment.offset[2][1]],
            [splitSegment.offset[3][0], splitSegment.offset[3][1], splitSegment.offset[2][0], splitSegment.offset[2][1]]
        );
    
        const rightTopIntersect = checkIntersects(
            [nextSegment.offset[3][0], nextSegment.offset[3][1], nextSegment.offset[2][0], nextSegment.offset[2][1]],
            [splitSegment.offset[0][0], splitSegment.offset[0][1], splitSegment.offset[1][0], splitSegment.offset[1][1]]
        );
    
        prevSegment.offset[2] = [ leftTopIntersect.x, leftTopIntersect.y ];
        splitSegment.offset[3] = [ leftTopIntersect.x, leftTopIntersect.y ];
    
        let so = prevSegment.offset;
        prevSegment.offset = [so[0], so[1], [ prevSegment.x2, prevSegment.y2 ], so[2], so[3]];
    
        so = splitSegment.offset;
        splitSegment.offset = [so[0], so[1], so[2], so[3], [ prevSegment.x2, prevSegment.y2 ]];
    
        nextSegment.offset[3] = [ rightTopIntersect.x, rightTopIntersect.y ];
        splitSegment.offset[0] = [ rightTopIntersect.x, rightTopIntersect.y ];
    
        so = nextSegment.offset;
        nextSegment.offset = [so[0], so[1], so[2], so[3], [ prevSegment.x2, prevSegment.y2 ]];
    
        prevSegment.splitSegment = splitSegment;
    }
    else {
        const leftBottomIntersect = checkIntersects(
            [prevSegment.offset[0][0], prevSegment.offset[0][1], prevSegment.offset[1][0], prevSegment.offset[1][1]],
            [splitSegment.offset[0][0], splitSegment.offset[0][1], splitSegment.offset[1][0], splitSegment.offset[1][1]]
        );
    
        const rightBottomIntersect = checkIntersects(
            [nextSegment.offset[0][0], nextSegment.offset[0][1], nextSegment.offset[1][0], nextSegment.offset[1][1]],
            [splitSegment.offset[2][0], splitSegment.offset[2][1], splitSegment.offset[3][0], splitSegment.offset[3][1]]
        );
    
        prevSegment.offset[1] = [ leftBottomIntersect.x, leftBottomIntersect.y ];
        splitSegment.offset[0] = [ leftBottomIntersect.x, leftBottomIntersect.y ];
    
        let so = prevSegment.offset;
        prevSegment.offset = [so[0], so[1], [ prevSegment.x2, prevSegment.y2 ], so[2], so[3]];
    
        so = splitSegment.offset;
        splitSegment.offset = [so[0], so[1], so[2], so[3], [ prevSegment.x2, prevSegment.y2 ]];
    
        nextSegment.offset[0] = [ rightBottomIntersect.x, rightBottomIntersect.y ];
        splitSegment.offset[3] = [ rightBottomIntersect.x, rightBottomIntersect.y ];
    
        so = nextSegment.offset;
        nextSegment.offset = [so[0], so[1], so[2], so[3], [ prevSegment.x2, prevSegment.y2 ]];
    
        prevSegment.splitSegment = splitSegment;
    }

    generateSegments(angle, prevSegment.splitSegment, 10);
}

function createOffset(segment, angle) {
    if (segment.offset.length) return;

    segment.offset.push(
        [cos(angle) - padding * sin(angle) + segment.x1, sin(angle) + padding * cos(angle) + segment.y1],
        [cos(angle) - padding * sin(angle) + segment.x2, sin(angle) + padding * cos(angle) + segment.y2],
        [cos(angle) + padding * sin(angle) + segment.x2, sin(angle) - padding * cos(angle) + segment.y2],
        [cos(angle) + padding * sin(angle) + segment.x1, sin(angle) - padding * cos(angle) + segment.y1]
    );
}

function linkOffset(newSegment, prevSegment) {
    const topPoint = checkIntersects(
        [prevSegment.offset[0][0], prevSegment.offset[0][1], prevSegment.offset[1][0], prevSegment.offset[1][1]],
        [newSegment.offset[0][0], newSegment.offset[0][1], newSegment.offset[1][0], newSegment.offset[1][1]]
    );

    const bottomPoint = checkIntersects(
        [prevSegment.offset[3][0], prevSegment.offset[3][1], prevSegment.offset[2][0], prevSegment.offset[2][1]],
        [newSegment.offset[3][0], newSegment.offset[3][1], newSegment.offset[2][0], newSegment.offset[2][1]]
    );

    prevSegment.offset[1] = [ topPoint.x, topPoint.y ];
    newSegment.offset[0] = [ topPoint.x, topPoint.y ];

    prevSegment.offset[2] = [ bottomPoint.x, bottomPoint.y ];
    newSegment.offset[3] = [ bottomPoint.x, bottomPoint.y ];
}

function checkIntersects(l1, l2, isOnlyLine) {
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

    if (isOnlyLine) {
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
                    x: x4,
                    y: y2,
                    point
                }
            }
            else {
                return {
                    x: x3,
                    y: y1,
                    point
                }
            }
        }
    }
    else {
        return point;
    }
}

function drawSegments() {
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        
        ctx.beginPath();
        ctx.moveTo(segment.x1, segment.y1);
        ctx.lineTo(segment.x2, segment.y2);

        ctx.strokeStyle = '#555';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(segment.offset[0], segment.offset[1]);

        for (let j = 0; j < segment.offset.length; j++) {
            const zone = segment.offset[j];

            ctx.lineTo(zone[0], zone[1]);
        }

        ctx.strokeStyle = '#fff';
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

const startAngle = (1 * Math.random() * Math.PI / 180) - (1 * Math.random() * Math.PI / 180);
const startSegment = {
    x1: 0,
    y1: canvas.height / 2,
    x2: 0 + Math.cos(startAngle) * segmentLength,
    y2: canvas.height / 2 + Math.sin(startAngle) * segmentLength,
    offset: [],
    zone: []
}

generateSegments(startAngle, startSegment, 50);

const mainSegmentsCount = segments.length;
let lastSplitSegment = 0;

for (let i = 1; i < mainSegmentsCount - 1; i++) {
    if (Math.random() > 0.5 && i - lastSplitSegment > 1) {
        splitSegment(segments[i], segments[i+1]);
        lastSplitSegment = i;
    }
}
loop();