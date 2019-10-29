let files = {
    loaded: 0,
    total: 0
}

let currentCtrl;
let messages = [];

function fileLoader(req) {
    files.total++;

    new Promise(req)
    .then(async () => {
        files.loaded++;

        if (files.loaded >= files.total) {
            const name = await setName();

            await startMultiplayer(name);

            currentCtrl = fpsCtrl(100, gameLoop);
        }
    });
}

function setName() {
    return new Promise(res => {
        focusedInput = {
            text: ''
        };

        let loginBtn = createRect(
            canvas.width / 2 - 100,
            canvas.height / 2 + 20,
            200,
            30
        );
    
        loginBtn.text = 'enter';
        loginBtn.action = () => {
            document.removeEventListener('keyup', redrawLoginWindow);
            uiItems = uiItems.filter(btn => btn !== loginBtn);
    
            res(focusedInput.text);

            focusedInput = null;
        }
    
        uiItems.push(loginBtn);

        redrawLoginWindow();

        document.addEventListener('keyup', redrawLoginWindow);
    });
}

function redrawLoginWindow() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#eee';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '20px sans-serif';

    ctx.fillText('Your name:', canvas.width / 2, canvas.height / 2 - 25);
    ctx.fillText(focusedInput.text, canvas.width / 2, canvas.height / 2);

    drawButtons();
}

let currentSystem = {
    x: seed.unit() * config.chunkSize,
    y: seed.unit() * config.chunkSize,
    name: `${ generateName(seed) }`,
    type: envTypes.system,
    seed: new RNG(seed.unitString()),
    isOpen: false,
    planets: {},
    triggers: []
};

const colorId = 0;
let currentPlanet = {
    x: 0,
    y: 0,
    r: 1 * 3000,
    size: config.minPlanetSize,
    currentSpeed: seed.unit() * 0.0001,
    currentAngle: seed.unit() * Math.PI * 2,
    timestamp: Date.now(),

    isOpen: true,
    type: envTypes.planet,
    name: generateName(seed),
    seed: seed.unitString(),
    color: textureColors[colorId],
    cities: [],
    triggers: [],
    ships: [],
    roads: [],
    buildings: []
};

function init() {
    setItemsInCategories();
    createSystemPlanets(currentSystem);
    createCrisisItem(currentSystem);

    createAnotherTexture();
    createLandings();

    envData.current = currentPlanet;
}

const arenaSize = 5000;
let shop = {};
let sprites = {};

function sendSocketData(type, data) {
    socket.send(JSON.stringify({
        type,
        data
    }));
}

function MP_firstConnect(data) {
    playerShip.id = data.id;

    delete playerShip.sprite;
    
    MP_createSprite(playerShip.id);
}

function MP_deadEvent(data) {
    playerShip.isDead = true;
    playerShip.hp = 0;
    playerShip.canControl = false;

    inventoryData.isOpen =  true;
    shop.isOpen = true;

    MP_showRespawnMenu();
}

