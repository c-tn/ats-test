let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

let w = canvas.width = 3200;
let h = canvas.height = 1800;

let city = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: ~~(Math.random() * 50 + 100),
    children: [],
    level: 0
}

function generateCity(node, params, nodes) {
    const offset = 5;
    const newNodeSize = ~~(Math.random() * 30 + 10);
    const availableAngle = params.angleEnd - params.angleStart;
    const angle = ~~(Math.random() * availableAngle + params.angleStart) * Math.PI / 180;

    let newNode = {
        x: Math.cos(angle) * (node.size + newNodeSize + offset) + node.x,
        y: Math.sin(angle) * (node.size + newNodeSize + offset) + node.y,
        size: newNodeSize,
        children: [],
        level: node.level + 1
    }

    const isIntersect = checkIntersect(newNode, nodes);
    if (isIntersect) return;
    console.log(availableAngle);

    node.children.push(newNode);
    nodes.push(newNode);

    if (newNode.level < 15 && Math.random() > 0.1) {
        generateCity(newNode, params, nodes);
    }

    if (Math.random() > 0.5) {
        generateCity(node, {
            angleStart: angle - availableAngle / 2,
            angleEnd: angle + availableAngle / 2
        }, nodes);
    }

    while (nodes.length < 15) {
        generateCity(newNode, params, nodes);
    }
}

function checkIntersect(n1, nodes) {
    return nodes.find(n2 => Math.sqrt((n1.x - n2.x)**2 + (n1.y - n2.y)**2) < n1.size + n2.size);
}

function loop() {
    clearCanvas();

    drawSegment(city);
    
    requestAnimationFrame(loop);
}

function clearCanvas() {
    ctx.fillStyle = '#000';
    ctx.clearRect(0, 0, w, h);
    ctx.fillRect(0, 0, w, h);
}

function drawSegment(segment) {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';

    ctx.beginPath();
    ctx.arc(
        segment.x,
        segment.y,
        segment.size,
        0,
        Math.PI * 2,
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(
        segment.x,
        segment.y,
        2,
        0,
        Math.PI * 2
    );
    ctx.stroke();

    if (segment.children) {
        segment.children.forEach(s => {
            ctx.beginPath();
                ctx.moveTo(segment.x, segment.y);
                ctx.lineTo(s.x, s.y);
            ctx.stroke();
            drawSegment(s)
        });
    }
}

let nodes = [city];

for(let i = 0; i < 15; i++) {
    generateCity(city, {
        angleStart: 0,
        angleEnd: 360
    }, nodes);
    loop();
}

canvas.addEventListener('wheel', () => {
    const nodeId = ~~(Math.random() * nodes.length);
    const node = nodes[nodeId];

    generateCity(node, {
        angleStart: 0,
        angleEnd: 360
    }, nodes)
});