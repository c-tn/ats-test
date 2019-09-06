function generateRoad(planet) {
    const seed = new RNG(planet.seed);
    const count = Math.floor(seed.unit() * 20) + 5; 
    const maxAngle = 50;

    let angle = Math.PI * 2 * seed.unit();

    let startX1 = canvas.width * seed.unit();
    let startY1 = canvas.height * seed.unit();
    let startLength = seed.unit() * 1000 + 400;

    planet.roads = [];
    planet.buildings = [];
    planet.triggers = [];

    planet.roads.push({
        x1: startX1,
        x2: startX1 + Math.cos(angle) * startLength,
        y1: startY1,
        y2: startY1 + Math.sin(angle) * startLength
    });

    for (let i = 0; i < count; i++) {
        const lastRoad = planet.roads[i];
        const length = seed.unit() * 1000 + 400;
        const direction = seed.unit() > 0.5
            ? 1
            : -1;

        const buildSize = seed.unit() * 200 + 100;
        const offset = 100;

        planet.buildings.push({
            id: seed.unit(),
            x: Math.cos(angle) - offset * Math.sin(angle) + lastRoad.x1,
            y: Math.sin(angle) + offset * Math.cos(angle) + lastRoad.y1,
            size: buildSize,
            angle
        });

        angle += (Math.floor(seed.unit() * maxAngle / 2) * Math.PI / 180) * direction;

        planet.roads.push({
            x1: lastRoad.x2,
            y1: lastRoad.y2,
            x2: lastRoad.x2 + Math.cos(angle) * length,
            y2: lastRoad.y2 + Math.sin(angle) * length,
        });
    }

    createTriggers();
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

function drawRoads() {
    if (envData.current.name[0] !== 'P') return;
    
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stonePattern;
    ctx.lineWidth = 150;

    ctx.beginPath();
    ctx.moveTo(
        envData.current.roads[0].x1 - camera.x + camera.width / 2,
        envData.current.roads[0].y1 - camera.y + camera.height / 2
    );

    envData.current.roads.forEach(road => {
        ctx.save();

            ctx.translate(
                road.x2 - camera.x + camera.width / 2,
                road.y2 - camera.y + camera.height / 2
            );

            ctx.lineTo(0, 0);

            ctx.stroke();
        ctx.restore();
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