let races = [];

function generateReces() {
    const raceCount = ~~(seed.unit() * config.avgRaceCount) + 3;
    const colorAdditional = ~~(200 / raceCount);

    for (let i = 0; i < raceCount; i++) {
        const race = {
            id: seed.unitString(),
            seed: new RNG(seed.unitString()),
            name: generateName(seed),
            radius: ~~(seed.unit() * config.avgRaceControlRadius),
            color: null,
            shipSprite: null,
            systemsCount: 0
        }

        let r = (200 - ~~(race.seed.unit() * (i + 1) * colorAdditional)).toString(16);
        r = r.length === 1 ? `0${r}` : r;

        let g = (200 - ~~(race.seed.unit() * (i + 1) * colorAdditional)).toString(16);
        g = g.length === 1 ? `0${g}` : g;

        let b = (200 - ~~(race.seed.unit() * (i + 1) * colorAdditional)).toString(16);
        b = b.length === 1 ? `0${b}` : b;

        race.color = `#${ r }${ g }${ b }`;

        const hsl = hexToHSL(race.color);
        const maskId = ~~(race.seed.unit() * masks.length);

        race.shipSprite = generateSprite({
            seed: race.seed.unitString(),
            hue: hsl.h / 360,
            saturation: hsl.s / 100,
            data: masks[maskId]
        });

        races.push(race);
    }
}

function populateRaces() {
    for (let i = 0; i < races.length; i++) {
        const race = races[i];

        const x = ~~(race.seed.unit() * 3000) - 1500;
        const y = ~~(race.seed.unit() * 3000) - 1500;
        const selectCircle = createCircle(x, y, race.radius);

        let chunks = systemQtree.query(selectCircle);

        chunks.forEach(point => {
            const chunk = point.data;

            if (!chunk.owner) {
                race.systemsCount += 1;

                chunk.owner = race;

                Object.values(chunk.systems).forEach(system => {
                    system.owner = race;
                });
            }
        });

        // TODO smth if systemsCount === 0

        delete race.radius;
    }

    races = races.sort((race, nextRace) => nextRace.systemsCount - race.systemsCount);
}