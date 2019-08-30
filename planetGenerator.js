let planetGenerator = (function() {
    let radius      = 100;
    let pixelSize   = 5;
    let rotate      = 0.0;
    let rotateSpeed = 0.0;
    let planetSize  = radius * 2 + 5 * radius / 100;

    // MAP
    function map(c, a1, a2, b1, b2) {
        return b1 + ((c - a1) / (a2 - a1)) * (b2 - b1);
    }
    
    // SET COLOR
    function setColor(textureData, x, y, width, r, g, b, a) {
        for (let xx = x; xx < x + pixelSize; xx++) {
            for (let yy = y; yy < y + pixelSize; yy++) {
                textureData[(xx + yy * width) * 4 + 0] = r;
                textureData[(xx + yy * width) * 4 + 1] = g;
                textureData[(xx + yy * width) * 4 + 2] = b;
                textureData[(xx + yy * width) * 4 + 3] = a;
            }
        }
    }

    // GENERATE NOISE
    function generateNoise(seed, initAmp = 1, initFreq = 0.01, width = 700, height = 400, r, g, b) {
        let canvas = document.createElement('canvas');
        let ctx    = canvas.getContext('2d');

        const textureWidth  = canvas.width = width;
        const textureHeight = canvas.height = height;

        let imageData   = ctx.createImageData(textureWidth, textureHeight);
        let textureData = imageData.data;

        let noise = new ClassicalNoise(seed);

        for (let x = 0; x < textureWidth; x += pixelSize) {
            for (let y = 0; y < textureHeight; y += pixelSize) {
                let phi = map(
                    x, 0, textureWidth - 1,
                    (3.0 / 2.0) * Math.PI + rotate, -Math.PI / 2.0 + rotate
                );

                let theta = map(
                    y, 0, textureHeight - 1,
                    Math.PI, 0
                );

                let xx = radius * Math.abs(Math.sin(theta)) * Math.cos(phi);
                let yy = radius * Math.cos(theta);
                let zz = radius * Math.abs(Math.sin(theta)) * Math.sin(phi);

                let amp   = initAmp;
                let freq  = initFreq;
                let color = 0.0;
                
                for (let i = 0; i < 3; i++) {
                    color += amp * noise.noise(xx * freq, yy * freq, zz * freq);
                    amp   *= 0.5;
                    freq  *= 2.0;                    
                }

                color += 1.0;
                color *= 0.5;
                color  = Math.round(color * 255);

                generateTexture(color, textureData, x, y, textureWidth, r, g, b);
            }
        }

        return {
            imageData
        }
    }

    // GENERATE TEXTURE
    function generateTexture(color, textureData, x, y, width, r, g, b) {
        if (color < 150) {
            color = color < 110 ? 110 : color;
            
            setColor(
                textureData, x, y, width,
                Math.round(color * r),
                Math.round(color * g),
                Math.round(color * b),
                255   
            );
        }
        else if (color < 210) {
            setColor(
                textureData, x, y, width,
                Math.round(color * (r - 0.3)),
                Math.round(color * (g - 0.3)),
                Math.round(color * (b - 0.3)),
                255
            );
        }
        else {
            setColor(
                textureData, x, y, width,
                Math.round(color * (r - 0.1)),
                Math.round(color * (g - 0.1)),
                Math.round(color * (b - 0.1)),
                255
            );
        }
    }

    // GENERATE PLANET
    function generatePlanet(textureData) {
        let canvas = document.createElement('canvas');
        let ctx    = canvas.getContext('2d');

        canvas.width = canvas.height = planetSize;

        let imageData = ctx.createImageData(planetSize, planetSize);
        let data      = imageData.data;

        for (let x = 0; x < planetSize; x++) {
            for (let y = 0; y < planetSize; y++) {
                setColor(data, x, y, planetSize, 0, 0, 0, 0);
            }
        }

        for (let x = 0; x < textureData.width; x++) {
            for (let y = 0; y < textureData.height; y++) {
                let phi = map(
                    x, 0, textureData.width - 1,
                    (3.0 / 2.0) * Math.PI + rotate, -Math.PI / 2.0 + rotate
                );

                let theta = map(
                    y, 0, textureData.height - 1,
                    Math.PI, 0
                );

                let r = textureData.data[(x + y * textureData.width) * 4 + 0];
                let g = textureData.data[(x + y * textureData.width) * 4 + 1];
                let b = textureData.data[(x + y * textureData.width) * 4 + 2];

                let zz = radius * Math.abs(Math.sin(theta)) * Math.sin(phi);
                let xx = Math.round(radius * Math.abs(Math.sin(theta)) * Math.cos(phi)) + radius;
                let yy = Math.round(radius * Math.cos(theta)) + radius;

                if (zz >= 0) {
                    setColor(data, xx, yy, planetSize, r, g, b, 255);
                }
            }
        }

        rotate -= rotateSpeed;

        if (rotateSpeed > 0) {
            requestAnimationFrame(generatePlanet);
        }

        ctx.putImageData(imageData, 0, 0);

        return {
            imageData,
            canvas
        }
    }

    return {
        generateNoise,
        generatePlanet
    } 
})();