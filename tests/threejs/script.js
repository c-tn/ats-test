const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const render = new THREE.WebGLRenderer();

render.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(render.domElement);

camera.position.z = 15;

let player = {
    isForward: false,
    isBackward: false,
    isLeftRotating: false,
    isRightRotating: false,
    currentSpeed: 0,
    rotateSpeed: 0.05,
    sprite: generateSprite({
        hue: 0.1,
        seed: 'seed',
        saturation: 0.1,
        data: [
            0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 1,
            0, 0, 0, 0, 0, 0, 1, 1, 1,
            0, 0, 0, 0, 0, 1, 1, 1, 1,
            0, 0, 0, 0, 1, 1, 1, 1, 1,
            0, 0, 0, 1, 1, 1, 1, 1, 1,
            0, 0, 1, 1, 1, 1, 1, 1, 1,
            0, 1, 1, 1, 1, 1, 1, 1, 1,
            0, 1, 0, 1, 0, 0, 0, 0, 1,
            0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0,
        ]
    })
}

function generateSprite({
    hue = 0.5,
    saturation = 0.5,
    width = 9,
    height = 16,
    isNoEdges = false,
    isNoSample = false,
    data,
    seed
} = {}) {
    let generatedMask = new Mask({
        data,
        width,
        height,
        isMirrorX: true
    });

    let sprite = new Sprite(generatedMask, {
        hue,
        saturation,
        seed,
        isColored: true,
        isNoEdges,
        isNoSample
    });

    let resizedSprite = resize(sprite.canvas, 5);

    return resizedSprite;
}

let texture = new THREE.TextureLoader().load(player.sprite.toDataURL());

const geometry = new THREE.PlaneGeometry(1.2, 1);
const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
const sprite = new THREE.Mesh(geometry, material);

sprite.position.x = 0;
sprite.position.y = 0;
sprite.position.z = 6.1;

scene.add(sprite);

function createBox(data) {
    if (!data.sprite) {
        data.sprite = 'img/metal.jpg';
    }

    const texture = new THREE.TextureLoader().load(data.sprite);
    texture.wrapS = texture.wrapT = THREE.repeatWrapping;
    texture.repeat.set(1, 3);

    const geometry = new THREE.BoxGeometry(data.w, data.h, data.he);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const building = new THREE.Mesh(geometry, material);
    building.position.x = data.x;
    building.position.y = data.y;
    building.position.z = data.z + data.he / 2;
    scene.add(building);

    return building;
}

function createShape(points, h = 1, img = 'img/metal.jpg') {
    let shape = new THREE.Shape();

    shape.moveTo(points[0].X, points[0].Y);

    points.forEach((point, i) => {
        if (!i) return;

        shape.lineTo(point.X, point.Y);
    });

    let texture = new THREE.TextureLoader().load(img);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(0.5, 0.5);

    const geometry = new THREE.ExtrudeGeometry(shape, { depth: h, steps: 1, bevelEnabled: false });
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);
}

function loop() {
    render.render(scene, camera);

    moveShip();

    requestAnimationFrame(loop);
}

function moveShip() {
    if (player.isForward) {
        player.currentSpeed += 0.0007;
    }
    
    if (player.isBackward) {
        player.currentSpeed -= 0.0007;
    }

    if (player.isLeftRotating) {
        sprite.rotation.z += player.rotateSpeed;
    }

    if (player.isRightRotating) {
        sprite.rotation.z -= player.rotateSpeed;
    }

    sprite.position.x += Math.cos(sprite.rotation.z + Math.PI / 2) * player.currentSpeed;
    sprite.position.y += Math.sin(sprite.rotation.z + Math.PI / 2) * player.currentSpeed;

    camera.position.x = sprite.position.x;
    camera.position.y = sprite.position.y;
}

loop();

document.addEventListener('keydown', e => {
    switch(e.code) {
        case 'KeyW':
            player.isForward = true;
            break;

        case 'KeyS':
            player.isBackward = true;
            break;

        case 'KeyA':
            player.isLeftRotating = true;
            break;

        case 'KeyD':
            player.isRightRotating = true;
            break;

        case 'KeyQ':
            camera.position.z -= 0.5;
            break;

        case 'KeyE':
            camera.position.z += 0.5;
            break;

        default: break;
    }
});
document.addEventListener('keyup', e => {
    switch(e.code) {
        case 'KeyW':
            player.isForward = false;
            break;

        case 'KeyS':
            player.isBackward = false;
            break;

        case 'KeyA':
            player.isLeftRotating = false;
            break;

        case 'KeyD':
            player.isRightRotating = false;
            break;

        default: break;
    }
});
document.addEventListener('wheel', e => {
    if (e.deltaY < 0) {
        camera.rotation.x += 0.1;
    }
    else {
        camera.rotation.x -= 0.1;
    }
});

