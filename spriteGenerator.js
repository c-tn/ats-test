class Mask {
    constructor({ data, width, height, isMirrorX, isMirrorY }) {
        this.width = width;
        this.height = height;

        this.data = data || [
            0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 1,
            0, 0, 0, 0, 0, 0, 0, 0, 1,
            0, 0, 0, 0, 0, 0, 0, 1, 1,
            0, 0, 0, 0, 0, 0, 0, 1, 1,
            0, 1, 1, 0, 0, 0, 1, 1, 1,
            0, 0, 1, 0, 0, 0, 1, 1, 1,
            0, 0, 1, 0, 0, 1, 1, 1, 1,
            0, 0, 1, 0, 1, 1, 1, 1, 1,
            0, 0, 1, 1, 1, 1, 1, 1, 1,
            0, 0, 1, 1, 1, 1, 1, 1, 1,
            0, 0, 0, 0, 1, 1, 1, 1, 1,
            0, 0, 0, 0, 0, 0, 0, 0, 1,
            0, 0, 0, 0, 0, 0, 0, 0, 1,
            0, 0, 0, 0, 0, 0, 0, 0, 0,
        ];

        this.isMirrorX = isMirrorX;
        this.isMirrorY = isMirrorY;
    }
}

class Sprite {
    constructor(mask, setup) {
        this.width = mask.width * (mask.isMirrorX ? 2 : 1);
        this.height = mask.height * (mask.isMirrorY ? 2 : 1);

        this.mask = mask;
        this.data = new Array(this.width * this.height);

        this.setup = setup;

        this.rng = new RNG(setup.seed);

        this.init();
    }

    init() {
        this.initData();
        this.applyMask();
        this.generateRandomSample();
        this.mirrorX();
        this.mirrorY();
        this.generateEdges();
        this.renderPixelData();
    }

    initData() {
        this.canvas = document.createElement('canvas');

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.ctx = this.canvas.getContext('2d');
        this.pixels = this.ctx.createImageData(this.width, this.height);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.setData(x, y, -1);
            }
        }
    }

    getData(x, y) {
        return this.data[y * this.width + x];
    }

    setData(x, y, value) {
        this.data[y * this.width + x] = value;
    }

    mirrorX() {
        if (!this.mask.isMirrorX) return;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < Math.floor(this.width / 2); x++) {
                this.setData(this.width - x - 1, y, this.getData(x, y));
            }
        }
    }

    mirrorY() {
        if (!this.mask.isMirrorY) return;

        for (let y = 0; y < Math.floor(this.height / 2); y++) {
            for (let x = 0; x < this.width; x++) {
                this.setData(x, this.height - y - 1, this.getData(x, y));
            }
        }
    }

    applyMask() {
        for (let y = 0; y < this.mask.height; y++) {
            for (let x = 0; x < this.mask.width; x++) {
                let data = this.mask.data[y * this.mask.width + x];

                this.setData(x, y, data);
            }
        }
    }

    generateRandomSample() {
        if (this.setup.isNoSample) return;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let val = this.getData(x, y);

                if (val === 1) {
                    val = val * Math.round(this.rng.unit());
                }

                this.setData(x, y, val);
            }
        }
    }

    generateEdges() {
        if (this.setup.isNoEdges) return;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.getData(x, y) > 0) {
                    if (y - 1 >= 0 && this.getData(x, y - 1) === 0) {
                        this.setData(x, y - 1, -1);
                    }

                    if (y + 1 < this.height && this.getData(x, y + 1) === 0) {
                        this.setData(x, y + 1, -1);
                    }

                    if (x - 1 >= 0 && this.getData(x - 1, y) === 0) {
                        this.setData(x - 1, y, -1);
                    }

                    if (x + 1 < this.width && this.getData(x + 1, y) === 0) {
                        this.setData(x + 1, y, -1);
                    }
                }
            }
        }
    }

    renderPixelData() {
        let isVertical = this.rng.unit() > 0.5;

        let ilen;
        let jlen;

        if (isVertical) {
            ilen = this.height;
            jlen = this.width;
        }
        else {
            ilen = this.width;
            jlen = this.height;
        }

        for (let i = 0; i < ilen; i++) {
            for (let j = 0; j < jlen; j++) {
                let val, index;

                if (isVertical) {
                    val = this.getData(j, i);
                    index = (i * jlen + j) * 4;
                }
                else {
                    val = this.getData(i, j);
                    index = (j * ilen + i) * 4;
                }

                let rgb = {
                    r: 1,
                    g: 1,
                    b: 1
                }

                if (val !== 0) {
                    if (this.setup.isColored) {
                        let brightness = Math.sin((i / ilen) * Math.PI) * 0.7 + this.rng.unit() * 0.3;

                        this.hslToRgb(this.setup.hue, this.setup.saturation, brightness, rgb);

                        if (val === -1) {
                            rgb.r *= 0.3;
                            rgb.g *= 0.3;
                            rgb.b *= 0.3;
                        }
                    }
                }

                this.pixels.data[index + 0] = rgb.r * 255;
                this.pixels.data[index + 1] = rgb.g * 255;
                this.pixels.data[index + 2] = rgb.b * 255;

                if (val === 0) {
                    this.pixels.data[index + 3] = 0;
                }
                else {
                    this.pixels.data[index + 3] = 255;
                }
            }
        }

        this.ctx.putImageData(this.pixels, 0, 0);
    }


    hslToRgb(h, s, l, result) {
        if (!result) {
            result = {
                r: 0,
                g: 0,
                b: 0
            }
        }

        let i = Math.floor(h * 6);
        let f = h * 6 - i;
        let p = l * (1 - s);
        let q = l * (1 - f * s);
        let t = l * (1 - (1 - f) * s);

        switch (i % 6) {
            case 0: result.r = l, result.g = t, result.b = p; break;
            case 1: result.r = q, result.g = l, result.b = p; break;
            case 2: result.r = p, result.g = l, result.b = t; break;
            case 3: result.r = p, result.g = q, result.b = l; break;
            case 4: result.r = t, result.g = p, result.b = l; break;
            case 5: result.r = l, result.g = p, result.b = q; break;
        }

        return result;
    }
}

function resize(img, scale, width, height) {
    let scaledWidth = width || img.width * scale;
    let scaledHeight = height || img.height * scale;

    let original = document.createElement('canvas');
    original.width = img.width;
    original.height = img.height;

    let originalCtx = original.getContext('2d');

    originalCtx.drawImage(img, 0, 0);

    let originalPixels = originalCtx.getImageData(0, 0, img.width, img.height);

    let scaled = document.createElement('canvas');
    scaled.width = scaledWidth;
    scaled.height = scaledHeight;

    let scaledCtx = scaled.getContext('2d');
    let scaledPixels = scaledCtx.getImageData(0, 0, scaledWidth, scaledHeight);

    for (let y = 0; y < scaledHeight; y++) {
        for (let x = 0; x < scaledWidth; x++) {
            let index = (Math.floor(y / scale) * img.width + Math.floor(x / scale)) * 4;
            let indexSclaed = (y * scaledWidth + x) * 4;

            scaledPixels.data[indexSclaed + 0] = originalPixels.data[index + 0];
            scaledPixels.data[indexSclaed + 1] = originalPixels.data[index + 1];
            scaledPixels.data[indexSclaed + 2] = originalPixels.data[index + 2];
            scaledPixels.data[indexSclaed + 3] = originalPixels.data[index + 3];
        }
    }

    scaledCtx.putImageData(scaledPixels, 0, 0);

    return scaled;
}