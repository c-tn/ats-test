const isDebug = false;

/**
 * Create cities for planet
 * @param {object} planet 
 */
function createCities(planet) {
    const seed = new RNG('' || planet.seed);
    const citiesCount = 1 || Math.floor(seed.unit() * 2);

    for (let i = 0; i < citiesCount; i++) {
        const city = {
            seed,
            id: seed.unitString(),
            name: `C-${ seed.unitString() }`,
            angleOffset: 35,
            angle: (35 * seed.unit() * Math.PI / 180) - (35 * 2 * seed.unit() * Math.PI / 180),
            segmentLength: 500,
            roads: [],
            builds: []
        }

        generateRoads(city, 0, city.angle);

        planet.cities.push(city);
    }
}

/**
 * Generate roads for city
 * @param {object} planet 
 * @param {number} lvl 
 * @param {float} angle 
 * @param {object} lastSegment 
 * @param {number} maxSegments 
 * @param {number} currentSegmentsCount 
 */
function generateRoads(city, lvl = 0, angle, lastSegment, maxSegments = 20, currentSegmentsCount = 0) {
    if (!lastSegment) {
        lastSegment = {
            x1: 0,
            y1: 0,
            x2: 0 + Math.cos(angle) * city.segmentLength,
            y2: 0 + Math.sin(angle) * city.segmentLength
        }

        city.roads.push(lastSegment);
    }

    angle += (city.angleOffset * city.seed.unit() * Math.PI / 180) - (city.angleOffset * city.seed.unit() * Math.PI / 180);

    let newSegment = {
        x1: lastSegment.x2,
        y1: lastSegment.y2,
        x2: lastSegment.x2 + Math.cos(angle) * city.segmentLength,
        y2: lastSegment.y2 + Math.sin(angle) * city.segmentLength,
        angle
    };

    checkIntersects(newSegment, city);
    checkTails(newSegment, city);

    generateBuild(newSegment, city, angle);

    if (currentSegmentsCount > 10 && !newSegment.isInter && city.seed.unit() > 0.7 && lvl < 2) {
        let direction = city.seed.unit() > 0.5
            ? 1
            : -1;

        generateRoads(city, lvl + 1, angle + 90 * Math.PI / 180 * direction, lastSegment, maxSegments, 0);
    }

    city.roads.push(newSegment);

    if (lvl <= 2 && currentSegmentsCount < maxSegments && !newSegment.isInter) {
        generateRoads(city, lvl, angle, newSegment, maxSegments, currentSegmentsCount + 1);
    }
}

/**
 * Generate build for segment
 * @param {object} segment 
 * @param {object} city 
 * @param {float} angle 
 */
function generateBuild(segment, city, angle) {
}

/**
 * check the segment for intersection 
 * @param {object} newSegment 
 * @param {object} city 
 */
function checkIntersects(newSegment, city) {
    for (let i = 0; i < city.roads.length; i++) {
        let segment = city.roads[i];

        if (
            newSegment === segment ||
            newSegment.x2 === segment.x1 ||
            newSegment.y2 === segment.y1 ||
            newSegment.x1 === segment.x2 ||
            newSegment.y1 === segment.y2
        ) continue;

        const x1 = newSegment.x1;
        const x2 = newSegment.x2;
        const x3 = segment.x1;
        const x4 = segment.x2;
        
        const y1 = newSegment.y1;
        const y2 = newSegment.y2;
        const y3 = segment.y1;
        const y4 = segment.y2;

        let m12 = (y2 - y1) / (x2 - x1);
        let m34 = (y4 - y3) / (x4 - x3);
        let m = m34 / m12;
        let x = (x1 - y1 / m12 - m * x3 + y3 / m12) / (1 - m);
        let y = m12 * (x - x1) + y1;

        const point = { x, y };

        if (
            point.x >= Math.min(newSegment.x1, newSegment.x2) &&
            point.x <= Math.max(newSegment.x1, newSegment.x2) &&
            point.x >= Math.min(segment.x1, segment.x2) &&
            point.x <= Math.max(segment.x1, segment.x2) &&
            point.y >= Math.min(newSegment.y1, newSegment.y2) &&
            point.y <= Math.max(newSegment.y1, newSegment.y2) &&
            point.y >= Math.min(segment.y1, segment.y2) &&
            point.y <= Math.max(segment.y1, segment.y2)                    
        ) {
            let d1 = Math.sqrt(Math.pow(newSegment.x2 - segment.x1, 2) + Math.pow(newSegment.y2 - segment.y1, 2));
            let d2 = Math.sqrt(Math.pow(newSegment.x2 - segment.x2, 2) + Math.pow(newSegment.y2 - segment.y2, 2));

            if (d1 > d2) {
                newSegment.x2 = segment.x2;
                newSegment.y2 = segment.y2;
            }
            else {
                newSegment.x2 = segment.x1;
                newSegment.y2 = segment.y1;
            }

            newSegment.isInter = true;

            return point;
        }
    }
}

