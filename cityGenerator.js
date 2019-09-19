let isDebug = false;

/**
 * Create cities for planet
 * @param {object} planet 
 */
function createCities(planet) {
    const seed = new RNG('' || planet.seed);
    const maxCitiesCount = 4;

    planet.roads = [];
    planet.buildings = [];
    planet.triggers = [];

    for (let i = 0; i < maxCitiesCount; i++) {
        if (seed.unit() < 0.6) continue;

        const cityData = {
            seed,
            id: seed.unitString(),
            name: `C-${ seed.unitString() }`,
            angleOffset: 25,
            angle: (25 * seed.unit() * Math.PI / 180) - (25 * 2 * seed.unit() * Math.PI / 180),
            segmentLength: 500,
        }

        const buildings = [];
        const startX = i * (config.planetWidth / 4) - config.planetWidth / 2.5;
        const startY = seed.unit() * config.planetHeight / 1.5 - config.planetHeight / 3;

        const startSegment = {
            x1: startX,
            y1: startY,
            x2: startX + Math.cos(cityData.angle) * cityData.segmentLength,
            y2: startY + Math.sin(cityData.angle) * cityData.segmentLength,
            angle: cityData.angle
        }
        
        const roads = generateRoads(cityData, 0, cityData.angle, startSegment);
    
        for (let i = 0; i < roads.length; i++) {
            const road = roads[i];
            const building = generateBuildingAreas(road, roads, cityData);

            if (building) {
                buildings.push(building);
            }
        }

        createTriggers(seed, buildings);

        planet.cities.push(cityData);
        planet.roads.push(...roads);
        planet.buildings.push(...buildings);
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
function generateRoads(city, lvl = 0, angle, lastSegment, maxSegments = 20, currentSegmentsCount = 0, roads = []) {
    angle += (city.angleOffset * city.seed.unit() * Math.PI / 180) - (city.angleOffset * city.seed.unit() * Math.PI / 180);

    let newSegment = {
        x1: lastSegment.x2,
        y1: lastSegment.y2,
        x2: lastSegment.x2 + Math.cos(angle) * city.segmentLength,
        y2: lastSegment.y2 + Math.sin(angle) * city.segmentLength,
        angle
    };

    const interData = checkIntersects(newSegment, roads);
    const tailsData = checkTails(newSegment, roads);

    if (interData) {
        newSegment.x2 = interData.x;
        newSegment.y2 = interData.y;
    }

    if (tailsData) return roads;

    if (currentSegmentsCount > 10 && !interData && city.seed.unit() > 0.7 && lvl < 2) {
        const direction = city.seed.unit() > 0.5
            ? 1
            : -1;

        const newRoads = generateRoads(city, lvl + 1, angle + 90 * Math.PI / 180 * direction, lastSegment, maxSegments, 0, roads);

        roads.concat(newRoads);
    }

    roads.push(newSegment);

    if (lvl <= 2 && currentSegmentsCount < maxSegments && !interData) {
        const newRoads = generateRoads(city, lvl, angle, newSegment, maxSegments, currentSegmentsCount + 1, roads);

        roads.concat(newRoads);
    }

    return roads;
}

/**
 * Generate buildings area for segment
 * @param {object} segment 
 * @param {object} city 
 * @param {float} angle 
 */
function generateBuildingAreas(segment, roads, city) {
    const res = filterByCoords(segment, roads);

    if (res.length > 3) return;

    const angle = Math.atan2(segment.y2 - segment.y1, segment.x2 - segment.x1) + Math.PI;
    const dir = city.seed.unit() > 0.5 ? 1 : -1;
    const width = config.roadWidth * 1.5;

    let data = [];

    const l1 = {
        x1: Math.cos(angle) - (config.roadWidth / 2 * dir) * Math.sin(angle) + segment.x1,
        y1: Math.sin(angle) + (config.roadWidth / 2 * dir) * Math.cos(angle) + segment.y1,
        x2: Math.cos(angle) - (config.roadWidth / 2 * dir) * Math.sin(angle) + segment.x2,
        y2: Math.sin(angle) + (config.roadWidth / 2 * dir) * Math.cos(angle) + segment.y2
    }

    const l2 = {
        x1: l1.x2,
        y1: l1.y2,
        x2: Math.cos(angle + Math.PI) * dir + width * Math.sin(angle + Math.PI) * dir + segment.x2,
        y2: Math.sin(angle + Math.PI) * dir - width * Math.cos(angle + Math.PI) * dir + segment.y2
    }

    const l3 = {
        x1: l2.x2,
        y1: l2.y2,
        x2: Math.cos(angle + Math.PI) * dir + width * Math.sin(angle + Math.PI) * dir + segment.x1,
        y2: Math.sin(angle + Math.PI) * dir - width * Math.cos(angle + Math.PI) * dir + segment.y1
    }

    const l4 = {
        x1: l3.x2,
        y1: l3.y2,
        x2: l1.x1,
        y2: l1.y1
    }

    data.push(l1);
    data.push(l2);
    data.push(l3);
    data.push(l4);

    const isIntersects = checkBuildIntersects(roads);

    if (isIntersects) return;
    
    return data;
}

function checkBuildIntersects(data) {
    for (let i = 0; i < data.length; i++) {
        const segment = data[i];

        const roadInterData = checkIntersects(segment, data);
        const roadTailsData = checkTails(segment, data, 0.2);

        if (roadInterData || roadTailsData) return true;
    }

    for (let i = 0; i < data.length; i++) {
        const compareData = data[i];

        for (let j = 0; j < data.length; j++) {
            const segment = data[j];

            const interData = checkIntersects(segment, compareData);

            if (interData) return true;
        }
        
    }
}

/**
 * check the segment for intersection 
 * @param {object} newSegment 
 * @param {object} city 
 */
function checkIntersects(newSegment, data) {
    for (let i = 0; i < data.length; i++) {
        const segment = data[i];

        if (
            newSegment === segment ||
            newSegment.x2 === segment.x1 ||
            newSegment.x1 === segment.x2
        ) break;

        const x1 = newSegment.x1;
        const x2 = newSegment.x2;
        const x3 = segment.x1;
        const x4 = segment.x2;
        
        const y1 = newSegment.y1;
        const y2 = newSegment.y2;
        const y3 = segment.y1;
        const y4 = segment.y2;

        const m12 = (y2 - y1) / (x2 - x1);
        const m34 = (y4 - y3) / (x4 - x3);
        const m = m34 / m12;
        const x = (x1 - y1 / m12 - m * x3 + y3 / m12) / (1 - m);
        const y = m12 * (x - x1) + y1;

        const point = { x, y };

        if (
            point.x >= Math.min(x1, x2) &&
            point.x <= Math.max(x1, x2) &&
            point.x >= Math.min(x3, x4) &&
            point.x <= Math.max(x3, x4) &&
            point.y >= Math.min(y1, y2) &&
            point.y <= Math.max(y1, y2) &&
            point.y >= Math.min(y1, y2) &&
            point.y <= Math.max(y1, y2)                    
        ) {
            const d1 = Math.sqrt(Math.pow(x2 - x3, 2) + Math.pow(y2 - y1, 2));
            const d2 = Math.sqrt(Math.pow(x2 - x4, 2) + Math.pow(y2 - y2, 2));
    
            if (d1 > d2) {
                return {
                    x: x4,
                    y: y2,
                    point,
                    segment
                }
            }
            else {
                return {
                    x: x3,
                    y: y1,
                    point,
                    segment
                }
            }
        }
    }
}

function checkTails(newSegment, data, radius = 0.7) {
    for (let i = 0; i < data.length; i++) {
        let segment = data[i];

        if (newSegment === segment) break;

        const segmentLength = Math.sqrt((segment.x2 - segment.x1)**2 + (segment.y2 - segment.y1)**2);
        const d1 = Math.sqrt((newSegment.x2 - segment.x1)**2 + (newSegment.y2 - segment.y1)**2);
        const d2 = Math.sqrt((newSegment.x2 - segment.x2)**2 + (newSegment.y2 - segment.y2)**2);

        if (d1 < segmentLength * radius) {
            return {
                x: segment.x1,
                y: segment.y1,
                segment
            };
        }
        else if (d2 < segmentLength * radius) {
            return {
                x: segment.x2,
                y: segment.y2,
                segment
            };
        }
    }
}

function filterByCoords(segment, data) {
    return data.filter(item =>
        segment.x1 === item.x1 ||
        segment.x1 === item.x2 ||
        segment.x2 === item.x1 ||
        segment.x2 === item.x2 ||
        
        segment.y1 === item.y1 ||
        segment.y1 === item.y2 ||
        segment.y2 === item.y1 ||
        segment.y2 === item.y2
    );
}

/**
 * Draw city roads
 */
function drawRoads() {
    if (envData.current.name[0] !== 'P') return;

    ctx.lineWidth = config.roadWidth;
    ctx.strokeStyle = lightStonePattern;
    ctx.fillStyle = lightStonePattern;
    ctx.lineCap = 'round';

    if (isDebug) {
        ctx.strokeStyle = 'rgba(255, 255, 255, .2)';
        ctx.fillStyle = 'rgba(255, 255, 255, .2)';
    }

    envData.current.roads.forEach(road => {
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
}

function drawBuildings() {
    if (envData.current.name[0] !== 'P') return;

    setShadowsParam(0, 0, 10, '#000');
    ctx.lineWidth = 10;
    ctx.strokeStyle = stonePattern;
    ctx.fillStyle = lightStonePattern;

    if (isDebug) {
        ctx.strokeStyle = 'rgba(255, 255, 255, .2)';
        ctx.fillStyle = 'rgba(255, 255, 255, .2)';
    }

    envData.current.buildings.forEach(build => {
        ctx.save();
            ctx.translate(
                build[0].x1 - camera.x + camera.width / 2,
                build[0].y1 - camera.y + camera.height / 2
            );

            ctx.beginPath();

            ctx.moveTo(0, 0);
            ctx.lineTo(
                build[0].x2 - build[0].x1,
                build[0].y2 - build[0].y1
            );
            ctx.lineTo(
                build[1].x2 - build[0].x1,
                build[1].y2 - build[0].y1
            );
            ctx.lineTo(
                build[1].x2 - build[0].x1,
                build[1].y2 - build[0].y1
            );
            ctx.lineTo(
                build[2].x2 - build[0].x1,
                build[2].y2 - build[0].y1
            );
            ctx.lineTo(
                build[2].x2 - build[0].x1,
                build[2].y2 - build[0].y1
            );

            ctx.closePath();
            ctx.fill();
            ctx.stroke();

        ctx.restore();
    });
}


















function createTriggers(seed, buildings) {
    if (!buildings.length) return;

    const id = Math.floor((buildings.length - 1) * seed.unit());
    const shop = buildings[id];

    currentPlanet.triggers.push({
        zone: [...shop],
        id: seed.unitString(),
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

    playerShip.currentTrigger = envData.current.triggers.find(trigger => {
        let inside = false;

        for (let i = 0; i < trigger.zone.length; j = i++) {
            const x1 = trigger.zone[i].x1;
            const y1 = trigger.zone[i].y1;
            const x2 = trigger.zone[i].x2;
            const y2 = trigger.zone[i].y2;

            const intersect = ((y1 > playerShip.y) != (y2 > playerShip.y)) && (playerShip.x < (x2 - x1) * (playerShip.y - y1) / (y2 - y1) + x1);

            if (intersect) inside = !inside;
        }

        return inside;   
    });
}

function pushShips(planet) {
    const seed = new RNG(planet.seed);
    const shipsCount = Math.floor(seed.unit() * 10);

    planet.ships = [];

    for (let i = 0; i < shipsCount; i++) {
        planet.ships.push(createShip(true));
    }
}