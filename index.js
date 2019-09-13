function generateSprite({
    hue = 0.5,
    saturation = 0.5,
    width = 9,
    height = 16,
    data,
    seed
} = {}) {
    let generatedMask = new Mask({
        data,
        width,
        height,
        isMirrorX: true
    });

    let sprite = new Sprite(generatedMask, {
        hue,
        saturation,
        seed,
        isColored: true
    });

    let resizedSprite = sprite.resize(sprite.canvas, 5);

    return resizedSprite;
}

function fpsCtrl(fps, callback) {
    const second = 1000;

    let delay = second / fps;
    let time = null;
    let frame = -1;

    function loop(timestamp) {
        if (time === null) {
            time = timestamp;
        }

        const seg = Math.floor((timestamp - time) / delay);

        if (seg > frame) {
            frame = seg;
            callback();
        }

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    function setMaxFPS(fps) {
        delay = second / fps;
    }

    return {
        setMaxFPS,
        selectedFPS: fps
    }
}

const canvas = document.getElementById('canvas');
canvas.width = 1280;
canvas.height = 720;

const ctx = canvas.getContext('2d');

let envData = {
    chunks: {},
    current: {},
};
let bullets = [];

const itemTypes = {
    weapon: 'weapon',
    another: 'another'
}

const slotTypes = {
    weapons: 'weapons',
    inventory: 'inventory',
    shop: 'shop'
}

function createShip(isRandom) {
    const seedNum = seed.unit();
    const seedStr = seedNum.toString(36).substr(2);

    let ship = {
        id: seedNum,
        sprite: null,
        x: isRandom ? config.planetWidth * seed.unit() - config.planetWidth / 2 : 0,
        y: isRandom ? config.planetHeight * seed.unit() - config.planetHeight / 2 : 0,
        currentAngle: 0,
        rotateSpeed: 0.05,
        currentSpeed: 0,
        maxSpeed: 20,
        velocity: 0.1,
        hp: 100,
        money: 100,

        inventory: [],

        currentTrigger: null,

        canControl: true,
        isSlowDown: false,
        isShoting: false,
        isForward: false,
        isBackward: false,
        isLeftRotate: false,
        isRightRotate: false
    }

    ship.sprite = generateSprite({
        hue: seedNum,
        seed: seedStr,
        saturation: seedNum
    });

    createInventory(ship);
    
    return ship;
}

let playerShip = null;
let camera = null;

async function init() {
    playerShip = createShip();
    camera = {
        x: playerShip.x,
        y: playerShip.y,
        width: canvas.width,
        height: canvas.height
    }
    
    envData.currentTexture = await createPlanetTexture(currentPlanet);

    pushShips(currentPlanet);
    createCities(currentPlanet);

    currentPlanet.ships.push(playerShip);
}

const seedValue = Math.random().toString(36).substr(2);
const seed = new RNG(seedValue);

// FPS
let fpsData = {
    wrapper: document.getElementById('fps__value'),
    timeStamp: 0,
    currentFrames: 0,
    totalFrames: 0,
    warnings: 0,
    maxWarnings: 3
}

const second = 1000;

function showFPS() {
    const now = performance.now();

    if (now - fpsData.timeStamp > second) {
        fpsData.totalFrames = fpsData.currentFrames;

        fpsData.timeStamp = now;

        fpsData.currentFrames = 0;

        if (currentCtrl.selectedFPS < fpsData.totalFrames) {
            fpsData.warnings++;

            if (fpsData.warnings > fpsData.maxWarnings) {
                currentCtrl.setMaxFPS(30);
            }
        }
        else {
            fpsData.warnings -= fpsData.warnings > 0
                ? 1
                : 0;
        }
    }

    fpsData.currentFrames++;

    fpsData.wrapper.innerText = fpsData.totalFrames;
}

function setShadowsParam(offsetX, offsetY, blur, color) {
    ctx.shadowOffsetX = offsetX || 0;
    ctx.shadowOffsetY = offsetY || 0;
    ctx.shadowBlur = blur || 0;
    ctx.shadowColor = color || 'rgba(0, 0, 0, 0)';
}

// UPDATING
const imageAngle = 90 * Math.PI / 180;

function drawShips() {
    if (envData.current.name[0] === 'P') {
        setShadowsParam(40, 20, 3, 'rgba(0, 0, 0, .3)');
    }
    
    envData.current.ships = envData.current.ships.filter(ship => {
        ctx.save();
            ctx.translate(
                ship.x - camera.x + camera.width / 2,
                ship.y - camera.y + camera.height / 2
            );

            ctx.rotate(ship.currentAngle + imageAngle);

            ctx.drawImage(
                ship.sprite,
                -ship.sprite.width / 2,
                -ship.sprite.height / 2,
            );
        ctx.restore();

        if (ship.hp > 0) {
            return ship;
        }
        else {
            createParticles({
                x: ship.x,
                y: ship.y,
                size: 20,
                force: 15,
                count: 400,
                cb() {
                    const colors = [
                        'rgba(255, 125, 0, .2)',
                        'rgba(255, 200, 0, .4)',
                        'rgba(150, 150, 150, .6)'
                    ];
                    
                    if (this.size > this.initSize * 0.8) {
                        this.color = colors[0];
                    }
                    else if (this.size > this.initSize * 0.5) {
                        this.color = colors[1];
                    }
                    else {
                        this.color = colors[2];
                    }
                }
            });
        }
    });

    setShadowsParam();
}

function drawParticles() {
	particlesStorage = particlesStorage.filter(data => {
		data.particles = data.particles.filter(p => {
			data.cb.apply(p);
			p.update();
			p.render();
			
			if (p.size > 0) return p;
		});
		
		if (data.particles.length) {
			return data;
		}
    });
}

const maxAngle = 360 * Math.PI / 180;

function updateShip() {
    envData.current.ships.forEach(ship => {
        if (ship.isForward && !ship.isSlowDown) {
            ship.currentSpeed += ship.velocity;

            if (ship.currentSpeed > ship.maxSpeed) {
                ship.currentSpeed = ship.maxSpeed;
            }
        }
        
        if (ship.isBackward && !ship.isSlowDown) {
            ship.currentSpeed -= ship.velocity;

            if (ship.currentSpeed < -ship.maxSpeed) {
                ship.currentSpeed = -ship.maxSpeed;
            }
        }

        if (ship.isSlowDown) {
            if (ship.currentSpeed > 0) {
                ship.currentSpeed -= ship.velocity;

                if (ship.currentSpeed < 0) {
                    ship.currentSpeed = 0;
                }
            }
            else {
                ship.currentSpeed += ship.velocity;

                if (ship.currentSpeed > 0) {
                    ship.currentSpeed = 0;
                }
            }
        }

        if (ship.isLeftRotate) {
            ship.currentAngle -= ship.rotateSpeed;

            if (ship.currentAngle < 0) {
                ship.currentAngle = maxAngle + ship.currentAngle;
            }
        }

        if (ship.isRightRotate) {
            ship.currentAngle += ship.rotateSpeed;

            if (ship.currentAngle > maxAngle) {
                ship.currentAngle = ship.currentAngle - maxAngle;
            }
        }

        if (ship.isShoting) {
            const now = performance.now();

            ship.inventory.forEach((cell, i) => {
                if (!cell.item || cell.type !== slotTypes.weapons) return;

                
                if (now - cell.item.lastShot > cell.item.stats.reload) {
                    createBullet({
                        x: Math.cos(ship.currentAngle) - (i * -18 + 35) * Math.sin(ship.currentAngle) + ship.x,
                        y: Math.sin(ship.currentAngle) + (i * -18 + 35) * Math.cos(ship.currentAngle) + ship.y,
                        currentAngle: ship.currentAngle,
                        ownerId: ship.id,
                        damage: cell.item.stats.damage
                    });
    
                    cell.item.lastShot = now;
                }
            });
        }        

        ship.x += Math.cos(ship.currentAngle) * ship.currentSpeed;
        ship.y += Math.sin(ship.currentAngle) * ship.currentSpeed;
    });
}

function updateCameraData() {
    camera.x = playerShip.x;
    camera.y = playerShip.y;
}

function createBullet({ x, y, currentAngle, ownerId, damage }) {
    bullets.push({
        x,
        y,
        ownerId,
        currentAngle,
        damage,
        currentSpeed: 40,
        createdTime: performance.now(),
        lifeTime: 2000
    });
}
               
function drawBullets() {
    setShadowsParam();
    
    bullets = bullets.filter(bullet => {
        ctx.fillStyle = '#900';

        bullet.x += Math.cos(bullet.currentAngle) * bullet.currentSpeed;
        bullet.y += Math.sin(bullet.currentAngle) * bullet.currentSpeed;

        ctx.save();
            ctx.translate(
                bullet.x - camera.x + camera.width / 2,
                bullet.y - camera.y + camera.height / 2
            );

            ctx.rotate(bullet.currentAngle);

            ctx.fillRect(-25, 0, 50, 2);
        ctx.restore();
        
        const collideWith = envData.current.ships.find(ship =>
            bullet.x > ship.x - ship.sprite.width / 2 &&
            bullet.x < ship.x + ship.sprite.width / 2 &&
            bullet.y > ship.y - ship.sprite.height / 2 &&
            bullet.y < ship.y + ship.sprite.height / 2 &&
            ship.id !== bullet.ownerId
        );

        if (collideWith) {
            createParticles({
                x: bullet.x,
                y: bullet.y,
                size: 10,
                force: 5,
                count: 50,
                cb() {
                    const colors = [
                        'rgba(255, 125, 0, .2)',
                        'rgba(255, 200, 0, .4)',
                        'rgba(150, 150, 150, .6)'
                    ];
                    
                    if (this.size > this.initSize * 0.8) {
                        this.color = colors[0];
                    }
                    else if (this.size > this.initSize * 0.5) {
                        this.color = colors[1];
                    }
                    else {
                        this.color = colors[2];
                    }
                }
            });

            collideWith.hp -= bullet.damage;
        }

        const now = performance.now();

        if (now - bullet.createdTime < bullet.lifeTime && !collideWith) {
            return bullet;
        }
    });
}

ctx.textBaseline = 'top';
ctx.textAlign = 'center';

// LOOP
function gameLoop() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateShip();
    updateCameraData();
    checkTriggers();

    drawLandscape();
    drawRoads();
    drawBuildings();
    drawPlanets();
    drawBullets();
    drawShips();
    drawParticles();

    drawShop();
    drawMap();
    drawInventory();

    showModal();

    showFPS();
}

