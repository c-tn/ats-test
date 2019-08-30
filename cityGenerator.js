const buildings = [];
const roads = []
const triggers = []

function generateRoad() {
    const count = Math.floor(seed.unit() * 20) + 5; 
    const maxAngle = 50;

    roads.push({
        x1: 400,
        x2: 1000,
        y1: 350,
        y2: 350,
    });

    let angle = 0;

    for (let i = 0; i < count; i++) {
        const lastRoad = roads[i];
        const length = seed.unit() * 1000 + 400;
        const direction = seed.unit() > 0.5
            ? 1
            : -1;

        const buildSize = seed.unit() * 200 + 100;
        const offset = 100;

        buildings.push({
            id: seed.unit(),
            x: Math.cos(angle) - offset * Math.sin(angle) + lastRoad.x1,
            y: Math.sin(angle) + offset * Math.cos(angle) + lastRoad.y1,
            size: buildSize,
            angle
        });

        angle += (Math.floor(seed.unit() * maxAngle / 2) * Math.PI / 180) * direction;

        roads.push({
            x1: lastRoad.x2,
            y1: lastRoad.y2,
            x2: lastRoad.x2 + Math.cos(angle) * length,
            y2: lastRoad.y2 + Math.sin(angle) * length,
        });
    }

    createTriggers();
}

function createTriggers() {
    const id = 0 //Math.floor(buildings.length * seed.unit());
    const shop = buildings[id];

    shop.text = 'shop';

    triggers.push({
        x: shop.x,
        y: shop.y,
        id: shop.id,
        size: shop.size,
        action() {
            shopData.isOpen = !shopData.isOpen;
            inventoryData.isOpen = shopData.isOpen;
            inventoryData.inventoryOffsetY = shopData.height / 2

            if (!shopData.cells.length) {
                createShopStuff(this.id);
            }
        }
    });
}

generateRoad();

function drawBuildings() {
    ctx.strokeStyle = stonePattern;
    ctx.fillStyle = lightStonePattern;
    ctx.lineWidth = 15;

    buildings.forEach(build => {
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
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stonePattern;
    ctx.lineWidth = 150;

    ctx.beginPath();
    ctx.moveTo(
        roads[0].x1 - camera.x + camera.width / 2,
        roads[0].y1 - camera.y + camera.height / 2
    );

    roads.forEach(road => {
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
    playerShip.currentTrigger = triggers.find(trigger =>
        playerShip.x > trigger.x &&
        playerShip.x < trigger.x + trigger.size &&
        playerShip.y > trigger.y &&
        playerShip.y < trigger.y + trigger.size
    );
}