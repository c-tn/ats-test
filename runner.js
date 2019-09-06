let files = {
    loaded: 0,
    total: 0
}

let currentCtrl;

function fileLoader(req) {
    files.total++;

    new Promise(req)
    .then(async () => {
        files.loaded++;

        if (files.loaded >= files.total) {
            await init();
            currentCtrl = fpsCtrl(100, gameLoop);
        }
    });
}

generateEnv(0, 0);

let currentChunk = Object.values(envData.chunks)[4];
let currentSystem = Object.values(currentChunk.systems)[0];
let currentPlanet = Object.values(currentSystem.planets)[1];

envData.current = envData.chunks[currentChunk.name]
    .systems[currentSystem.name]
    .planets[currentPlanet.name];

createAnotherTexture();