function popPlayerShip() {
    envData.current.ships = envData.current.ships.filter(
        ship => ship.id !== playerShip.id
    );
}

function wheelActions(wheelDelta) {
    if (mapData.isOpen && wheelDelta < -5) {
        zoomOutMap();
    }
    else if (mapData.isOpen && wheelDelta > 5) {
        zoomInMap();
    }
    else if (currentPlanet && wheelDelta < -5) {
        leavePlanet();
    }
    else if (!currentPlanet && wheelDelta > 5) {
        enterPlanet();
    }
}

/**
 * Get to the planet
 */
async function enterPlanet() {
    const findedPlanet = Object.values(currentSystem.planets).find(planet => {
        if (planet.name[0] === 'V') return;

        const centerX = planet.x;
        const centerY = planet.y;

        const dx = (playerShip.x - centerX) ** 2;
        const dy = (playerShip.y - centerY) ** 2;

        return Math.sqrt(dx + dy) < planet.size;
    });

    if (!findedPlanet) return;

    popPlayerShip();

    envData.currentTexture = await createPlanetTexture(findedPlanet);

    currentPlanet = findedPlanet;
    envData.current = currentPlanet;

    playerShip.x = 0;
    playerShip.y = 0;

    if (!currentPlanet.ships) {
        pushShips(currentPlanet);
        createCities(currentPlanet);
    }

    currentPlanet.ships.push(playerShip);

    mapData.mapType = mapTypes.planet;
}

