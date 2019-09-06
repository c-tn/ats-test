let inventoryData = {
    isOpen: false,
    width: 815,
    height: 310,
    cellSize: 50,
    cellGap: 5,
    mouseX: -50,
    mouseY: -50,
    hoveredCell: null,
    draggedCell: null,
    inventoryOffsetX: 0,
    inventoryOffsetY: 0,
    cells: []
}

function convertMouseToGameCoords({ x, y }) {
    return {
        x: canvas.width * (x / window.innerWidth),
        y: canvas.height * (y / window.innerHeight),
    }
}

canvas.addEventListener('mousemove', ({ offsetX, offsetY }) => {
    if (!inventoryData.isOpen) return;

    const { x, y } = convertMouseToGameCoords({ x: offsetX, y: offsetY });

    let hoveredCell = getCellByMouseCoords({ x, y });

    if (hoveredCell && hoveredCell.item) {
        inventoryData.hoveredCell = hoveredCell;
    }
    else {
        inventoryData.hoveredCell = null;
    }

    if (inventoryData.draggedCell) {
        inventoryData.mouseX = x - inventoryData.cellSize / 2;
        inventoryData.mouseY = y - inventoryData.cellSize / 2;
    }
});

canvas.addEventListener('mousedown', () => {
    if (!inventoryData.isOpen) return;

    if (inventoryData.hoveredCell) {
        inventoryData.draggedCell = inventoryData.hoveredCell;
    }
});

canvas.addEventListener('mouseup', ({ offsetX, offsetY }) => {
    if (!inventoryData.isOpen || !inventoryData.draggedCell) return;

    const { x, y } = convertMouseToGameCoords({ x: offsetX, y: offsetY });
    
    let hoveredCell = getCellByMouseCoords({ x, y });
    let draggedCell = inventoryData.draggedCell;

    let hoveredItem = null;
    let draggedItem = Object.assign({}, inventoryData.draggedCell.item);

    if (hoveredCell && hoveredCell.item) {
        hoveredItem = Object.assign({}, hoveredCell.item);
    }

    if (hoveredCell) {
        let canSwap = false;

        if (hoveredCell.type === slotTypes.weapons && draggedItem.type === itemTypes.weapon) {
            canSwap = true;
        }
        if (!hoveredItem && (hoveredCell.type === slotTypes.inventory || hoveredCell.type === slotTypes.shop)) {
            canSwap = true;
        }

        if (hoveredCell.type === slotTypes.shop && draggedCell.type !== slotTypes.shop) {
            playerShip.money += draggedItem.price || 0;
        }

        if (hoveredCell.type !== slotTypes.shop && draggedCell.type === slotTypes.shop) {
            if (playerShip.money >= draggedItem.price) {
                playerShip.money -= draggedItem.price || 0;
                canSwap = true;
            }
            else {
                canSwap = false;
            }
        }

        if (canSwap) {
            [ hoveredCell.item, draggedCell.item ] = [ draggedCell.item, hoveredCell.item ];
        }
    }
    
    inventoryData.mouseX = -inventoryData.cellSize;
    inventoryData.mouseY = -inventoryData.cellSize;

    inventoryData.draggedCell = null;
});

function getCellByMouseCoords({ x, y }) {
    let res = playerShip.inventory.find(cell =>
        x > cell.x + inventoryData.inventoryOffsetX &&
        x < cell.x + inventoryData.inventoryOffsetX + inventoryData.cellSize &&
        y > cell.y + inventoryData.inventoryOffsetY &&
        y < cell.y + inventoryData.inventoryOffsetY + inventoryData.cellSize
    );

    if (!playerShip.currentTrigger || !playerShip.currentTrigger.isOpen || res) return res;

    return playerShip.currentTrigger.items.find(cell =>
        x > cell.x - inventoryData.inventoryOffsetX &&
        x < cell.x - inventoryData.inventoryOffsetX + inventoryData.cellSize &&
        y > cell.y - inventoryData.inventoryOffsetY &&
        y < cell.y - inventoryData.inventoryOffsetY + inventoryData.cellSize
    );
}

