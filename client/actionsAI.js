const actionsTypes = {
    move: 'move',
    destroy: 'destroy',
    wait: 'wait',
    patrol: 'patrol',
    attack: 'attack',
    trade: 'trade'
}

function doShipAction(ship) {
    if (!ship.action) return;
    
    switch (ship.action.currentAction) {
        case actionsTypes.move    : moveTo(ship); break;
        case actionsTypes.patrol  : patrol(ship); break;
        case actionsTypes.trade   : trade(ship); break;
        case actionsTypes.wait    : wait(ship); break;
        case actionsTypes.attack  : attackTarget(ship); break;
        case actionsTypes.destroy : break;
        default: break;
    }
}

// Basic actions

function moveTo(ship) {
    if (ship.action.isComplete) {
        ship.action.currentAction = ship.action.regularAction;

        return 0;
    };

    if (currentPlanet && currentPlanet.isAgressive && ship.action.currentAction !== actionsTypes.attack) {
        attackTarget(ship);

        return;
    }

    let data = ship.action.data;

    if (!data.maxSpeed) {
        data.maxSpeed = ship.maxSpeed;
    }

    const point = ship.action.data.target;
    const distance = Math.sqrt((ship.x - point[0])**2 + (ship.y - point[1])**2) - data.range;
    const stopPath = (Math.max(ship.currentSpeed, 1))**2 / (1.5 * ship.velocity);

    if (data.isNeedStop) {
        if (distance > stopPath) {
            ship.isSlowDown = false;
            ship.isForward = true;
        }
        else {
            ship.isSlowDown = true;
            ship.isForward = false;
        }

        if (distance < data.range && ship.currentSpeed === 0) {
            ship.action.isComplete = true;
    
            ship.isSlowDown = false;
            ship.isForward = false;
            ship.isLeftRotate = false;
            ship.isRightRotate = false;
        }
    }
    else {
        if (distance < data.range) {
            ship.action.isComplete = true;
        }
        else {
            ship.isForward = true;
        }
    }

    if (ship.currentSpeed > data.maxSpeed) {
        ship.isForward = false;
    }

    rotateTo(ship, point);

    return distance;
}

function rotateTo(ship, point) {
    if (ship.action.isComplete) return;

    const offset = 0.2;
    const current = ship.currentAngle;
    let target = Math.atan2(ship.y - point[1], ship.x - point[0]) + Math.PI;

    target = ((target - current) % (Math.PI * 2)) + current;

    if (target < current - Math.PI) target += Math.PI * 2;
    if (target > current + Math.PI) target -= Math.PI * 2;

    if (ship.currentAngle > target - offset && ship.currentAngle < target + offset) {
        ship.isLeftRotate = false;
        ship.isRightRotate = false;
    }
    else if (ship.currentAngle < target) {
        ship.isLeftRotate = false;
        ship.isRightRotate = true;
    }
    else if (ship.currentAngle > target) {
        ship.isLeftRotate = true;
        ship.isRightRotate = false;
    }
}

function wait(ship) {
    if (ship.action.data.waitTo - Date.now() < 0) {
        ship.action.isComplete = true;
        ship.action.currentAction = ship.action.regularAction;
    }
}


// Complex actions

function patrol(ship) {
    const cityId = ship.action.data.targetCityId;
    const buildId = ~~(ship.seed.unit() * currentPlanet.cities[cityId].buildings.length);
    const pos = currentPlanet.cities[cityId].buildings[buildId][0];

    ship.action = {
        regularAction: actionsTypes.patrol,
        currentAction: actionsTypes.move,
        isComplete: false,
        data: {
            isNeedStop: false,
            range: 100,
            maxSpeed: 10,
            target: pos,
            targetCityId: cityId
        }
    }
}

function trade(ship) {
    if (ship.action.currentAction === actionsTypes.move) {
        ship.callTrigger();

        ship.action.isComplete = false;
        ship.action.currentAction = actionsTypes.trade;
        ship.action.data.waitTo = Date.now() + 10000 * ship.seed.unit();
        ship.action.data.isTrading = true;
        ship.action.data.targetCityId = ship.action.data.targetCityId === ship.action.data.startCityId
            ? ship.action.data.endCityId
            : ship.action.data.startCityId;
    }
    else if (ship.action.currentAction === actionsTypes.wait) {
        goToTrigger(ship);
    }
    else if (ship.action.currentAction === actionsTypes.trade) {
        if (ship.action.data.isTrading) {
            ship.action.isComplete = false;
            ship.action.currentAction = actionsTypes.move;
            ship.action.data.isTrading = false;
            ship.action.data.targetCityId = ship.action.data.targetCityId === ship.action.data.startCityId
                ? ship.action.data.endCityId
                : ship.action.data.startCityId;

            ship.callTrigger();
            goToTrigger(ship);
        }
        else {
            ship.action.isComplete = false;
            ship.action.currentAction = actionsTypes.wait;
            ship.action.data.waitTo = Date.now() + 10000 * ship.seed.unit();
            ship.action.data.isTrading = true;

            ship.callTrigger();
            wait(ship);
        }

    }
}

function goToTrigger(ship) {
    const cityId = ship.action.data.targetCityId;
    const trigger = currentPlanet.cities[cityId].triggers.find(t => !t.owner);

    ship.action.data.isNeedStop = true;
    ship.action.data.range = 10;

    if (trigger) {
        ship.action.currentAction = actionsTypes.move;
        ship.action.data.target = trigger.pos;
    }
    else {
        ship.action.currentAction = actionsTypes.wait;
        ship.action.data.waitTo = Date.now() + 5000;
    }
}

function attackTarget(ship) {
    const pos = [ playerShip.x, playerShip.y ];
    const distance = Math.sqrt((ship.x - pos[0])**2 + (ship.y - pos[1])**2);

    ship.isShoting = distance < 2000 && playerShip.hp > 0;

    if (playerShip.hp <= 0) {
        currentPlanet.isAgressive = false;
        ship.action.currentAction = ship.action.regularAction;
        
        return;
    }

    const cityId = ship.action.data.targetCityId;

    ship.action = {
        regularAction: ship.action.regularAction,
        currentAction: actionsTypes.attack,
        isComplete: false,
        data: {
            ...ship.action.data,
            isNeedStop: false,
            range: 0,
            maxSpeed: playerShip.currentSpeed,
            target: pos,
            targetCityId: cityId
        }
    };

    moveTo(ship);
}