function MP_createParticles(data) {
    if (data.type === 'hit') {
        if (data.target === playerShip.id) {
            playerShip.hp = data.hp;
        }

        createParticles({
            x: data.x,
            y: data.y,
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
    }
    else if (data.type === 'dead') {
        if (data.killer === playerShip.id) {
            playerShip.money += 200;
        }

        let targetName = '';
        let killerName = '';
    
        envData.current.ships.forEach(ship => {
            if (ship.id === data.target) {
                targetName = ship.name;
            }
            else if (ship.id === data.killer) {
                killerName = ship.name;
            }
        });
    
        messages.push({
            text: `${ targetName } killed by ${ killerName }`,
            x: canvas.width - 10,
            y: 10,
            textAlign: 'right',
            textBaseline: 'top',
            to: Date.now() + 4000
        });

        createParticles({
            x: data.x,
            y: data.y,
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
}

function MP_disconnect(id) {
    delete sprites[id];
}

function MP_createSprite(id) {
    const seed = new RNG(id);
    const maskId = ~~(seed.unit() * masks.length);

    sprites[id] = generateSprite({
        hue: seed.unit(),
        seed: seed.unitString(),
        saturation: seed.unit(),
        data: masks[maskId]
    });
}

window.onbeforeunload = () => {
    sendSocketData(socketMsgTypes.disconnect, playerShip.id);
}

function MP_updateGameData(message) {
    envData.current.ships = message.envData.ships.filter(ship => ship.id !== playerShip.id);
    bullets = message.envData.bullets;

    envData.current.ships.push(playerShip);
}

function getShipData(ship) {
    return {
        id: ship.id,
        hp: ship.hp,
        x: ship.x,
        y: ship.y,
        isDead: ship.isDead,
        currentAngle: ship.currentAngle,
        inventory: ship.inventory,
        currentSpeed: ship.currentSpeed,
        spriteSize: 1,
        money: ship.money,
        name: ship.name
    }
}

function drawUI() {
    ctx.fillStyle = '#aaa';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';

    ctx.fillText(`HP: ${ playerShip.hp }`, 0, canvas.height);

    messages = messages.filter(message => {
        ctx.textAlign = message.textAlign;
        ctx.textBaseline = message.textBaseline;

        if (message.to < Date.now()) {
            return;
        }

        ctx.fillText(message.text, message.x, message.y);

        return message;
    });
}

function multiplayerLoop() {
    drawUI();

    if (socket.readyState) {
        if (playerShip.isShoting) {
            sendSocketData(socketMsgTypes.shot, getShipData(playerShip));
        }
    
        sendSocketData(socketMsgTypes.updatePlayerData, getShipData(playerShip));
        sendSocketData(socketMsgTypes.updateGameData, '');
    }
}

async function startMultiplayer(name) {
    playerShip = createShip(seed);
    camera = {  
        x: playerShip.x,
        y: playerShip.y,
        width: canvas.width,
        height: canvas.height
    }

    playerShip.name = name;
    playerShip.money = 1000;
    playerShip.hp = 0;
    playerShip.isDead = true;
    playerShip.x = arenaSize * seed.unit();
    playerShip.y = arenaSize * seed.unit();
    playerShip.inventory = playerShip.inventory.map(cell => ({ ...cell, item: null }));
    
    envData.currentTexture = await createPlanetTexture(currentPlanet);

    socket = new WebSocket(`ws://${ location.hostname }:8082`);

    socket.onopen = () => {
        sendSocketData(socketMsgTypes.firstConnect, {
            ship: playerShip
        });
    }
    
    socket.onmessage = e => {
        const msg = JSON.parse(e.data);
    
        switch (msg.type) {
            case socketMsgTypes.firstConnect: MP_firstConnect(msg.data); break;
            case socketMsgTypes.updateGameData: MP_updateGameData(msg.data); break;
            case socketMsgTypes.createParticles: MP_createParticles(msg.data); break;
            case socketMsgTypes.dead: MP_deadEvent(msg.data); break;
            case socketMsgTypes.disconnect: MP_disconnect(msg.data); break;
            default: break;
        }
    }

    MP_showRespawnMenu();
}

function MP_showRespawnMenu() {
    const respawnBtn = createRect(
        canvas.width / 2 - 100,
        canvas.height - 50,
        200,
        50
    );

    respawnBtn.text = 'respawn';
    respawnBtn.action = () => {
        playerShip.isDead = false;
        playerShip.hp = 25;
        playerShip.canControl = true;

        inventoryData.isOpen = false;
        shop.isOpen = false;

        envData.current.ships.push(playerShip);

        uiItems = uiItems.filter(btn => btn !== respawnBtn);

        sendSocketData(socketMsgTypes.respawn, playerShip);
    }

    uiItems.push(respawnBtn);

    MP_createShop();
    MP_openTrade();
}

function MP_createShop() {
    shop = {
        id: seed.unitString(),
        inventory: [],
        isOpen: true
    }

    createShopStuff(shop);

    shop.inventory = shop.inventory.map(cell => ({ ...cell, item: null }));

    for (let i = 0; i < 10; i++) {
        const item = createItem(seed, itemTypes.weapon, 0);
        addItemToInventory(shop, item, slotTypes.shop);
    }
}

function MP_openTrade() {
    playerShip.tradeWith = shop;
    inventoryData.isOpen = true;
    inventoryData.hoveredCell = null;
    inventoryData.inventoryOffsetY = inventoryData.height / 2;
}

init();