const envTypes = {
    chunk: 0,
    system: 1,
    planet: 2,
    sun: 3
}

function generateEnv(x, y) {
    const chunkSize = config.chunkSize;

    for (let i = x - chunkSize; i < x + chunkSize * 2; i += chunkSize) {
        for (let j = y - chunkSize; j < chunkSize * 2; j += chunkSize) {
            let newChunk = {
                x: i,
                y: j,
                name: '',
                type: envTypes.chunk,
                seed: new RNG(`${ seedValue }${ i }${ j }`),
                systems: {}
            };

            newChunk.name = `${ generateName(newChunk.seed) }`;

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
            name: `${ generateName(chunk.seed) }`,
            type: envTypes.system,
            parent: chunk.name,
            seed: new RNG(chunk.seed.unitString()),
            isOpen: false,
            planets: {},
            triggers: []
        };

        chunk.systems[newSystem.name] = newSystem;
    }
}

function createCrisisItem(system) {
    system.availabilityItems = {};

    for (let i = 0; i < legalItems.length; i++) {
        const item = legalItems[i];
        const minAvailability = item.crisis && item.crisis.availability || system.seed.unit();
        const availability = +(system.seed.unit() * (1 - minAvailability) + minAvailability).toFixed(2);

        system.availabilityItems[item.name] = availability;
    }
}

function createSystemPlanets(system) {
    system.planets[system.name] = {
        x: 0,
        y: 0,
        r: 0,
        size: config.minPlanetSize,
        currentSpeed: 0,
        currentAngle: 0,
        type: envTypes.sun,

        name: system.name,
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

            type: envTypes.planet,
            name: generateName(system.seed),
            parent: system.name,
            seed: system.seed.unitString(),
            color: textureColors[colorId],
            cities: [],
            triggers: []
        };

        newPlanet.x = Math.cos(newPlanet.currentAngle) * newPlanet.r;
        newPlanet.y = Math.sin(newPlanet.currentAngle) * newPlanet.r;

        system.planets[newPlanet.name] = newPlanet;
    }
}