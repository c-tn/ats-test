function random(value) {
    return ~~(Math.random() * value);
}

function createPoint(x, y, data) {
    return { x, y, data }
}

function createRect(x, y, w, h) {
    return { x, y, w, h }
}

function createCircle(x, y, d) {
    return { x, y, d }
}

function checkPointInRect(boundary, point) {
    if (boundary.w === undefined) {
        const d = Math.sqrt( (point.x - boundary.x)**2 + (point.y - boundary.y)**2 );

        if (d < boundary.d) {
            return true;
        }
    }
    else {
        return (
            point.x > boundary.x &&
            point.x < boundary.x + boundary.w &&
            point.y > boundary.y &&
            point.y < boundary.y + boundary.h
        );
    }
}

function checkRectsIntersects(b1, b2) {
    if (!b1.w) {
        b1 = createRect(b1.x - b1.d, b1.y - b1.d, b1.d * 2, b1.d * 2);
    }
    return (
        b1.x > b2.x ||
        b1.x + b1.w < b2.x + b2.w ||
        b1.y > b2.y ||
        b1.y + b1.h < b2.y + b2.h
    );
}

class QuadTree {
    constructor(boundary, n) {
        this.boundary = boundary;
        this.capacity = n;
        this.points = [];
        this.isDivided = false;
    }

    subdivide() {
        const x = this.boundary.x;
        const y = this.boundary.y;
        const w = this.boundary.w / 2;
        const h = this.boundary.h / 2;

        const tl = createRect(x, y, w, h);
        this.topLeft = new QuadTree(tl, this.capacity);

        const tr = createRect(x + w, y, w, h);
        this.topRight = new QuadTree(tr, this.capacity);

        const bl = createRect(x, y + h, w, h);
        this.bottomLeft = new QuadTree(bl, this.capacity);

        const br = createRect(x + w, y + h, w, h);
        this.bottomRight = new QuadTree(br, this.capacity);

        this.isDivided = true;
    }

    /**
     * Get points in the range
     * @param { Rectangle } range range for query 
     */
    query(range, arr = []) {
        if (!checkRectsIntersects(range, this.boundary)) {
            return arr;
        }
        else {
            for (let p of this.points) {
                if (checkPointInRect(range, p)) {
                    arr.push(p);
                }
            }

            if (this.isDivided) {
                this.topLeft.query(range, arr);
                this.topRight.query(range, arr);
                this.bottomLeft.query(range, arr);
                this.bottomRight.query(range, arr);
            }
            
            return arr;
        }
    }

    insert(point) {
        if (!checkPointInRect(this.boundary, point)) {
            return;
        }

        if (this.points.length < this.capacity) {
            this.points.push(point);
        }
        else {
            if (!this.isDivided) {
                this.subdivide();
            }

            this.topLeft.insert(point);
            this.topRight.insert(point);
            this.bottomLeft.insert(point);
            this.bottomRight.insert(point);
        }
    }

    draw() {
        ctx.beginPath();
        ctx.strokeStyle = '#555';

        ctx.rect(
            this.boundary.x - cameraData.offsetX,
            this.boundary.y - cameraData.offsetY,
            this.boundary.w,
            this.boundary.h
        );

        ctx.stroke();
        ctx.closePath();

        if (this.isDivided) {
            this.topLeft.draw();
            this.topRight.draw();
            this.bottomLeft.draw();
            this.bottomRight.draw();
        }

        ctx.fillStyle = '#f00';
        for (let p of this.points) {
            ctx.beginPath();
            ctx.arc(p.x - cameraData.offsetX, p.y - cameraData.offsetY, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
    }
}