function landing(direction, ship) {
    if (direction) {
        ship.flyHeight -= 1;
        ship.spriteSize -= 0.005;

        if (ship.flyHeight <= 0) {
            ship.flyHeight = 0;
            ship.currentAnimation = animationTypes.idle;
        }
    }
    else {
        ship.flyHeight += 1;
        ship.spriteSize += 0.005;

        if (ship.flyHeight >= 40) {
            ship.flyHeight = 40;
            ship.spriteSize = 1;
            ship.currentAnimation = animationTypes.idle;
        }
    }
}