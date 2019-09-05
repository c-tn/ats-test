let planetTexture = null;
let stoneTexture = null;
let stonePattern = null;
let lightStoneTexture = null;
let lightStonePattern = null;

const textureColors = [
    {
        r: 0.3,
        g: 0.6,
        b: 0
    }, {
        r: 0.5,
        g: 0.5,
        b: 0.5
    }, {
        r: 0.6,
        g: 0.2,
        b: 0.1
    }, {
        r: 0.6,
        g: 0.9,
        b: 0.5
    }, {
        r: 0.7,
        g: 0.2,
        b: 0.5
    }, {
        r: 0.2,
        g: 0.3,
        b: 0.6
    }
]

function createTexture() {
    let textureCanvas = document.createElement('canvas');
    let ctx = textureCanvas.getContext('2d');

    textureCanvas.width = canvas.width;
    textureCanvas.height = canvas.height;

    const color = textureColors[Math.floor(seed.unit() * textureColors.length)];

    envData.currentColor = color;

    let planetNoise = planetGenerator.generateNoise(seed.unit(), 0.05, 10, canvas.width, canvas.height, color.r, color.g, color.b);
    let stoneNoise = planetGenerator.generateNoise(seed.unit(), 0.15, 20, canvas.width, canvas.height, 0.4, 0.4, 0.4);
    let lightStoneNoise = planetGenerator.generateNoise(seed.unit(), 0.15, 20, canvas.width, canvas.height, 0.7, 0.7, 0.7);

    fileLoader(resolve => {
        ctx.putImageData(planetNoise.imageData, 0, 0);

        let planetTextureImg = new Image();
        planetTextureImg.src = textureCanvas.toDataURL();

        planetTextureImg.onload = () => {
            envData.currentTexture = planetTextureImg;
            resolve();
        };
    });

    fileLoader(resolve => {
        ctx.putImageData(stoneNoise.imageData, 0, 0);
    
        let stoneImg = new Image();
        stoneImg.src = textureCanvas.toDataURL();

        stoneImg.onload = () => {
            stoneTexture = stoneImg;
            stonePattern = ctx.createPattern(stoneTexture, "repeat");
            resolve();
        };
    });

    fileLoader(resolve => {
        ctx.putImageData(lightStoneNoise.imageData, 0, 0);
    
        let lightStoneImg = new Image();
        lightStoneImg.src = textureCanvas.toDataURL();

        lightStoneImg.onload = () => {
            lightStoneTexture = lightStoneImg;
            lightStonePattern = ctx.createPattern(lightStoneTexture, "repeat");
            resolve();
        };
    });
}

function drawLandscape() {
    const x = Math.floor(playerShip.x / camera.width) * camera.width;
    const y = Math.floor(playerShip.y / camera.height) * camera.height;

    for (let i = x - camera.width; i < x + camera.width * 2; i += camera.width) {
        for (let j = y - camera.height; j < y + camera.height * 2; j += camera.height) {
            const xPos = i - camera.x + camera.width / 2;
            const yPos = j - camera.y + camera.height / 2;

            ctx.drawImage(envData.currentTexture, xPos, yPos);
        }
    }
}