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
            angleOffset: 25,
            angle: (25 * seed.unit() * Math.PI / 180) - (25 * 2 * seed.unit() * Math.PI / 180),
            segmentLength: 500,
            roads: [],
            builds: []
        }

        generateRoads(city, 0, city.angle);

        for (let i = 0; i < city.roads.length; i++) {
            const road = city.roads[i];

            generateBuildsArea(road, city);
        }


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
            y2: 0 + Math.sin(angle) * city.segmentLength,
            angle
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

    const interData = checkIntersects(newSegment, city.roads);
    const tailsData = checkTails(newSegment, city.roads);

    if (interData) {
        newSegment.x2 = interData.x;
        newSegment.y2 = interData.y;
    }

    if (tailsData) {
        newSegment.x2 = tailsData.x;
        newSegment.y2 = tailsData.y;
    }

    if (currentSegmentsCount > 10 && !interData && city.seed.unit() > 0.7 && lvl < 2) {
        let direction = city.seed.unit() > 0.5
            ? 1
            : -1;

        generateRoads(city, lvl + 1, angle + 90 * Math.PI / 180 * direction, lastSegment, maxSegments, 0);
    }

    city.roads.push(newSegment);

    if (lvl <= 2 && currentSegmentsCount < maxSegments && !interData) {
        generateRoads(city, lvl, angle, newSegment, maxSegments, currentSegmentsCount + 1);
    }
}

/**
 * Generate build for segment
 * @param {object} segment 
 * @param {object} city 
 * @param {float} angle 
 */
function generateBuildsArea(segment, city) {
    let res = filterByCoords(segment, city.roads);

    if (res.length > 3) return;

    const angle = Math.atan2(segment.y2 - segment.y1, segment.x2 - segment.x1) + Math.PI;
    const dir = city.seed.unit() > 0.5 ? 1 : -1;
    const width = city.seed.unit() * config.roadWidth * 2 + config.roadWidth;

    let data = [];

    let l1 = {
        x1: Math.cos(angle) - (config.roadWidth / 2 * dir) * Math.sin(angle) + segment.x1,
        y1: Math.sin(angle) + (config.roadWidth / 2 * dir) * Math.cos(angle) + segment.y1,
        x2: Math.cos(angle) - (config.roadWidth / 2 * dir) * Math.sin(angle) + segment.x2,
        y2: Math.sin(angle) + (config.roadWidth / 2 * dir) * Math.cos(angle) + segment.y2
    }

    let isIntersect = checkBuildIntersects(l1, city);
    if (isIntersect) return;

    let l2 = {
        x1: l1.x2,
        y1: l1.y2,
        x2: Math.cos(angle + Math.PI) * dir + width * Math.sin(angle + Math.PI) * dir + segment.x2,
        y2: Math.sin(angle + Math.PI) * dir - width * Math.cos(angle + Math.PI) * dir + segment.y2
    }

    isIntersect = checkBuildIntersects(l2, city);
    if (isIntersect) return;

    let l3 = {
        x1: l2.x2,
        y1: l2.y2,
        x2: Math.cos(angle + Math.PI) * dir + width * Math.sin(angle + Math.PI) * dir + segment.x1,
        y2: Math.sin(angle + Math.PI) * dir - width * Math.cos(angle + Math.PI) * dir + segment.y1
    }

    isIntersect = checkBuildIntersects(l3, city);
    if (isIntersect) return;

    let l4 = {
        x1: l3.x2,
        y1: l3.y2,
        x2: l1.x1,
        y2: l1.y1
    }

    isIntersect = checkBuildIntersects(l4, city);
    if (isIntersect) return;

    data.push(l1);
    data.push(l2);
    data.push(l3);
    data.push(l4);

    city.builds.push(data);
}

function checkBuildIntersects(segment, city) {
    const roadInterData = checkIntersects(segment, city.roads);
    const roadTailsData = checkTails(segment, city.roads, 0.2);

    if (roadInterData || roadTailsData) return true;
}

/**
 * check the segment for intersection 
 * @param {object} newSegment 
 * @param {object} city 
 */
function checkIntersects(newSegment, data) {
    for (let i = 0; i < data.length; i++) {
        let segment = data[i];

        if (
            newSegment === segment ||
            newSegment.x2 === segment.x1 ||
            newSegment.y2 === segment.y1 ||
            newSegment.x1 === segment.x2 ||
            newSegment.y1 === segment.y2
        ) break;

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
                return {
                    x: segment.x2,
                    y: segment.y2,
                }
            }
            else {
                return {
                    x: segment.x1,
                    y: segment.y1,
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
    return data.filter(iteration =>
        segment.x1 === iteration.x1 ||
        segment.x1 === iteration.x2 ||
        segment.x2 === iteration.x1 ||
        segment.x2 === itemTypes.x2 ||
        
        segment.y1 === iteration.y1 ||
        segment.y1 === iteration.y2 ||
        segment.y2 === iteration.y1 ||
        segment.y2 === itemTypes.y2
    );
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
    ctx.fillStyle = lightStonePattern;

    envData.current.cities.forEach(city => {
        city.builds.forEach(build => {
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
                    build[1].x1 - build[0].x1,
                    build[1].y1 - build[0].y1
                );
                ctx.lineTo(
                    build[1].x2 - build[0].x1,
                    build[1].y2 - build[0].y1
                );
                ctx.lineTo(
                    build[2].x1 - build[0].x1,
                    build[2].y1 - build[0].y1
                );
                ctx.lineTo(
                    build[2].x2 - build[0].x1,
                    build[2].y2 - build[0].y1
                );

                ctx.closePath();
                ctx.fill();
                // ctx.stroke();
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