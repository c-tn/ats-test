let files = {
    loaded: 0,
    total: 0
}


function fileLoader(req) {
    files.total++;

    new Promise(req)
    .then(async () => {
        files.loaded++;

        if (files.loaded >= files.total) {
            await startGame();
            gameLoop()
        }
    });
}

let currentChunk = null;
let currentSystem = null;
let currentPlanet = null;

function init() {
    setItemsInCategories();
    generateReces();
    generateEnv(0, 0);
    populateRaces();

    const center = ~~(envData.chunks.length / 2);
    
    currentChunk = Object.values(envData.chunks)[center];
    currentSystem = Object.values(currentChunk.systems)[0];

    createSystemPlanets(currentSystem);
    createCrisisItem(currentSystem);
    currentSystem.isOpen = true;

    currentPlanet = Object.values(currentSystem.planets)[1];

    envData.current = envData.chunks[center]
        .systems[currentSystem.name]
        .planets[currentPlanet.name];

    createAnotherTexture();
    createLandings();
}

init();