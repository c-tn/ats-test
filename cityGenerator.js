let isDebug = true;
let log = false;

const triggerTypes = {
    shop: 0
}

const citySprites = {
    landing: null
}

/**
 * Create cities for planet
 * @param {object} planet 
 */
function createCities(planet) {
    const seed = new RNG('' || planet.seed);
    const maxCitiesCount = 4;

    const globalRect = createRect(
        -config.planetWidth / 2,
        -config.planetHeight / 2,
        config.planetWidth,
        config.planetHeight
    );

    planet.roads = [];
    planet.buildings = [];
    planet.triggers = [];
    planet.qtree = new QuadTree(globalRect, 8);

    for (let i = 0; i < maxCitiesCount; i++) {
        if (seed.unit() < 0.6) continue;

        const cityData = {
            id: seed.unitString(),
            name: `C-${ generateName(seed) }`,
        }

        const startX = i * (config.planetWidth / 4) - config.planetWidth / 2.5;
        const startY = seed.unit() * config.planetHeight / 1.5 - config.planetHeight / 3;
        const startAngle = Math.PI * 2 * seed.unit();
        const startSegment = {
            coords: [
                startX,
                startY,
                startX + cos(startAngle) * config.roadLength,
                startY + sin(startAngle) * config.roadLength
            ],
            padding: []
        }

        playerShip.x = startX;
        playerShip.y = startY;

        const segments = [];

        createPadding(startSegment, startAngle);
        segments.push(startSegment);

        generateSegments({
            prevSegment: startSegment,
            angle: startAngle,
            qtree: planet.qtree,
            segments,
            seed: new RNG(seed.unitString())
        });

        const buildings = [];
        createBuildingZone(segments, buildings);

        const shops = [];
        createTriggers(buildings, seed, shops, triggerTypes.shop);

        planet.cities.push(cityData);
        planet.roads.push(segments);
        planet.buildings.push(buildings);
        planet.triggers.push(...shops);
    }
}

