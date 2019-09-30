const config = {
    chunkSize: 100,
    maxSystemsInChunk: 10,
    maxPlanetsInSystem: 7,
    minPlanetSize: 500,
    roadPadding: 120,
    roadLength: 500,
    angleOffset: 25,
    planetWidth: 200000,
    planetHeight: 100000
}

const cos = Math.cos;
const sin = Math.sin;

function pointInPoly(polyCords, pointX, pointY) {
	var i, j, c = 0;
 
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