const express = require('express');
const WebSocket = new require('ws');
const socketMsgTypes = require('./client/socketMsgTypes');

const app = express();

app.use(express.static(__dirname + '/client'));

app.get('/', singleplayer);
app.get('/singleplayer', singleplayer);
app.get('/multiplayer', multiplayer);

function singleplayer(req, res) {
    res.sendFile(__dirname + '/client/singleplayer.html');
}

function multiplayer(req, res) {
    res.sendFile(__dirname + '/client/multiplayer.html');
}

app.listen(8081, () => {
    console.log('started on 8081');
});

let ws = new WebSocket.Server({
    port: 8082
});

let clients = {};
let envData = {
    ships: [],
    bullets: []
};

ws.on('connection', ws => {
    const id = (Math.random() * Math.random()).toString(36).substr(2);
    clients[id] = ws;
    ws.userId = id;

    ws.on('close', () => {
        delete clients[ws.userId];
    });

    ws.on('message', msg => handleMessage(msg, ws));
});

function handleMessage(message, ws) {
    const msg = JSON.parse(message);

    switch (msg.type) {
        case socketMsgTypes.firstConnect: firstConnect(msg, ws); break;
        case socketMsgTypes.updateGameData: sendEnvData(ws); break;
        case socketMsgTypes.updatePlayerData: updatePlayerData(msg.data); break;
        case socketMsgTypes.respawn: respawnShip(msg.data); break;
        case socketMsgTypes.shot: createBullet(msg.data); break;
        case socketMsgTypes.disconnect: disconnectUser(msg.data); break;
        case socketMsgTypes.log: log(); break;
        default: break;
    }
}

function sendEnvData(ws) {
    sendSocketData(ws, socketMsgTypes.updateGameData, {
        id: ws.userId,
        envData
    });
}

function updatePlayerData(data) {
    envData.ships = envData.ships.map(ship => {
        if (ship.id === data.id) {
            return {
                ...data,
                hp: ship.hp
            };
        }

        return ship;
    })
}

function createBullet(data) {
    envData.ships.forEach(ship => {
        const now = Date.now();
        const id = data.id;

        if (ship.id !== id) return;

        ship.inventory.forEach((cell, i) => {
            if (!cell.item || cell.type !== 'weapons') return;

            if (now - cell.item.lastShot > cell.item.stats.reload) {
                envData.bullets.push({
                    x: Math.cos(ship.currentAngle) - (i * -18 + 35) * Math.sin(ship.currentAngle) + ship.x,
                    y: Math.sin(ship.currentAngle) + (i * -18 + 35) * Math.cos(ship.currentAngle) + ship.y,
                    currentAngle: ship.currentAngle,
                    createdTime: now,
                    currentSpeed: 40,
                    lifeTime: 2000,
                    ownerId: ship.id,
                    damage: cell.item.stats.damage
                });
            }
        });
    });
}

function disconnectUser(id) {
    envData.ships = envData.ships.filter(ship => ship.id !== id);

    sendSocketDataForAll(socketMsgTypes.disconnect, id)
}

function sendSocketDataForAll(type, data) {
    Object.values(clients).forEach(client => {
        sendSocketData(client, type, data);
    });
}

function respawnShip(data) {
    envData.ships.push(data);
}

function deadShip(id) {
    envData.ships = envData.ships.filter(ship => ship.id !== id);
}

function firstConnect(msg, ws) {
    msg.data.ship.id = ws.userId;

    sendSocketData(ws, socketMsgTypes.firstConnect, {
        id: ws.userId,
        envData
    });
}

function sendSocketData(ws, type, data) {
    ws.send(JSON.stringify({
        type,
        data
    }));
}

function log() {
    console.log(envData.ships.length);

    envData.ships.forEach(ship => console.log(ship.hp))
}

function updateLoop() {
    updateBullets();

    setTimeout(updateLoop, 1000 / 60);
}

function updateBullets() {
    envData.bullets = envData.bullets.filter(bullet => {
        bullet.x += Math.cos(bullet.currentAngle) * bullet.currentSpeed;
        bullet.y += Math.sin(bullet.currentAngle) * bullet.currentSpeed;
        
        const collideWith = envData.ships.find(ship => {
            return bullet.x > ship.x - 45 &&
                bullet.x < ship.x + 45 &&
                bullet.y > ship.y - 40 &&
                bullet.y < ship.y + 40 &&
                !ship.isLanding &&
                ship.id !== bullet.ownerId &&
                !ship.isDead
        });

        if (collideWith) {
            collideWith.hp -= bullet.damage;

            if (collideWith.hp > 0) {
                sendSocketDataForAll(socketMsgTypes.createParticles, {
                    x: bullet.x,
                    y: bullet.y,
                    type: 'hit',
                    target: collideWith.id,
                    hp: collideWith.hp
                });
            }
            else {
                deadShip(collideWith.id);
                sendSocketDataForAll(socketMsgTypes.createParticles, {
                    x: bullet.x,
                    y: bullet.y,
                    type: 'dead',
                    target: collideWith.id,
                    killer: bullet.ownerId
                });
                
                sendSocketData(clients[collideWith.id], socketMsgTypes.dead, {
                    id: collideWith.id
                });
            }
        }

        const now = Date.now();

        if (now - bullet.createdTime < bullet.lifeTime && !collideWith) {
            return bullet;
        }
    });
}

updateLoop();