function generateSegments({ prevSegment, angle, counter = 0, maxSegments = 50, maxLevels = 3, lvl = 0, crossCounter = 6, qtree, segments, seed }) {
    angle += config.angleOffset * seed.unit() * Math.PI / 180 - config.angleOffset * seed.unit() * Math.PI / 180;

    let nextSegment = {
        prevSegment,
        coords: [
            prevSegment.coords[2],
            prevSegment.coords[3],
            prevSegment.coords[2] + cos(angle) * config.roadLength,
            prevSegment.coords[3] + sin(angle) * config.roadLength
        ],
        padding: []
    }

    prevSegment.nextSegment = nextSegment;

    qtree.insert(createPoint(prevSegment.coords[2], prevSegment.coords[3], prevSegment));

    const selectCircle = createCircle(nextSegment.coords[0], nextSegment.coords[1], config.roadLength * 2.1);

    let selectedPoints = qtree.query(selectCircle);
    let prevSegments = getLastSegments(prevSegment, 4);

    selectedPoints = selectedPoints.filter(point => {
        const isException = prevSegments.find(segment => segment.coords[0] === point.x || segment.coords[2] === point.x);

        if (!isException) return point;
    });

    debugPoints = selectedPoints;

    if (selectedPoints.length > 2) {
        if (!prevSegment.prevSegment) return;

        let nearestPoint = 0;
        let minDist = Infinity;

        selectedPoints.forEach((point, i) => {
            const d = Math.sqrt((prevSegment.coords[3] - point.y)**2 + (prevSegment.coords[2] - point.x)**2);

            if (d < minDist) {
                minDist = d;
                nearestPoint = i;
            }
        });

        qtree.remove(createPoint(prevSegment.coords[2], prevSegment.coords[3]));
        
        prevSegment.coords[2] = selectedPoints[nearestPoint].x;
        prevSegment.coords[3] = selectedPoints[nearestPoint].y;

        const selectCircle = createCircle(prevSegment.coords[2], prevSegment.coords[3], 1);
        const crossSegment = qtree.query(selectCircle)[0].data;

        if (crossSegment) {
            crossSegment.cross = prevSegment;
            prevSegment.cross = crossSegment;
        }


        prevSegment.padding = prevSegment.padding ? prevSegment.padding : [];

        const newAngle = Math.atan2(prevSegment.coords[1] - selectedPoints[nearestPoint].y, prevSegment.coords[0] - selectedPoints[nearestPoint].x) + Math.PI;

        prevSegment.padding = [];
        createPadding(prevSegment, newAngle); 
        connectPaddings(prevSegment.prevSegment, prevSegment);

        const mainPaddings = prevSegment.padding;
        const nextPaddings = selectedPoints[nearestPoint].data.padding;
        const prevPaddings = selectedPoints[nearestPoint].data.prevSegment
            ? selectedPoints[nearestPoint].data.prevSegment.padding
            : selectedPoints[nearestPoint].data.padding;    
            
        const interData = cutPaddings(mainPaddings, prevPaddings, nextPaddings);
        
        mainPaddings[1] = [ interData.firstIntersect.x, interData.firstIntersect.y ];
        mainPaddings[2] = [ interData.secondInterset.x, interData.secondInterset.y ];

        return;
    }


    qtree.insert(createPoint(nextSegment.coords[2], nextSegment.coords[3], nextSegment));
    createPadding(nextSegment, angle);
    connectPaddings(prevSegment, nextSegment);

    nextSegment.prevSegment = prevSegment;

    segments.push(nextSegment);

    if (seed.unit() > 0.9 && lvl < maxLevels && counter > 0 && crossCounter < 0 && counter < maxSegments - 3) {
        const direction = seed.unit() > 0.5 ? 1 : -1;

        crossCounter = 6;

        prevSegment.cross = nextSegment;
        nextSegment.cross = prevSegment;

        splitSegment({
            prevSegment: nextSegment,
            angle: angle + Math.PI / 2 * direction,
            counter: 0,
            maxSegments: maxSegments / 2,
            lvl: lvl + 1,
            crossCounter: 6,
            direction,
            segments,
            qtree,
            seed
        });
    }

    if (counter < maxSegments) {
        generateSegments({
            prevSegment: nextSegment,
            angle,
            counter: counter + 1,
            maxSegments,
            lvl,
            crossCounter: crossCounter - 1,
            qtree,
            segments,
            seed
        });
    }
    else {
        prevSegment.isEnd = true;
    }
}

function splitSegment(data) {
    const coords = data.prevSegment.coords;

    let splitedSegment = {
        cross: data.prevSegment,
        coords: [
            coords[0],
            coords[1],
            coords[0] + cos(data.angle) * config.roadLength,
            coords[1] + sin(data.angle) * config.roadLength
        ],
        padding: []
    }

    createPadding(splitedSegment, data.angle);

    const splitedPaddings = splitedSegment.padding;
    const nextPaddings = data.prevSegment.prevSegment.padding;
    const prevPaddings = data.prevSegment.padding;

    const interData = cutPaddings(splitedPaddings, nextPaddings, prevPaddings, true, data.direction);

    splitedSegment.padding[0] = [ interData.firstIntersect.x, interData.firstIntersect.y ];
    splitedSegment.padding[3] = [ interData.secondInterset.x, interData.secondInterset.y ];

    data.segments.push(splitedSegment);

    generateSegments({ ...data, prevSegment: splitedSegment });
}

