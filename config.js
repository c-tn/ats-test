const config = {
    chunkSize: 100,
    maxSystemsInChunk: 10,
    maxPlanetsInSystem: 7,
    minPlanetSize: 500,
    roadPadding: 120,
    roadLength: 500,
    angleOffset: 25,
    planetWidth: 200000,
    planetHeight: 100000,
    avgRaceCount: 6,
    avgRaceControlRadius: 700,
    itemsLevel: [
        {
            damage: {
                min: 3,
                mid: 7
            },
            reload: {
                min: 800,
                mid: 400
            },
            health: {
                min: 30,
                mid: 30
            }
        }, {
            damage: {
                min: 8,
                mid: 10
            },
            reload: {
                min: 700,
                mid: 400
            },
            health: {
                min: 40,
                mid: 30
            }
        }
    ]
}

const cos = Math.cos;
const sin = Math.sin;

function pointInPoly(polyCords, pointX, pointY) {
	let i, j, c = 0;
 
	for (i = 0, j = polyCords.length - 1; i < polyCords.length; j = i++)
	{
 
		if (
            ((polyCords[i][1] > pointY) != (polyCords[j][1] > pointY)) &&
            (pointX < (polyCords[j][0] - polyCords[i][0]) * (pointY - polyCords[i][1]) / (polyCords[j][1] - polyCords[i][1]) + polyCords[i][0])
        ) {
			c = !c;
		}
 
	}
 
	return c;
}