function showItemDescription() {
    if (!inventoryData.hoveredCell) return;

    const x = inventoryData.hoveredCell.x + inventoryData.cellSize
    const y = inventoryData.hoveredCell.y;

    const item = inventoryData.hoveredCell.item;

    const offsetX = inventoryData.hoveredCell.type === slotTypes.shop
        ? -inventoryData.inventoryOffsetX
        : inventoryData.inventoryOffsetX;

    const offsetY = inventoryData.hoveredCell.type === slotTypes.shop
        ? -inventoryData.inventoryOffsetY
        : inventoryData.inventoryOffsetY;

    ctx.fillStyle = 'rgba(0, 0, 0, .5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.fillRect(
        x + offsetX,
        y + offsetY,
        200,
        200
    );
    ctx.fillStyle = 'rgba(255, 255, 255, .7)';
    ctx.font = "20px sans-serif";

    ctx.fillText(
        `${ item.name } (${ item.price })`,
        x + 100 + offsetX,
        y + 5 + offsetY
    );

    ctx.font = "15px sans-serif";

    ctx.fillText(
        item.description,
        x + 100 + offsetX,
        y + 30 + offsetY
    );

    if (item.stats) {
        Object.keys(item.stats).forEach((key, i) => {
            ctx.fillText(
                `${ key }: ${ item.stats[key] }`,
                x + 100 + offsetX,
                y + (20 * i) + 50 + offsetY
            );
        });
    }
}

function showDraggingCell() {
    if (!inventoryData.draggedCell) return;

    ctx.fillStyle = 'rgba(150, 150, 150, .3)';

    ctx.fillRect(
        inventoryData.mouseX,
        inventoryData.mouseY,
        inventoryData.cellSize,
        inventoryData.cellSize
    );
}

function drawInventory() {
    if (!inventoryData.isOpen) return;

    ctx.fillStyle = 'rgba(0, 0, 0, .5)';

    ctx.fillRect(
        canvas.width / 2 - inventoryData.width / 2 + inventoryData.inventoryOffsetX,
        canvas.height / 2 - inventoryData.height / 2 + inventoryData.inventoryOffsetY,
        inventoryData.width,
        inventoryData.height
    );

    playerShip.inventory.forEach(cell => {
        if (cell.item) {
            ctx.fillStyle = 'rgba(150, 150, 150, .5)';
        }
        else {
            ctx.fillStyle = 'rgba(0, 0, 0, .5)';
        }

        ctx.fillRect(
            cell.x + inventoryData.inventoryOffsetX,
            cell.y + inventoryData.inventoryOffsetY,
            inventoryData.cellSize,
            inventoryData.cellSize
        );
    });

    ctx.font = "20px sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(150, 150, 150, 1)';

    ctx.fillText(
        playerShip.money,
        canvas.width / 2 - inventoryData.width / 2 + inventoryData.inventoryOffsetX,
        canvas.height / 2 + inventoryData.height / 2 + inventoryData.inventoryOffsetY
    );

    showItemDescription();
    showDraggingCell();
}