function createShape2d(x = 0, y = 0, r = 1, angleCount = 3) {
    const step = Math.PI * 2 / angleCount;

    let angle = Math.PI * 2 * Math.random();
    let points = [];

    for(let i = 0; i < angleCount; i++) {
        points.push({
            X: x + Math.cos(angle) * r,
            Y: y + Math.sin(angle) * r,
        });

        angle += step;
    }

    return points;
}

function createBuilding(x, y) {
    for(let i = 0; i < 6; i++) {
        const shape = createShape2d(
            Math.random() + x,
            Math.random() + y,
            i === 0 ? 1 : Math.random() + 0.3,
            ~~(Math.random() * 4) + 4
        );

        createShape(shape, i + 1);
    }
}


let city = {
    x: 0,
    y: 0,
    size: ~~(Math.random() * 10 + 10),
    children: [],
    level: 0
}

function generateCity(node, params, nodes) {
    const offset = 1;
    const newNodeSize = ~~(Math.random() * 5 + 5);
    const availableAngle = params.angleEnd - params.angleStart;
    const angle = ~~(Math.random() * availableAngle + params.angleStart) * Math.PI / 180;

    let newNode = {
        x: Math.cos(angle) * (node.size + newNodeSize + offset) + node.x,
        y: Math.sin(angle) * (node.size + newNodeSize + offset) + node.y,
        size: newNodeSize,
        children: [],
        level: node.level + 1
    }

    const isIntersect = checkIntersect(newNode, nodes);
    if (isIntersect) return;

    node.children.push(newNode);
    nodes.push(newNode);

    if (newNode.level < 15 && Math.random() > 0.1) {
        generateCity(newNode, params, nodes);
    }

    if (Math.random() > 0.5) {
        generateCity(node, {
            angleStart: angle - availableAngle / 2,
            angleEnd: angle + availableAngle / 2
        }, nodes);
    }

    while (nodes.length < 15) {
        generateCity(newNode, params, nodes);
    }
}

function checkIntersect(n1, nodes) {
    return nodes.find(n2 => Math.sqrt((n1.x - n2.x)**2 + (n1.y - n2.y)**2) < n1.size + n2.size);
}

let nodes = [city];

for(let i = 0; i < 15; i++) {
    generateCity(city, {
        angleStart: 0,
        angleEnd: 360
    }, nodes);
}

nodes.forEach(node => {
    renderNode(node);

    createBuilding(
        (node.size - 3) * Math.random() + node.x,
        (node.size - 3) * Math.random() + node.y,
    );

    if (node.children.length) {
        node.children.forEach(n => {
            createConnection(node, n);
            renderNode(n);
        });
    }
});

function renderNode(node, prev) {
    const shape = createShape2d(
        node.x,
        node.y,
        node.size,
        32
    );
    createShape(shape, 0.1, 'img/metal2.jpg');
}

function createConnection(p1, p2) {
    const angle = Math.atan2(p1.y - p2.y, p1.x - p2.x) + Math.PI;

    let points = [
        {
            X: Math.cos(angle) - 2 * Math.sin(angle) + p1.x,
            Y: Math.sin(angle) + 2 * Math.cos(angle) + p1.y,
        }, {
            X: Math.cos(angle) + 2 * Math.sin(angle) + p1.x,
            Y: Math.sin(angle) - 2 * Math.cos(angle) + p1.y,
        }, {
            X: Math.cos(angle) + 2 * Math.sin(angle) + p2.x,
            Y: Math.sin(angle) - 2 * Math.cos(angle) + p2.y,
        }, {
            X: Math.cos(angle) - 2 * Math.sin(angle) + p2.x,
            Y: Math.sin(angle) + 2 * Math.cos(angle) + p2.y,
        }
    ];

    createShape(points, 0.1, 'img/metal2.jpg');
}