canvas.addEventListener('click', ({ offsetX, offsetY }) => {
    if (!playerShip.canControl) return;
    
    let x = offsetX / window.innerWidth * camera.width + camera.x - camera.width / 2;
    let y = offsetY / window.innerHeight * camera.height + camera.y - camera.height / 2;

    let targetShip = envData.current.ships.find(ship =>
        x > ship.x - 45 &&
        x < ship.x + 45 &&
        y > ship.y - 40 &&
        y < ship.y + 40  
    );
    
    if (targetShip) {
        playerShip = targetShip;
    }
});