function cutPaddings(mainPaddings, nextPaddings, prevPaddings, isCutByDirection, direction) {
    const bottomLine = [ mainPaddings[0][0], mainPaddings[0][1], mainPaddings[1][0], mainPaddings[1][1] ];
    const topLine = [ mainPaddings[2][0], mainPaddings[2][1], mainPaddings[3][0], mainPaddings[3][1] ];
    
    let firstIntersect = null;
    let secondInterset = null;

    if (isCutByDirection) {
        const rightLine = direction === 1
            ? [ nextPaddings[0][0], nextPaddings[0][1], nextPaddings[1][0], nextPaddings[1][1] ]
            : [ nextPaddings[2][0], nextPaddings[2][1], nextPaddings[3][0], nextPaddings[3][1] ];
            
        const leftLine = direction === 1
            ? [ prevPaddings[0][0], prevPaddings[0][1], prevPaddings[1][0], prevPaddings[1][1] ]
            : [ prevPaddings[2][0], prevPaddings[2][1], prevPaddings[3][0], prevPaddings[3][1] ];

        firstIntersect = checkIntersects(bottomLine, rightLine);
        secondInterset = checkIntersects(topLine, leftLine);
    }
    else {
        for (let i = 0; i < 3; i += 2) {
            const l1 = [ nextPaddings[i][0], nextPaddings[i][1], nextPaddings[i + 1][0], nextPaddings[i + 1][1] ];
            const l2 = [ prevPaddings[i][0], prevPaddings[i][1], prevPaddings[i + 1][0], prevPaddings[i + 1][1] ];
    
            const bottomInterData = checkIntersects(bottomLine, l2);
            const topInterData = checkIntersects(topLine, l1);
    
            if (i === 0) {
                firstIntersect = bottomInterData;
                secondInterset = topInterData;
            }
            else {
                const x1 = mainPaddings[0][0];
                const y1 = mainPaddings[0][1];
    
                const d1 = Math.sqrt((x1 - firstIntersect.x)**2 + (y1 - firstIntersect.y)**2);
                const d2 = Math.sqrt((x1 - bottomInterData.x)**2 + (y1 - bottomInterData.y)**2);

                if (d2 < d1) {
                    firstIntersect = bottomInterData;
                    secondInterset = topInterData;
                }
            }
        }
    }

    return {
        firstIntersect,
        secondInterset
    }
}

function createPadding(segment, angle) {
    if (segment.padding.length) return;
    
    const coords = segment.coords;

    segment.padding = [
        [ cos(angle) - config.roadPadding * sin(angle) + coords[0], sin(angle) + config.roadPadding * cos(angle) + coords[1] ],
        [ cos(angle) - config.roadPadding * sin(angle) + coords[2], sin(angle) + config.roadPadding * cos(angle) + coords[3] ],
        [ cos(angle) + config.roadPadding * sin(angle) + coords[2], sin(angle) - config.roadPadding * cos(angle) + coords[3] ],
        [ cos(angle) + config.roadPadding * sin(angle) + coords[0], sin(angle) - config.roadPadding * cos(angle) + coords[1] ]
    ];
}

function connectPaddings(prevSegment, nextSegment) {
    const prevPaddings = prevSegment.padding ? prevSegment.padding : prevSegment;
    const nextPaddings = nextSegment.padding ? nextSegment.padding : nextSegment;

    for (let i = 0; i < 3; i += 2) {
        const prevLine = [ prevPaddings[i][0], prevPaddings[i][1], prevPaddings[i + 1][0], prevPaddings[i + 1][1] ];
        const nextLine = [ nextPaddings[i][0], nextPaddings[i][1], nextPaddings[i + 1][0], nextPaddings[i + 1][1] ];

        const interData = checkIntersects(prevLine, nextLine);

        if (i === 0) {
            prevPaddings[i + 1] = [ interData.x, interData.y ];
            nextPaddings[i + 0] = [ interData.x, interData.y ];
        }
        else {
            prevPaddings[i + 0] = [ interData.x, interData.y ];
            nextPaddings[i + 1] = [ interData.x, interData.y ];
        }
    }
}

function checkIntersects(l1, l2, isLineIntersects) {
    const x1 = l1[0];
    const x2 = l1[2];
    const x3 = l2[0];
    const x4 = l2[2];
    
    const y1 = l1[1];
    const y2 = l1[3];
    const y3 = l2[1];
    const y4 = l2[3];

    const m12 = (y2 - y1) / (x2 - x1);
    const m34 = (y4 - y3) / (x4 - x3);
    const m = m34 / m12;
    const x = (x1 - y1 / m12 - m * x3 + y3 / m12) / (1 - m);
    const y = m12 * (x - x1) + y1;

    const point = { x, y };

    if (isLineIntersects) {
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
            return point;
        }
    }
    else {
        return point;
    }
}

