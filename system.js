function generateEnv(x, y) {
    const chunkSize = config.chunkSize;

    for (let i = x - chunkSize * 4; i < x + chunkSize * 8; i += chunkSize) {
        for (let j = y - chunkSize * 4; j < chunkSize * 8; j += chunkSize) {
            let isExistChunk = envData.chunks.find(
                chunk => chunk.x === i && chunk.y === j
            );

            if (isExistChunk) continue;

            let newChunk = {
                x: i,
                y: j,
                name: `C-${ seed.unit().toString(36).substr(2) }`,
                seed: new RNG(`${ seed }${ x }${ y }`),
                systems: []
            };

            createChunkSystem(newChunk);

            envData.chunks.push(newChunk);
        }
    }
}

function createChunkSystem(chunk) {
    const systemsCount = Math.floor(chunk.seed.unit() * config.maxSystemsInChunk);

    for (let i = 0; i < systemsCount; i++) {
        const x = chunk.seed.unit() * config.chunkSize;
        const y = chunk.seed.unit() * config.chunkSize;
        const name = `S-${ chunk.seed.unit().toString(36).substr(2) }`;

        let newSystem = {
            x, y, name,
            parent: chunk.name,
            seed: new RNG(seed),
            planets: []
        };

        createSystemPlanets(newSystem);

        chunk.systems.push(newSystem);
    }
}

function createSystemPlanets(system) {
    const planetsCount = config.maxPlanetsInSystem * system.seed.unit();

    for (let i = 0; i < planetsCount; i++) {
        system.planets.push({
            x: system.seed.unit() * 3000,
            y: system.seed.unit() * 3000,
            name: `P-${ system.seed.unit().toString(36).substr(2) }`,
            sprite: null,
            parent: system.name,
            seed: system.seed.unit().toString(36).substr(2),
        });
    }
}