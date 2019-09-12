function generateEnv(x, y) {
    const chunkSize = config.chunkSize;

    for (let i = x - chunkSize; i < x + chunkSize * 3; i += chunkSize) {
        for (let j = y - chunkSize; j < chunkSize * 3; j += chunkSize) {
            let newChunk = {
                x: i,
                y: j,
                name: `C-${ seed.unitString() }`,
                seed: new RNG(`${ seed.unitString() }${ x }${ y }`),
                systems: {}
            };

            if (envData.chunks[newChunk.name]) continue;

            createChunkSystem(newChunk);

            envData.chunks[newChunk.name] = newChunk;
        }
    }
}

function createChunkSystem(chunk) {
    const systemsCount = Math.floor(chunk.seed.unit() * config.maxSystemsInChunk) + 1;

    for (let i = 0; i < systemsCount; i++) {
        let newSystem = {
            x: chunk.seed.unit() * config.chunkSize,
            y: chunk.seed.unit() * config.chunkSize,
            name: `S-${ chunk.seed.unitString() }`,
            parent: chunk.name,
            seed: new RNG(chunk.seed.unitString()),
            planets: {}
        };

        createSystemPlanets(newSystem);

        chunk.systems[newSystem.name] = newSystem;
    }
}

function createSystemPlanets(system) {
    system.planets[`V-${ system.name.slice(2) }`] = {
        x: 0,
        y: 0,
        r: 0,
        size: config.minPlanetSize,
        currentSpeed: 0,
        currentAngle: 0,

        name: `V-${ system.name.slice(2) }`,
        parent: system.name,
        seed: system.seed.unitString(),
        color: {
            r: 0.9,
            g: 0.9,
            b: 0
        },
    }

    for (let i = 1; i < config.maxPlanetsInSystem + 1; i++) {
        if (system.seed.unit() > 0.4 && Object.keys(system.planets).length > 1) continue;

        const colorId = Math.floor(system.seed.unit() * textureColors.length);

        const newPlanet = {
            x: 0,
            y: 0,
            r: i * 3000,
            size: config.minPlanetSize,
            currentSpeed: system.seed.unit() * 0.0001,
            currentAngle: system.seed.unit() * (360 * Math.PI / 180),

            name: `P-${ system.seed.unitString() }`,
            parent: system.name,
            seed: system.seed.unitString(),
            color: textureColors[colorId],
            cities: []
        };

        newPlanet.x = Math.cos(newPlanet.currentAngle) * newPlanet.r;
        newPlanet.y = Math.sin(newPlanet.currentAngle) * newPlanet.r;

        system.planets[newPlanet.name] = newPlanet;
    }
}