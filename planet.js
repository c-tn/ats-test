let currentPlanet = new Image();

function createPlanet() {
    let tempCanvas = document.createElement('canvas');
    let ctx = tempCanvas.getContext('2d');

    tempCanvas.width = tempCanvas.height = 210;

    const color = envData.currentColor;
    const planetNoise = planetGenerator.generateNoise(seed.unit().toString(36).substr(2), seed.unit() * 3, 0.01, 520, 520, color.r, color.g, color.b);
    const planetTexture = planetGenerator.generatePlanet(planetNoise.imageData);

    fileLoader(resolve => {
        ctx.putImageData(planetTexture.imageData, 0, 0);

        let image = new Image();
        image.src = tempCanvas.toDataURL();

        image.onload = () => {
            currentPlanet = image;
            resolve();
        };
    });
}

function drawPlanets() {
    envData.a += 0.005;
    envData.x += Math.cos(envData.a) * 5;
    envData.y += Math.sin(envData.a) * 5;

    ctx.save();
        ctx.translate(
            envData.x - camera.x + camera.width / 2,
            envData.y - camera.y + camera.height / 2
        );
        
        ctx.drawImage(
            currentPlanet,
            0, 0
        );
    ctx.restore();
}