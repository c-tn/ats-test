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
    if (envData.current.name[0] === 'S') {
        Object.values(currentSystem.planets).forEach(planet => {
            ctx.save();
                ctx.translate(
                    canvas.width / 2 - mapData.width / 2,
                    canvas.height / 2 - mapData.height / 2
                );

                const radius = planet.r / config.planetWidth * mapData.width;

                ctx.strokeStyle = '#333';
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

    playerShip.x = coords.x;
    playerShip.y = coords.y;
});

canvas.addEventListener('mousemove', ({ offsetX, offsetY }) => {
    if (!mapData.isOpen) return;

    const coords = getCoordsOnMap({ offsetX, offsetY });

    if (!coords) return;

    if (envData.current.name[0] === 'S') {
        const planet = Object.values(currentSystem.planets).find(planet =>
            coords.x > planet.x - 200 - planet.size / 2 &&
            coords.x < planet.x + 200 + planet.size / 2 &&
            coords.y > planet.y - 200 - planet.size / 2 &&
            coords.y < planet.y + 200 + planet.size / 2
        );
        
        if (!planet) return;

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