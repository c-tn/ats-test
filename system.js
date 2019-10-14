const envTypes = {
    chunk: 0,
    system: 1,
    planet: 2,
    sun: 3
}

const systemRect = createRect(
    -config.chunkSize * 1000,
    -config.chunkSize * 1000,
    config.chunkSize * 2000,
    config.chunkSize * 2000
);

const systemQtree = new QuadTree(systemRect, 50);

function generateEnv(x, y, range = 50) {
    const chunkSize = config.chunkSize;
    const startX = x - range * chunkSize;
    const endX = x + range * chunkSize;

    const startY = y - range * chunkSize;
    const endY = y + range * chunkSize;

    for (let i = startX; i <= endX; i += chunkSize) {
        for (let j = startY; j <= endY; j += chunkSize) {
            let newChunk = {
                x: i,
                y: j,
                type: envTypes.chunk,
                seed: new RNG(`${ seed.unitString().substr(2) }${ seedValue }${ (i * seed.unit()).toString(36) }${ (j * seed.unit()).toString(36) }`),
                systems: {},
                owner: null
            };

            const selectRect = createRect(newChunk.x, newChunk.y, chunkSize, chunkSize);
            const selectedChunks = systemQtree.query(selectRect);

            if (selectedChunks.length) continue;

            const qtreePoint = createPoint(newChunk.x, newChunk.y, newChunk);
            systemQtree.insert(qtreePoint);

            createChunkSystem(newChunk);

            envData.chunks.push(newChunk);
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
            seed: new RNG(chunk.seed.unitString()),
            isOpen: false,
            planets: {},
            triggers: [],
            owner: chunk.owner
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
            seed: system.seed.unitString(),
            color: textureColors[colorId],
            cities: [],
            triggers: [],
            ships: [],

            owner: system.owner
        };

        newPlanet.x = Math.cos(newPlanet.currentAngle) * newPlanet.r;
        newPlanet.y = Math.sin(newPlanet.currentAngle) * newPlanet.r;

        system.planets[newPlanet.name] = newPlanet;
    }
}