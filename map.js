let mapData = {
    isOpen: false,
    width: 800,
    height: 400
}

function drawMap() {
    if (!mapData.isOpen) return;

    ctx.fillStyle = 'rgba(0, 0, 0, .8)';
    
    ctx.fillRect(
        canvas.width / 2 - mapData.width / 2,
        canvas.height / 2 - mapData.height / 2,
        mapData.width,
        mapData.height
    );

    // Planets
    ctx.fillStyle = '#fff';

    if (envData.current.name[0] === 'S') {
        Object.values(currentSystem.planets).forEach(planet => {
            ctx.save();
                ctx.translate(
                    canvas.width / 2 - mapData.width / 2,
                    canvas.height / 2 - mapData.height / 2
                );
    
                ctx.fillRect(
                    planet.x / 80000 * mapData.width + mapData.width / 2,
                    planet.y / 40000 * mapData.height + mapData.height / 2,
                    4,
                    4
                );
            ctx.restore();
        });
    }

    // Cities
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;

    if (envData.current.name[0] === 'P') {
        envData.current.cities.forEach(city => {
            city.roads.forEach(road => {
                ctx.save();
                    ctx.translate(
                        canvas.width / 2 - mapData.width / 2,
                        canvas.height / 2 - mapData.height / 2
                    );
                    
                    ctx.beginPath();
            
                    ctx.moveTo(
                        road.x1 / 80000 * mapData.width + mapData.width / 2,
                        road.y1 / 40000 * mapData.height + mapData.height / 2
                    );

                    ctx.lineTo(
                        road.x2 / 80000 * mapData.width + mapData.width / 2,
                        road.y2 / 40000 * mapData.height + mapData.height / 2
                    );
            
                    ctx.stroke();
                ctx.restore();
            });
        });
    }

    // Ships
    envData.current.ships.forEach(ship => {
        if (ship === playerShip) {
            ctx.fillStyle = '#0a0';
        }
        else {
            ctx.fillStyle = '#aaa';
        }

        ctx.save();
            ctx.translate(
                canvas.width / 2 - mapData.width / 2,
                canvas.height / 2 - mapData.height / 2
            );

            ctx.fillRect(
                ship.x / 80000 * mapData.width + mapData.width / 2,
                ship.y / 40000 * mapData.height + mapData.height / 2,
                2,
                2
            );
        ctx.restore();
    });
}