function createInventory(ship) {
    const size = inventoryData.cellSize;
    const gap = inventoryData.cellGap;

    const seed = new RNG(ship.id.toString(36));

    const weaponSlotsCount = 5 || Math.floor(seed.unit() * 5) + 1;
    const inventorySlotsCount = 15 || Math.floor(seed.unit() * 15) + 3;

    // WEAPONS
    for (let i = 0; i < weaponSlotsCount; i++) {
        let item = null;

        if (seed.unit() > 0.4) {
            item = {
                name: seed.unitString(),
                description: `weapon ${ i }`,
                type: itemTypes.weapon,
                lastShot: performance.now(),
                price: Math.floor(seed.unit() * 100) + 10,
                stats: {
                    reload: Math.floor(seed.unit() * 300 + 100),
                    damage: Math.floor(seed.unit() * 50 + 5)
                }
            }
        }

        ship.inventory.push({
            x: canvas.width / 2 - inventoryData.width / 2 + i * size + gap,
            y: canvas.height / 2 - inventoryData.height / 2 + gap,
            type: slotTypes.weapons,
            index: ship.inventory.length,
            item
        });
    }

    const inventoryOffset = size * 5 + gap * 2;
    const itemsInRow = Math.floor((inventoryData.width - inventoryOffset) / size);

    // ANOTHER
    for (let i = 0, row = 0, counter = 0; i < inventorySlotsCount; i++) {
        if (i && i % itemsInRow === 0) {
            row += size;
            counter = 0;
        }

        let item = null;

        if (i && i % 5 === 0) {
            item = {
                name: seed.unitString(),
                description: `item ${ i }`,
                price: Math.floor(seed.unit() * 100) + 10,
                type: itemTypes.another
            }
        }

        let x = canvas.width / 2 - inventoryData.width / 2 + counter * size + inventoryOffset;
        let y = canvas.height / 2 - inventoryData.height / 2 + row + gap;

        ship.inventory.push({
            x,
            y,
            type: slotTypes.inventory,
            index: ship.inventory.length,
            item
        });

        counter++;
    }
}

function drawShop() {
    if (!playerShip.currentTrigger || !playerShip.currentTrigger.isOpen) return;

    ctx.fillStyle = 'rgba(0, 0, 0, .5)';

    ctx.fillRect(
        canvas.width / 2 - inventoryData.width / 2 - inventoryData.inventoryOffsetX,
        canvas.height / 2 - inventoryData.height / 2 - inventoryData.inventoryOffsetY,
        inventoryData.width,
        inventoryData.height
    );

    playerShip.currentTrigger.items.forEach(cell => {
        if (cell.item) {
            ctx.fillStyle = 'rgba(150, 150, 150, .5)';
        }
        else {
            ctx.fillStyle = 'rgba(0, 0, 0, .5)';
        }

        ctx.fillRect(
            cell.x - inventoryData.inventoryOffsetX,
            cell.y - inventoryData.inventoryOffsetY,
            inventoryData.cellSize,
            inventoryData.cellSize
        );
    });
}

function createShopStuff(shop) {
    const seed = new RNG(shop.id.toString(36).substr(2));

    const stuffCount = Math.floor(seed.unit() * 15) + 3;
    const size = inventoryData.cellSize;
    const gap = inventoryData.cellGap;

    const itemsInRow = Math.floor(inventoryData.width / size);

    for (let i = 0, row = 0, counter = 0, itemCounter = 0; i < 96; i++) {
        if (i && i % itemsInRow === 0) {
            row += size;
            counter = 0;
        }

        let x = canvas.width / 2 - inventoryData.width / 2 + counter * size + gap;
        let y = canvas.height / 2 - inventoryData.height / 2 + row + gap;

        let item = null;

        if (itemCounter < stuffCount) {
            if (seed.unit() > 0.8) {
                item = {
                    name: seed.unitString(),
                    description: `weapon ${ i }`,
                    type: itemTypes.weapon,
                    lastShot: performance.now(),
                    price: Math.floor(seed.unit() * 100) + 10,
                    stats: {
                        reload: Math.floor(seed.unit() * 300 + 100),
                        damage: Math.floor(seed.unit() * 50 + 5)
                    }
                }
            }
            else {
                item = {
                    name: seed.unitString(),
                    description: `item ${ i }`,
                    type: itemTypes.another,
                    price: Math.floor(seed.unit() * 100) + 10
                }
            }
        }

        shop.items.push({
            x,
            y,
            type: slotTypes.shop,
            index: playerShip.currentTrigger.items.length,
            item
        });

        counter++;
        itemCounter++;
    }
}