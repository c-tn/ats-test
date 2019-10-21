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

function moveTo(ship, data = { isNeedStop: true }) {
    if (ship.action.isComplete) return;

    if (!data.maxSpeed) {
        data.maxSpeed = ship.maxSpeed;
    }

    const point = ship.action.target;
    const completeRange = 50;
    const d = Math.sqrt((ship.x - point[0])**2 + (ship.y - point[1])**2) - 50;
    const stopPath = (Math.max(ship.currentSpeed, 1))**2 / (1.5 * ship.velocity);

    if (data.isNeedStop) {
        if (d > stopPath) {
            ship.isSlowDown = false;
            ship.isForward = true;
        }
        else {
            ship.isSlowDown = true;
            ship.isForward = false;
        }

        if (d < completeRange && ship.currentSpeed === 0) {
            ship.action.isComplete = true;
    
            ship.isSlowDown = false;
            ship.isForward = false;
            ship.isLeftRotate = false;
            ship.isRightRotate = false;
        }
    }
    else {
        if (d < completeRange) {
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
}

function rotateTo(ship, point) {
    if (ship.action.isComplete) return true;

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

function patrol(ship) {
    if (!ship.action.isComplete) {
        moveTo(ship, {
            maxSpeed: 10,
            isNeedStop: false
        });
    }
    else {
        ship.action.isComplete = false;

        const buildId = ~~(ship.seed.unit() * ship.action.data.buildings.length);
        const pos = ship.action.data.buildings[buildId][0];

        ship.action = createAction(actionsTypes.patrol, pos, ship.action.data);

        moveTo(ship, {
            maxSpeed: 10,
            isNeedStop: false
        });
    }
}

function wait(ship) {
    if (ship.action.to - performance.now() < 0) {
        ship.action.isComplete = true;
    }
}