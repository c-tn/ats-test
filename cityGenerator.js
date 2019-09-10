function createCities(planet) {
    const seed = new RNG(planet.seed);
    const citiesCount = 1 || Math.floor(seed.unit() * 2);

    for (let i = 0; i < citiesCount; i++) {
        const city = {
            id: seed.unitString(),
            name: `C-${ seed.unitString() }`,
            angleOffset: 25,
            angle: (25 * Math.random() * Math.PI / 180) - (25 * 2 * Math.random() * Math.PI / 180),
            segmentLength: 500,
            roads: []
        }

        generateRoads(city, 0, city.angle);

        planet.cities.push(city);
    }
}

/**
 * 
 * @param {object} planet 
 * @param {number} lvl 
 * @param {float} angle 
 * @param {object} lastSegment 
 * @param {number} maxSegments 
 * @param {number} currentSegmentsCount 
 * @param {boolean} isNew 
 */
function generateRoads(city, lvl = 0, angle, lastSegment, maxSegments = 20, currentSegmentsCount = 0, isNew) {
    if (!lastSegment) {
        lastSegment = {
            x1: 100,
            y1: canvas.height / 2,
            x2: 100 + Math.cos(angle) * city.segmentLength,
            y2: canvas.height / 2 + Math.sin(angle) * city.segmentLength
        }

        city.roads.push(lastSegment);
    }

    angle += (city.angleOffset * Math.random() * Math.PI / 180) - (city.angleOffset * Math.random() * Math.PI / 180);

    let newSegment = {
        x1: lastSegment.x2,
        y1: lastSegment.y2,
        x2: lastSegment.x2 + Math.cos(angle) * city.segmentLength,
        y2: lastSegment.y2 + Math.sin(angle) * city.segmentLength
    };

    checkIntersects(newSegment, city);

    if (!isNew && !newSegment.inter && Math.random() > 0.8 && lvl < 2) {
        let direction = Math.random() > 0.5
            ? 1
            : -1;

        generateRoads(city, lvl + 1, angle + 90 * Math.PI / 180 * direction, lastSegment, maxSegments, 5, true);
    }

    city.roads.push(newSegment);

    if (lvl <= 3 && currentSegmentsCount < maxSegments && !newSegment.inter) {
        generateRoads(city, lvl, angle, newSegment, maxSegments, currentSegmentsCount + 1);
    }
}

function checkIntersects(newSegment, city) {
    city.roads.forEach(segment => {
        if (
            newSegment === segment ||
            newSegment.x2 === segment.x1 ||
            newSegment.y2 === segment.y1 ||
            newSegment.x1 === segment.x2 ||
            newSegment.y1 === segment.y2
        ) return;

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
            newSegment.x2 = point.x;
            newSegment.y2 = point.y;
            newSegment.inter = point;
        }
    });
}

function drawRoads() {
    if (envData.current.name[0] !== 'P') return;
    
    ctx.strokeStyle = stonePattern;
    ctx.fillStyle = stonePattern;
    ctx.lineWidth = config.roadWidth;

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
                

                ctx.save();
                    ctx.beginPath();
                    ctx.arc(road.x2 - road.x1, road.y2 - road.y1, config.roadWidth / 2, 0, 2 * Math.PI);

                    ctx.fill();
                ctx.restore();
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

function drawBuildings() {
    if (envData.current.name[0] !== 'P') return;

    ctx.strokeStyle = stonePattern;
    ctx.fillStyle = lightStonePattern;
    ctx.lineWidth = 15;

    envData.current.buildings.forEach(build => {
        setShadowsParam(0, 0, 50, '#000');
        ctx.save();
            ctx.translate(
                build.x - camera.x + camera.width / 2,
                build.y - camera.y + camera.height / 2
            );

            ctx.rotate(build.angle);

            ctx.beginPath();

            ctx.rect(
                0,
                0,
                build.size,
                build.size
            );

            ctx.fill();

            if (build.text) {
                ctx.font = "30px sans-serif";
                ctx.fillStyle = '#500';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';

                ctx.fillText(build.text, build.size / 2, 15);
            }

            setShadowsParam(3, 3, 2, 'rgba(0, 0, 0, .7)');
            ctx.stroke();

        ctx.restore();
        setShadowsParam();
    });
    
    ctx.strokeStyle = '#000';
    ctx.fillStyle = 'rgba(100, 0, 0, .5)';
    ctx.lineWidth = 1;
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