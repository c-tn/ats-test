let mapData = {
    isOpen: false,
    width: 800,
    height: 400,
    citiesPoints: []
}

function renderCitiesPoints() {
    let [ minX, minY ] = [ Infinity, Infinity ];
    let [ maxX, maxY ] = [ -Infinity, -Infinity ];

    roads.forEach(road => {
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

    // Cities
    mapData.citiesPoints.forEach(city => {
        ctx.save();
            ctx.translate(
                canvas.width / 2 - mapData.width / 2,
                canvas.height / 2 - mapData.height / 2
            );

            ctx.fillRect(
                city.x / 80000 * mapData.width,
                city.y / 40000 * mapData.height,
                10,
                10
            );
        ctx.restore();
    });

    // Ships
    ships.forEach(ship => {
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
                ship.x / 80000 * mapData.width,
                ship.y / 40000 * mapData.height,
                2,
                2
            );
        ctx.restore();
    });

    

    ctx.save();
        ctx.fillStyle = '#fff';

        ctx.translate(
            canvas.width / 2 - mapData.width / 2,
            canvas.height / 2 - mapData.height / 2
        );

        ctx.fillRect(
            envData.x / 80000 * mapData.width,
            envData.y / 40000 * mapData.height,
            4,
            4
        );
    ctx.restore();
}