function checkTails(newSegment, city) {
    for (let i = 0; i < city.roads.length; i++) {
        let segment = city.roads[i];

        if (
            newSegment === segment ||
            newSegment.x2 === segment.x1 ||
            newSegment.y2 === segment.y1 ||
            newSegment.x1 === segment.x2 ||
            newSegment.y1 === segment.y2
        ) continue;

        const segmentLength = Math.sqrt((segment.x2 - segment.x1)**2 + (segment.y2 - segment.y1)**2);
        const d1 = Math.sqrt((newSegment.x2 - segment.x1)**2 + (newSegment.y2 - segment.y1)**2);
        const d2 = Math.sqrt((newSegment.x2 - segment.x2)**2 + (newSegment.y2 - segment.y2)**2);

        if (d1 < segmentLength * 0.7) {
            newSegment.x2 = segment.x1;
            newSegment.y2 = segment.y1;

            return;
        }
        else if (d2 < segmentLength * 0.7) {
            newSegment.x2 = segment.x2;
            newSegment.y2 = segment.y2;

            return;
        }
    }
}

/**
 * Draw city roads
 */
function drawRoads() {
    if (envData.current.name[0] !== 'P') return;

    ctx.lineWidth = config.roadWidth;
    ctx.strokeStyle = stonePattern;
    ctx.fillStyle = stonePattern;
    ctx.lineCap = 'round';

    if (isDebug) {
        ctx.strokeStyle = 'rgba(255, 255, 255, .2)';
        ctx.fillStyle = 'rgba(255, 255, 255, .2)';
    }

    envData.current.cities.forEach(city => {
        city.roads.forEach(road => {
            ctx.save();
                ctx.translate(
                    road.x1 - camera.x + camera.width / 2,
                    road.y1 - camera.y + camera.height / 2
                );

                ctx.beginPath();

                ctx.moveTo(0, 0);
                ctx.lineTo(
                    road.x2 - road.x1,
                    road.y2 - road.y1
                );

                ctx.stroke();
            ctx.restore();
        });
    });
}

function drawBuildings() {
    if (envData.current.name[0] !== 'P') return;

    ctx.lineWidth = 15;
    ctx.strokeStyle = lightStonePattern;
    ctx.fillStyle = stonePattern;
    setShadowsParam(0, 0, 3, '#000');

    envData.current.cities.forEach(city => {
        city.builds.forEach(build => {
            ctx.save();
                ctx.translate(
                    build.x1 - camera.x + camera.width / 2,
                    build.y1 - camera.y + camera.height / 2
                );

                ctx.beginPath();

                ctx.moveTo(0, 0);

                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            ctx.restore();
        });
    });
}


















function createTriggers() {
    if (!envData.current.roads.length) return;

    const id = Math.floor((envData.current.roads.length - 1) * seed.unit());
    const shop = envData.current.buildings[id];

    shop.text = 'shop';

    envData.current.triggers.push({
        x: shop.x,
        y: shop.y,
        id: shop.id,
        size: shop.size,
        isOpen: false,
        items: [],
        action() {
            this.isOpen = !this.isOpen;
            inventoryData.isOpen = this.isOpen;
            inventoryData.inventoryOffsetY = inventoryData.height / 2

            if (!this.items.length) {
                createShopStuff(this);
            }
        }
    });
}

function checkTriggers() {
    if (!envData.current.triggers) return;

    playerShip.currentTrigger = envData.current.triggers.find(trigger =>
        playerShip.x > trigger.x &&
        playerShip.x < trigger.x + trigger.size &&
        playerShip.y > trigger.y &&
        playerShip.y < trigger.y + trigger.size
    );
}

function pushShips(planet) {
    const seed = new RNG(planet.seed);
    const shipsCount = Math.floor(seed.unit() * 10);

    planet.ships = [];

    for (let i = 0; i < shipsCount; i++) {
        planet.ships.push(createShip(true));
    }
}