function getLastSegments(segment, count, segments = [], isCrossed) {
    for (let i = 0; i < count; i++) {
        segments.push(segment);

        if (segment.cross && !isCrossed) {
            getLastSegments(segment.cross, count, segments, true);
        }

        if (segment.prevSegment) {
            segment = segment.prevSegment;
        }
    }

    return segments;
}

function createBuildingZone(segments, buildings) {
    for (let i = 0; i < segments.length; i++) {
        const buildLength = Math.floor(seed.unit() * 4) + 1;
        const buildWidth = 300;
        const buildHeight = Math.floor(seed.unit() * 10) + 20;
        let counter = i;
        let build = [];
        let parallelWall = [];
        let isBreak = false;
        let angle = 0;
        let paddings = [];

        for (let j = i; j < i + buildLength; j++) {
            if (!segments[j] || segments[j].cross || segments[j].isEnd || !segments[j].nextSegment || segments[j].prevSegment && segments[j].prevSegment.cross) {
                isBreak = true;
                break;
            }

            paddings = segments[j].padding;
            angle = Math.atan2(paddings[1][1] - paddings[0][1], paddings[1][0] - paddings[0][0]) + Math.PI;

            build.push([ paddings[0][0], paddings[0][1] ]);
            build.push([ paddings[1][0], paddings[1][1] ]);

            parallelWall.push([ cos(angle) + buildWidth * sin(angle) + paddings[0][0], sin(angle) - buildWidth * cos(angle) + paddings[0][1] ]);

            counter = j;
        }

        if (!isBreak) {
            build.push([
                cos(angle) + buildWidth * sin(angle) + build[build.length - 1][0],
                sin(angle) - buildWidth * cos(angle) + build[build.length - 1][1]
            ]);
            build.push(...parallelWall.reverse());
            build.push([
                segments[i].padding[0][0], segments[i].padding[0][1]
            ]);
            build.height = buildHeight;
    
            buildings.push(build);
        }

        i = counter + 1;
    }
}


/**
 * Draw city roads
 */
function drawRoads() {
    if (envData.current.type !== envTypes.planet) return;

    setShadowsParam();

    if (isDebug) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#fff';
        ctx.fillStyle = 'rgba(255, 255, 255, .1)';
    }
    else {
        ctx.lineWidth = config.roadWidth;
        ctx.strokeStyle = lightStonePattern;
        ctx.fillStyle = lightStonePattern;
        ctx.lineCap = 'round';
        ctx.lineWidth = 1;
    }
    
    for (let j = 0; j < envData.current.roads.length; j++) {
        const roads = envData.current.roads[j];
        
        for (let i = 0; i < roads.length; i++) {
            const paddings = roads[i].padding;

            if (!paddings[0]) break;

            if (isDebug) {
                const coords = roads[i].coords;

                ctx.beginPath();
                ctx.moveTo(
                    coords[0] - camera.x + camera.width / 2,
                    coords[1] - camera.y + camera.height / 2
                );
                ctx.lineTo(
                    coords[2] - camera.x + camera.width / 2,
                    coords[3] - camera.y + camera.height / 2
                );
                ctx.stroke();
            }
            
            ctx.save();
            ctx.translate(
                paddings[0][0] - camera.x + camera.width / 2,
                paddings[0][1] - camera.y + camera.height / 2
            );

            ctx.beginPath();
            ctx.moveTo(0, 0);
            
            for (let k = 1; k < paddings.length; k++) {
                ctx.lineTo(
                    paddings[k][0] - paddings[0][0],
                    paddings[k][1] - paddings[0][1]
                );
            }

            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }
}

