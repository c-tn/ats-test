let mapData = {
    isOpen: false,
    width: 800,
    height: 400,
    citiesPoints: []
}

function renderCitiesPoints() {
    let [ minX, minY ] = [ Infinity, Infinity ];
    let [ maxX, maxY ] = [ -Infinity, -Infinity ];

    envData.current.roads.forEach(road => {
        if (road.x1 < minX) minX = road.x1;
        if (road.x2 > maxX) maxX = road.x2;

        if (road.y1 < minY) minY = road.y1;
        if (road.y2 > maxY) maxY = road.y2;
    });

    mapData.citiesPoints.push({
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2
    });
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

    ctx.fillStyle = '#555';

    // Planets
    if (envData.current.name[0] === 'S') {
        Object.values(currentSystem.planets).forEach(planet => {
            ctx.save();
                ctx.fillStyle = '#fff';
    
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
    if (envData.current.name[0] === 'P') {
        mapData.citiesPoints.forEach(city => {
            ctx.save();
                ctx.translate(
                    canvas.width / 2 - mapData.width / 2,
                    canvas.height / 2 - mapData.height / 2
                );

                ctx.fillRect(
                    city.x / 80000 * mapData.width + mapData.width / 2,
                    city.y / 40000 * mapData.height + mapData.height / 2,
                    10,
                    10
                );
            ctx.restore();
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