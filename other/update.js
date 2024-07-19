let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

canvas.width = 2048;
canvas.height = 1080;

let obj1 = {
    x: canvas.width / 2 - 10,
    y: canvas.height / 2,
    r: 100,
    a: 0.1,
    s: 0.01,
    timeStamp: performance.now()
}

let obj2 = {
    x: canvas.width / 2 + 10,
    y: canvas.height / 2,
    r: 100,
    a: 0.1,
    s: 0.01,
    timeStamp: performance.now()
}

ctx.font = '30px Arial';
ctx.textAlign = 'left';
ctx.textBaseline = 'top';

function loop() {
    ctx.fillStyle = '#000';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';

    showFPS();

    ctx.beginPath();
    ctx.arc(
        obj1.x,
        obj1.y,
        10,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(
        obj2.x,
        obj2.y,
        10,
        0,
        Math.PI * 2
    );
    ctx.fill();

    calculateObjectPos(obj1);

    requestAnimationFrame(loop);
}

function calculateObjectPos(obj) {
    const timeStamp = obj.timeStamp;
    obj.timeStamp = performance.now();

    const aPerSec = obj.s * 60;
    const dif = obj.timeStamp - timeStamp;
    const ang = dif / 1000 * aPerSec;

    obj.a += ang;
    obj.x = Math.cos(obj.a) * obj.r + canvas.width / 2;
    obj.y = Math.sin(obj.a) * obj.r + canvas.height / 2;
}

canvas.addEventListener('wheel', () => {
    calculateObjectPos(obj2)
});

function showFPS() {}

loop();