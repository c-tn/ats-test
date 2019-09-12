async function createPlanetSprite(planet) {
    let tempCanvas = document.createElement('canvas');
    let ctx = tempCanvas.getContext('2d');

    tempCanvas.width = tempCanvas.height = planet.size * 2 + 5 * planet.size / 100;

    const type = planet.name[0];
    const amp = type === 'V' ? 3 : seed.unit() * 2 + 0.3;
    const freq = type === 'V' ? 0.03 : 0.01;
    const { color } = planet;

    const planetNoise = planetGenerator.generateNoise(seed.unitString(), amp, freq, 1040, 1040, color.r, color.g, color.b, planet.size);
    const planetTexture = planetGenerator.generatePlanet(planetNoise.imageData);

    ctx.putImageData(planetTexture.imageData, 0, 0);

    let image = new Image();
    image.src = tempCanvas.toDataURL();

    return new Promise(res => {
        image.onload = res(image);
    });
}

function drawPlanets() {
    if (envData.current.name[0] !== 'S') return;

    Object.values(currentSystem.planets).forEach(async planet => {
        if (!planet.sprite) {
            planet.sprite = await createPlanetSprite(planet);
        }
        else {
            if (planet.name[0] === 'V') {
                setShadowsParam(0, 0, 100, '#aa0');
            }
            else {
                setShadowsParam();
            }

            planet.x = Math.cos(planet.currentAngle) * planet.r;
            planet.y = Math.sin(planet.currentAngle) * planet.r;
            planet.currentAngle += planet.currentSpeed;

            ctx.save();
                ctx.translate(
                    planet.x - camera.x + camera.width / 2 - planet.sprite.width / 2,
                    planet.y - camera.y + camera.height / 2 - planet.sprite.height / 2
                );

                ctx.drawImage(
                    planet.sprite,
                    0, 0
                );
            ctx.restore();
        }
    });
}