function drawBuildings() {
    if (envData.current.type !== envTypes.planet) return;
    
    setShadowsParam();
    ctx.lineWidth = 1;

    for (let i = 0; i < envData.current.buildings.length; i++) {
        const builds = envData.current.buildings[i];

        for (let j = 0; j < builds.length; j++) {
            const build = builds[j];

            ctx.fillStyle = '#444';
            ctx.strokeStyle = '#444';

            if (isDebug) {
                ctx.fillStyle = 'rgba(200, 0, 0, .1)';
                ctx.strokeStyle = '#c80000';
            }

            let prevAngle = Math.atan2(build[0][1] - playerShip.y, build[0][0] - playerShip.x) + Math.PI;
            let prevOffset = Math.sqrt((build[0][0] - playerShip.x)**2 + (build[0][1] - playerShip.y)**2) / build.height;

            ctx.save();
            ctx.translate(
                build[0][0] - camera.x + camera.width / 2 - cos(prevAngle) * prevOffset,
                build[0][1] - camera.y + camera.height / 2 - sin(prevAngle) * prevOffset
            );
            ctx.beginPath();

            for (let k = 1; k < build.length; k++) {
                let angle = Math.atan2(build[k][1] - playerShip.y, build[k][0] - playerShip.x) + Math.PI;
                let offset = Math.sqrt((build[k][0] - playerShip.x)**2 + (build[k][1] - playerShip.y)**2) / build.height;

                offset = offset < 0
                    ? Math.max(offset, -build.height * 2)
                    : Math.min(offset, build.height * 2);

                ctx.beginPath();
                ctx.moveTo(
                    build[k][0] - build[0][0],
                    build[k][1] - build[0][1]
                );
                ctx.lineTo(
                    build[k - 1][0] - build[0][0],
                    build[k - 1][1] - build[0][1]
                );
                ctx.lineTo(
                    build[k - 1][0] - build[0][0] + cos(prevAngle) * prevOffset,
                    build[k - 1][1] - build[0][1] + sin(prevAngle) * prevOffset
                );
                ctx.lineTo(
                    build[k][0] - build[0][0] + cos(angle) * offset,
                    build[k][1] - build[0][1] + sin(angle) * offset
                );

                ctx.fill();
                ctx.stroke();

                prevAngle = angle;
                prevOffset = offset;
            }

            ctx.restore();

            ctx.fillStyle = stonePattern;
            ctx.lineWidth = 0;

            ctx.save();
            ctx.translate(
                build[0][0] - camera.x + camera.width / 2 - cos(prevAngle) * prevOffset,
                build[0][1] - camera.y + camera.height / 2 - sin(prevAngle) * prevOffset
            );
            ctx.beginPath();

            for (let k = 0; k < build.length; k++) {
                ctx.lineTo(
                    build[k][0] - build[0][0],
                    build[k][1] - build[0][1]
                );
            }

            if (isDebug) {
                ctx.fillStyle = 'rgba(200, 0, 0, .1)';
                ctx.strokeStyle = '#c80000';
            }

            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
}


function drawTriggers() {
    for (let i = 0; i < envData.current.triggers.length; i++) {
        const trigger = envData.current.triggers[i];
        const pos = trigger.pos;
        const build = trigger.build;

        const angle = Math.atan2(build[0][1] - playerShip.y, build[0][0] - playerShip.x) + Math.PI;
        let offset = Math.sqrt((build[0][0] - playerShip.x)**2 + (build[0][1] - playerShip.y)**2) / build.height;

        offset = offset < 0
            ? Math.max(offset, -build.height * 2)
            : Math.min(offset, build.height * 2);

        ctx.save();
        ctx.translate(
            pos[0] - camera.x + camera.width / 2 - cos(angle) * offset,
            pos[1] - camera.y + camera.height / 2 - sin(angle) * offset
        );

        ctx.rotate(trigger.angle);

        ctx.drawImage(
            citySprites.landing,
            -citySprites.landing.width / 2,
            -citySprites.landing.height / 2
        );
        ctx.restore();
    }
}


















function createTriggers(buildings, seed, triggers, type) {
    if (!buildings.length) return;

    if (type === triggerTypes.shop) {
        createShopLandings(buildings, seed, triggers);
    }
}

function createShopLandings(buildings, seed, triggers) {
    const buildId = Math.floor((buildings.length - 1) * seed.unit());
    const id = seed.unitString();

    const p1 = buildings[buildId][0];
    const p2 = buildings[buildId][1];
    const d = Math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2);
    const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
    const w = citySprites.landing.width;
    const h = citySprites.landing.height;

    const landingsCount = ~~(d / w);

    buildings[buildId].items = [];

    for (let i = 0; i < landingsCount; i++) {
        const pos = [
            cos(angle + Math.PI / 2) * (h / 2) - (w * i + w / 2) * sin(angle - Math.PI / 2) + p1[0],
            sin(angle + Math.PI / 2) * (h / 2) + (w * i + w / 2) * cos(angle - Math.PI / 2) + p1[1]
        ];

        let shop = {
            type: triggerTypes.shop,
            id,
            pos,
            angle,
            owner: null,
            items: buildings[buildId].items,
            isOpen: false,
            build: buildings[buildId]
        };

        shop.action = () => {
            if (playerShip.currentSpeed !== 0 || shop.owner && shop.owner !== playerShip) return;

            if (!shop.isOpen) {
                playerShip.canControl = false;
                playerShip.currentAnimation = animationTypes.landingIn;
                shop.owner = playerShip;
                openShop(shop);
            }
            else {
                openShop(shop);
                playerShip.canControl = true;
                playerShip.currentAnimation = animationTypes.landingOut;
                shop.owner = null;
            }
        };

        triggers.push(shop);
    }
}

function openShop(shop) {
    shop.isOpen = !shop.isOpen;
    inventoryData.isOpen = shop.isOpen;
    inventoryData.inventoryOffsetY = inventoryData.height / 2;
    changeInventoryPrice();

    if (!shop.items.length) {
        createShopStuff(shop);
    }
}


function checkTriggers() {
    if (!envData.current.triggers) return;

    playerShip.currentTrigger = envData.current.triggers.find(trigger => {
        let inside = false;

        const d = Math.sqrt((playerShip.x - trigger.pos[0])**2 + (playerShip.y - trigger.pos[1])**2);

        if (d < citySprites.landing.width / 4) {
            inside = true;
        }
        // Check in rect
        // for (let i = 1; i < trigger.zone.length; j = i++) {
        //     const x1 = trigger.zone[i - 1][0];
        //     const y1 = trigger.zone[i - 1][1];
        //     const x2 = trigger.zone[i][0];
        //     const y2 = trigger.zone[i][1];

        //     const intersect = ((y1 > playerShip.y) != (y2 > playerShip.y)) && (playerShip.x < (x2 - x1) * (playerShip.y - y1) / (y2 - y1) + x1);

        //     if (intersect) inside = !inside;
        // }

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

function createLandings() {
    const sprite = generateSprite({
        hue: 0.1,
        seed: ' ',
        saturation: 0,
        isNoEdges: true,
        isNoSample: true,
        data: [
            1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 0, 0, 0, 0, 0, 0,
            1, 1, 0, 0, 0, 0, 0, 0, 0,
            1, 0, 0, 0, 0, 0, 0, 0, 0,
            1, 0, 0, 0, 0, 0, 0, 0, 0,
            1, 0, 0, 0, 0, 0, 0, 0, 0,
            1, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 1, 0, 0, 0, 0, 0, 1, 1,
            1, 1, 0, 0, 0, 0, 0, 1, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0,
            1, 0, 0, 0, 0, 0, 0, 0, 0,
            1, 0, 0, 0, 0, 0, 0, 0, 0,
            1, 1, 0, 0, 0, 0, 0, 0, 0,
            1, 1, 1, 0, 0, 0, 0, 0, 0,
            1, 1, 1, 1, 1, 1, 1, 1, 1,
        ]
    });

    let img = new Image();
    img.src = sprite.toDataURL();

    citySprites.landing = img;
}