/**
 * Leave the planet
 */
function leavePlanet() {
    popPlayerShip();

    envData.current = currentSystem;

    playerShip.x = currentPlanet.x;
    playerShip.y = currentPlanet.y;

    if (!currentSystem.ships) {
        currentSystem.ships = [];
    }

    currentSystem.ships.push(playerShip);

    currentPlanet = null;

    mapData.mapType = mapTypes.system;
}

// CTRL
const buttons = {
    wrapper: document.getElementById('controls'),
    forward: document.getElementById('forward'),
    backward: document.getElementById('backward'),
    leftward: document.getElementById('leftward'),
    rightward: document.getElementById('rightward'),
    shot: document.getElementById('shot')
}

const keys = {
    q: 81,
    w: 87,
    e: 69,
    i: 73,
    a: 65,
    s: 83,
    d: 68,
    m: 77,
    space: 32
}

function useTrigger() {
    playerShip.currentTrigger && playerShip.currentTrigger.action();
}

function changeShipState(ship, prop, value) {
    if (!playerShip.canControl || !ship[prop] === undefined) return;

    ship[prop] = value;
}

function handleKey(e) {
    const value = e.type === 'keydown'
        ? true
        : false;

    switch(e.which) {
        case keys.q:
            changeShipState(playerShip, 'isSlowDown', value);
            break;

        case keys.w:
            changeShipState(playerShip, 'isForward', value);
            changeShipState(playerShip, 'isSlowDown', false);
            break;

        case keys.e:
            e.type === 'keyup'
                ? useTrigger()
                : null;
            break;

        case keys.i:
            inventoryData.isOpen = e.type === 'keyup'
                ? !inventoryData.isOpen
                : inventoryData.isOpen;

            if (playerShip.currentTrigger && playerShip.currentTrigger.isOpen) {
                playerShip.currentTrigger.isOpen = false;
                inventoryData.isOpen = false;
            }

            inventoryData.draggedCell = null;
            inventoryData.hoveredCell = null;
            inventoryData.inventoryOffsetY = 0;

            break;

        case keys.s:
            changeShipState(playerShip, 'isBackward', value);
            changeShipState(playerShip, 'isSlowDown', false);
            break;

        case keys.a:
            changeShipState(playerShip, 'isLeftRotate', value);
            break;

        case keys.d:
            changeShipState(playerShip, 'isRightRotate', value);
            break;

        case keys.m:
            mapData.isOpen = e.type === 'keyup'
                ? !mapData.isOpen
                : mapData.isOpen;

            modalData.isVisible = false;
            break;

        case keys.space:
            changeShipState(playerShip, 'isShoting', value);
            break;

        default:
            break;
    }
}

