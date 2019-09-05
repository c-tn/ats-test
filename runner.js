let files = {
    loaded: 0,
    total: 0
}

let currentCtrl;

function fileLoader(req) {
    files.total++;

    new Promise(req)
    .then(() => {
        files.loaded++;

        if (files.loaded >= files.total) {
            init();
            currentCtrl = fpsCtrl(100, gameLoop);
        }
    });
}

createTexture();
createPlanet();