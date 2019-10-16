const actionsTypes = {
    move: 'move',
    destroy: 'destroy',
    wait: 'wait',
    patrol: 'patrol'
}

function createAction(type, target, data) {
    return {
        type,
        target,
        data,
        isComplete: false
    }
}

function doShipAction(ship) {
    switch (ship.action.type) {
        case actionsTypes.move: moveTo(ship); break;

        case actionsTypes.patrol: patrol(ship); break;

        case actionsTypes.wait: wait(ship); break;

        case actionsTypes.destroy: break;

        default: break;
    }
}

function moveTo(ship) {
    if (ship.action.isComplete) return;

    const point = ship.action.target;

    const d = Math.sqrt((ship.x - point[0])**2 + (ship.y - point[1])**2);
    const stopPath = (Math.max(ship.currentSpeed, 7))**2 / (1.9 * ship.velocity);

    if (d > stopPath) {
        ship.isSlowDown = false;
        ship.isForward = true;
    }
    else {
        ship.isSlowDown = true;
        ship.isForward = false;
    }

    if (d < 100 && ship.currentSpeed === 0) {
        ship.action.isComplete = true;

        ship.isSlowDown = false;
        ship.isForward = false;
        ship.isLeftRotate = false;
        ship.isRightRotate = false;
    }

    rotateTo(ship, point);
}

function rotateTo(ship, point) {
    if (ship.action.isComplete) return true;

    const angle = Math.atan2(ship.y - point[1], ship.x - point[0]) + Math.PI;
    const angleDif = ship.currentAngle - angle + Math.PI;

    if (angleDif < Math.PI + 0.1 && angleDif > Math.PI + -0.1 && !ship.action.isComplete) {
        ship.isLeftRotate = false;
        ship.isRightRotate = false;
    }
    else if (angleDif < Math.PI && !ship.isLeftRotate && !ship.action.isComplete) {
        ship.isLeftRotate = false;
        ship.isRightRotate = true;
    }
    else if (angleDif > Math.PI && !ship.isRightRotate && !ship.action.isComplete) {
        ship.isLeftRotate = true;
        ship.isRightRotate = false;
    }
}

function patrol(ship) {
    if (!ship.action.isComplete) {
        moveTo(ship);
    }
    else {
        ship.action.isComplete = false;

        const buildId = ~~(ship.seed.unit() * ship.action.data.buildings.length);
        const pos = ship.action.data.buildings[buildId][0];

        ship.action = createAction(actionsTypes.patrol, pos, ship.action.data);

        moveTo(ship);
    }
}

function wait(ship) {
    if (ship.action.to - performance.now() < 0) {
        ship.action.isComplete = true;
    }
}