let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

canvas.style.width = '200px';
canvas.style.height = '200px';

canvas.width = canvas.height = 200;

let sprite;
let seed = '';
let hue = 0;
let saturation = 0;
let data = [
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 1, 1,
    0, 0, 1, 0, 0, 0, 1, 1, 1,
    0, 0, 1, 0, 0, 0, 1, 1, 1,
    0, 0, 1, 0, 0, 1, 1, 1, 1,
    0, 0, 1, 0, 1, 1, 1, 1, 1,
    0, 0, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
];

let seedInput = document.getElementById('seed');

seedInput.addEventListener('input', ({ target }) => {
    seed = target.value;

    draw();
});

function generateSprite({
    hue = 0.5,
    saturation = 0.5,
    width = 9,
    height = 16,
    data,
    seed
} = {}) {
    let generatedMask = new Mask({
        data,
        width,
        height,
        isMirrorX: true
    });

    let sprite = new Sprite(generatedMask, {
        hue,
        saturation,
        seed,
        isColored: true
    });

    let resizedSprite = sprite.resize(sprite.canvas, 5);

    return resizedSprite;
}

function createSprite() {
    sprite = generateSprite({ hue, seed, saturation, data });
}

let cells = [];

createCells();

function createCells() {
    let wrapper = document.getElementById('mask');

    for (let i = 0; i < 144; i++) {
        let cell = document.createElement('div');
        cell.classList.add('cell');

        if (data[i]) {
            cell.classList.add('filled');
        }

        wrapper.appendChild(cell);
        cells.push(cell);
    }

    wrapper.addEventListener('click', ({ target }) => {
        if (!target.classList.contains('cell')) return;
    
        let i = cells.findIndex(d => d === target);
    
        data[i] = +!data[i];

        cells[i].classList.toggle('filled');

        draw();
    });
}

function draw() {
    ctx.clearRect(0, 0, 200, 200);

    createSprite();

    ctx.drawImage(
        sprite,
        canvas.width / 2 - sprite.width / 2,
        canvas.height / 2 - sprite.height / 2
    );
}

let hueWrapper = document.getElementById('hue');;
hueWrapper.addEventListener('input', ({ target }) => {
    hue = +target.value;

    draw();
})

let saturationWrapper = document.getElementById('saturation');
saturationWrapper.addEventListener('input', ({ target }) => {
    saturation = +target.value;

    draw();
})

let resetBtn = document.getElementById('reset');
resetBtn.addEventListener('click', () => {
    data = data.map(v => v = 0);

    cells.forEach(cell => cell.classList.remove('filled'));

    draw();
})

draw();