let timer = null;
let wheelDelta = 0;

function handleWheel({ wheelDeltaY }) {
    if (wheelDeltaY > 0) {
        wheelDelta++;
    }
    else {
        wheelDelta--;
    }

    timer = setTimeout(() => {
        wheelActions(wheelDelta);

        wheelDelta = 0;

        clearTimeout(timer);
    }, 300);
}

document.addEventListener('keydown', handleKey);
document.addEventListener('keyup', handleKey);
document.addEventListener('wheel', handleWheel);

function handleTargetButton(e) {
    const value = e.type === 'touchstart'
        ? true
        : false;

    switch(e.target) {
        case buttons.forward:
            changeShipState(playerShip, 'isForward', value);
            break;

        case buttons.backward:
            changeShipState(playerShip, 'isBackward', value);
            break;

        case buttons.leftward:
            changeShipState(playerShip, 'isLeftRotate', value);
            break;

        case buttons.rightward:
            changeShipState(playerShip, 'isRightRotate', value);
            break;

        case buttons.shot:
            changeShipState(playerShip, 'isShoting', value);
            break;

        default:
            break;
    }
}

buttons.wrapper.addEventListener('touchstart', handleTargetButton);
buttons.wrapper.addEventListener('touchend', handleTargetButton);

let modalData = {
    isVisible: false,
    x: 0,
    y: 0,
    text: '',
    halfOffsetX: 50,
    halfOffsetY: 10
}

/**
 * Show modal
 */
function showModal() {
    if (!modalData.isVisible) return;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255, 255, 255, .3)';
    ctx.font = "20px sans-serif";

    const rectWidth = ctx.measureText(modalData.text).width + modalData.halfOffsetX * 2;

    ctx.fillRect(
        modalData.x,
        modalData.y,
        rectWidth,
        100
    );

    ctx.fillStyle = '#000';
    ctx.fillText(
        modalData.text,
        modalData.x + rectWidth - rectWidth / 2,
        modalData.y + modalData.halfOffsetY
    );
}

function tp({ x, y }) {
    playerShip.x = x;
    playerShip.y = y;
    playerShip.currentSpeed = 0;
}