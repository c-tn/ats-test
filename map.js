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
    offsetY: 0,
    hoveredSystem: null,
    hoveredChunk: null
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
                    ctx.fillStyle = '#fff';

                    if (currentSystem === system) {
                    }

                    if (
                        (system.x + chunk.x - mapData.offsetX > mapData.width / 2 ||
                        system.x + chunk.x - mapData.offsetX < -mapData.width / 2 ||
                        system.y + chunk.y - mapData.offsetY > mapData.height / 2 ||
                        system.y + chunk.y - mapData.offsetY < -mapData.height / 2) &&
                        currentSystem !== system
                    ) return;

                    if (currentSystem === system) {
                        ctx.fillStyle = '#0f0';

                        const directionX = (system.x + chunk.x - mapData.offsetX) / Math.abs(system.x + chunk.x - mapData.offsetX);
                        const x = Math.min(Math.abs(system.x + chunk.x - mapData.offsetX), mapData.width / 2) * directionX;

                        const directionY = (system.y + chunk.y - mapData.offsetY) / Math.abs(system.y + chunk.y - mapData.offsetY);
                        const y = Math.min(Math.abs(system.y + chunk.y - mapData.offsetY), mapData.height / 2) * directionY;

                        ctx.beginPath();
                        ctx.arc(
                            x,
                            y,
                            2, 0, Math.PI * 2
                        );
    
                        ctx.fill();
                    }
                    else {
                        ctx.beginPath();
                        ctx.arc(
                            system.x + chunk.x - mapData.offsetX,
                            system.y + chunk.y - mapData.offsetY,
                            2, 0, Math.PI * 2
                        );
    
                        ctx.fill();
                    }

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

                if (planet === currentPlanet) {
                    ctx.fillStyle = '#0f0';
                }

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

    if (!coords.mapX) return;

    if (mapData.hoveredSystem && !currentPlanet && currentSystem !== mapData.hoveredSystem) {
        enterSystem(mapData.hoveredSystem, mapData.hoveredChunk);
    }
});

canvas.addEventListener('mousedown', ({ offsetX, offsetY }) => {
    if (!mapData.isOpen) return;

    const coords = getCoordsOnMap({ offsetX, offsetY });

    if (!coords.mapX) return;

    mapData.startX = mapData.offsetX + coords.mapX;
    mapData.startY = mapData.offsetY + coords.mapY;
    mapData.isDragged = true;
});

canvas.addEventListener('mouseup', () => {
    if (!mapData.isOpen) return;

    mapData.isDragged = false;
});

canvas.addEventListener('mousemove', ({ offsetX, offsetY }) => {
    if (!mapData.isOpen) return;

    const coords = getCoordsOnMap({ offsetX, offsetY });

    if (!coords.mapX) return;

    if (mapData.mapType === mapTypes.system) {
        const planet = Object.values(currentSystem.planets).find(planet => 
            coords.globalX > planet.x - 200 - planet.size / 2 &&
            coords.globalX < planet.x + 200 + planet.size / 2 &&
            coords.globalY > planet.y - 200 - planet.size / 2 &&
            coords.globalY < planet.y + 200 + planet.size / 2
        );

        if (!planet) {
            modalData.isVisible = false;

            return;
        }

        modalData.isVisible = true;
        modalData.text = planet.name;
        modalData.x = coords.canvasX;
        modalData.y = coords.canvasY;
    }

    if (mapData.mapType === mapTypes.chunks) {
        if (mapData.isDragged) {
            mapData.offsetX = mapData.startX - coords.mapX;
            mapData.offsetY = mapData.startY - coords.mapY;
        }

        const chunk = Object.values(envData.chunks).find(chunk =>
            coords.mapX + mapData.offsetX > chunk.x &&
            coords.mapX + mapData.offsetX < chunk.x + 100 &&
            coords.mapY + mapData.offsetY > chunk.y &&
            coords.mapY + mapData.offsetY < chunk.y + 100
        );

        if (!chunk) {
            mapData.hoveredChunk = null;
            mapData.hoveredSystem = null;
            modalData.isVisible = false;

            return;
        }

        mapData.hoveredChunk = chunk;

        const system = Object.values(chunk.systems).find(system =>
            coords.mapX + mapData.offsetX > system.x + chunk.x - 2 &&
            coords.mapX + mapData.offsetX < system.x + chunk.x + 2 &&
            coords.mapY + mapData.offsetY > system.y + chunk.y - 2 &&
            coords.mapY + mapData.offsetY < system.y + chunk.y + 2
        );

        if (!system) {
            modalData.isVisible = false;
            mapData.hoveredSystem = null;

            return;
        }

        modalData.isVisible = true;
        modalData.text = system.name;
        modalData.x = coords.canvasX;
        modalData.y = coords.canvasY;
        mapData.hoveredSystem = system;
    }
});

/**
 * Get mouse coordinates on map
 * @param {object} coordinates 
 */
function getCoordsOnMap({ offsetX, offsetY }) {
    let coords = {
        canvasX: offsetX / window.innerWidth * canvas.width,
        canvasY: offsetY / window.innerHeight * canvas.height,

        mapX: null,
        mapY: null,

        globalX: null,
        globalY: null
    }

    const halfOffsetX = (canvas.width - mapData.width) / 2;
    const halfOffsetY = (canvas.height - mapData.height) / 2;

    coords.mapX = (coords.canvasX - halfOffsetX) / (canvas.width - halfOffsetX * 2) * mapData.width - mapData.width / 2;
    coords.mapY = (coords.canvasY - halfOffsetY) / (canvas.height - halfOffsetY * 2) * mapData.height - mapData.height / 2;

    coords.globalX = coords.mapX / mapData.width * config.planetWidth;
    coords.globalY = coords.mapY / mapData.height * config.planetHeight;

    return coords;
}

function enterSystem(system, chunk) {
    popPlayerShip();

    playerShip.x = 0;
    playerShip.y = 0;

    envData.current = system;
    currentSystem = system;
    currentChunk = chunk;

    if (!currentSystem.ships) {
        currentSystem.ships = [];
    }

    envData.current.ships.push(playerShip);
    generateEnv(currentChunk.x, currentChunk.y);
}