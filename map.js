const mapTypes = {
    planet: 0,
    system: 1,
    chunks: 2
}

let mapData = {
    isOpen: false,
    mapType: mapTypes.planet,
    width: 800,
    height: 400,
    isDragged: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
}

function zoomOutMap() {
    if (mapData.mapType < mapTypes.chunks) {
        mapData.mapType++;
    }
}

function zoomInMap() {
    if (envData.current.name[0] === 'P' && mapData.mapType > mapTypes.planet) {
        mapData.mapType--;
    }
    else if (mapData.mapType > mapTypes.system) {
        mapData.mapType--;
    }
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

    // Chunks
    if (mapData.mapType === mapTypes.chunks) {
        Object.values(envData.chunks).forEach(chunk => {
            ctx.save();
                ctx.translate(
                    canvas.width / 2,
                    canvas.height / 2
                );

                Object.values(chunk.systems).forEach(system => {
                    if (
                        mapData.offsetX + system.x + chunk.x > mapData.width / 2 ||
                        mapData.offsetX + system.x + chunk.x < -mapData.width / 2 ||
                        mapData.offsetY + system.y + chunk.y > mapData.height / 2 ||
                        mapData.offsetY + system.y + chunk.y < -mapData.height / 2
                    ) return;

                    ctx.fillStyle = '#fff';

                    if (currentSystem === system) {
                        ctx.fillStyle = '#0f0';
                    }

                    ctx.beginPath();
                    ctx.arc(
                        mapData.offsetX + system.x + chunk.x,
                        mapData.offsetY + system.y + chunk.y,
                        2, 0, Math.PI * 2
                    );

                    ctx.fill();
                });
            ctx.restore();
        });
    }

    // System
    if (mapData.mapType === mapTypes.system) {
        ctx.lineWidth = 1;

        Object.values(currentSystem.planets).forEach(planet => {
            ctx.save();
                ctx.translate(
                    canvas.width / 2 - mapData.width / 2,
                    canvas.height / 2 - mapData.height / 2
                );

                const radius = planet.r / config.planetWidth * mapData.width;

                ctx.strokeStyle = '#555';
                ctx.fillStyle = '#fff';

                ctx.beginPath();
                    ctx.arc(
                        mapData.width / 2,
                        mapData.height / 2,
                        radius, 0, Math.PI * 2
                    );

                    ctx.stroke();
                ctx.closePath();

                ctx.beginPath();
                    ctx.arc(
                        planet.x / config.planetWidth * mapData.width + mapData.width / 2,
                        planet.y / config.planetHeight * mapData.height + mapData.height / 2,
                        2, 0, Math.PI * 2
                    );

                    ctx.fill();
                ctx.closePath();
            ctx.restore();
        });

        drawShipsOnMap(currentSystem);
    }

    // Planet
    if (mapData.mapType === mapTypes.planet) {
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;

        envData.current.cities.forEach(city => {
            city.roads.forEach(road => {
                ctx.save();
                    ctx.translate(
                        canvas.width / 2 - mapData.width / 2,
                        canvas.height / 2 - mapData.height / 2
                    );
                    
                    ctx.beginPath();
            
                    ctx.moveTo(
                        road.x1 / config.planetWidth * mapData.width + mapData.width / 2,
                        road.y1 / config.planetHeight * mapData.height + mapData.height / 2
                    );

                    ctx.lineTo(
                        road.x2 / config.planetWidth * mapData.width + mapData.width / 2,
                        road.y2 / config.planetHeight * mapData.height + mapData.height / 2
                    );
            
                    ctx.stroke();
                ctx.restore();
            });
        });

        drawShipsOnMap(currentPlanet);
    }
}

function drawShipsOnMap(env = {}) {
    if (!env.ships) return;

    env.ships.forEach(ship => {
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
                ship.x / config.planetWidth * mapData.width + mapData.width / 2 - 1,
                ship.y / config.planetHeight * mapData.height + mapData.height / 2 - 1,
                2,
                2
            );
        ctx.restore();
    });
}

canvas.addEventListener('click', ({ offsetX, offsetY }) => {
    if (!mapData.isOpen) return;

    const coords = getCoordsOnMap({ offsetX, offsetY });

    if (!coords) return;

    // playerShip.x = coords.x;
    // playerShip.y = coords.y;
});

canvas.addEventListener('mousedown', ({ offsetX, offsetY }) => {
    if (!mapData.isOpen) return;

    const coords = getCoordsOnMap({ offsetX, offsetY });

    if (!coords) return;

    mapData.startX = coords.x / config.planetWidth * mapData.width + mapData.offsetX;
    mapData.startY = coords.y / config.planetHeight * mapData.height + mapData.offsetY;
    mapData.isDragged = true;
});

canvas.addEventListener('mouseup', () => {
    if (!mapData.isOpen) return;

    mapData.isDragged = false;
});

canvas.addEventListener('mousemove', ({ offsetX, offsetY }) => {
    if (!mapData.isOpen) return;

    const coords = getCoordsOnMap({ offsetX, offsetY });

    if (!coords) return;

    if (mapData.mapType === mapTypes.system) {
        const planet = Object.values(currentSystem.planets).find(planet =>
            coords.x > planet.x - 200 - planet.size / 2 &&
            coords.x < planet.x + 200 + planet.size / 2 &&
            coords.y > planet.y - 200 - planet.size / 2 &&
            coords.y < planet.y + 200 + planet.size / 2
        );
        
        if (!planet) return;
    }

    if (mapData.mapType === mapTypes.chunks) {
        const mapX = coords.x / config.planetWidth * mapData.width;
        const mapY = coords.y / config.planetHeight * mapData.height;

        if (mapData.isDragged) {
            mapData.offsetX = mapData.startX - mapX;
            mapData.offsetY = mapData.startY - mapY;
        }

        const chunk = Object.values(envData.chunks).find(chunk =>
            mapX > chunk.x &&
            mapX < chunk.x + 100 &&
            mapY > chunk.y &&
            mapY < chunk.y + 100
        );

        if (!chunk) return;

        const system = Object.values(chunk.systems).find(system =>
            mapX > system.x + chunk.x - 2 &&
            mapX < system.x + chunk.x + 2 &&
            mapY > system.y + chunk.y - 2 &&
            mapY < system.y + chunk.y + 2
        );
    }
});

/**
 * Get mouse coordinates on map
 * @param {object} coordinates 
 */
function getCoordsOnMap({ offsetX, offsetY }) {
    const x = offsetX / window.innerWidth * canvas.width;
    const y = offsetY / window.innerHeight * canvas.height;

    const halfOffsetX = (canvas.width - mapData.width) / 2;
    const halfOffsetY = (canvas.height - mapData.height) / 2;

    if (
        x > halfOffsetX &&
        y > halfOffsetY &&
        x < canvas.width - halfOffsetX &&
        y < canvas.height - halfOffsetY
    ) {
        const mapX = (x - halfOffsetX) / (canvas.width - halfOffsetX * 2) * mapData.width;
        const mapY = (y - halfOffsetY) / (canvas.height - halfOffsetY * 2) * mapData.height;

        return {
            x: (mapX - mapData.width / 2) / mapData.width * config.planetWidth,
            y: (mapY - mapData.height / 2) / mapData.height * config.planetHeight
        }
    }
}