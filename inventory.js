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
    inventoryOffsetY: 0
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

canvas.addEventListener('mousedown', (e) => {
    if (!inventoryData.isOpen || e.which === keys.mouseright) return;

    if (inventoryData.hoveredCell) {
        inventoryData.draggedCell = inventoryData.hoveredCell;
    }
});

canvas.addEventListener('mouseup', ({ offsetX, offsetY, which }) => {
    if (!inventoryData.isOpen) return;

    if (which === keys.mouseleft && inventoryData.draggedCell) {
        const { x, y } = convertMouseToGameCoords({ x: offsetX, y: offsetY });
        
        let hoveredCell = getCellByMouseCoords({ x, y });
        let draggedCell = inventoryData.draggedCell;

        let hoveredItem = null;
        let draggedItem = Object.assign({}, inventoryData.draggedCell.item);

        if (hoveredCell && hoveredCell.item) {
            hoveredItem = Object.assign({}, hoveredCell.item);
        }
        
        inventoryData.mouseX = -inventoryData.cellSize;
        inventoryData.mouseY = -inventoryData.cellSize;

        inventoryData.draggedCell = null;

        if (!hoveredCell) return;

        // From inv to shop
        if (draggedCell.type !== slotTypes.shop && hoveredCell.type === slotTypes.shop) {
            let findedCell = playerShip.currentTrigger.items.find(cell =>
                cell.item && cell.item.name === draggedItem.name &&
                cell.item.type === itemTypes.another
            );

            if (findedCell) {
                findedCell.item.count += draggedItem.count;
                draggedCell.item = null;
                playerShip.money += draggedItem.count * draggedItem.price;
            }
            else {
                if (!hoveredCell.item) {
                    findedCell = hoveredCell;
                }
                else {
                    findedCell = playerShip.currentTrigger.items.find(cell => !cell.item);
                }

                findedCell.item = draggedItem;
                draggedCell.item = null;
                playerShip.money += draggedItem.price * (draggedItem.count || 1);
            }
        }
        // From shop to inv
        else if (draggedCell.type === slotTypes.shop && hoveredCell.type !== slotTypes.shop) {
            // Weapon
            if (!hoveredCell.item && playerShip.money > draggedItem.price && draggedItem.type === itemTypes.weapon) {
                hoveredCell.item = draggedItem;
                draggedCell.item = null;
                playerShip.money -= draggedItem.price;
            }
            // Another
            else if (draggedItem.type === itemTypes.another && hoveredCell.type !== slotTypes.weapons) {
                let findedCell = playerShip.inventory.find(cell => 
                    cell.item && cell.item.name === draggedItem.name
                );

                const totalPrice = draggedItem.price * (draggedItem.count || 1);

                if (findedCell && playerShip.money > totalPrice) {
                    findedCell.item.count += draggedItem.count;
                    draggedCell.item = null;
                    playerShip.money -= totalPrice;
                }
                else if (playerShip.money > totalPrice){
                    if (!hoveredCell.item) {
                        findedCell = hoveredCell;
                    }
                    else {
                        findedCell = playerShip.currentTrigger.items.find(cell => !cell.item);
                    }

                    findedCell.item = draggedItem;
                    draggedCell.item = null;
                    playerShip.money -= totalPrice;
                }
            }
        }
        // From inv to inv
        else if (hoveredCell.type !== slotTypes.shop) {
            // Weapon to another
            if (!hoveredCell.item && hoveredCell.type === slotTypes.inventory) {
                hoveredCell.item = draggedItem;
                draggedCell.item = null;
            }
            // Another to weapon
            else if (!hoveredCell.item && hoveredCell.type === slotTypes.weapons && draggedItem.type === itemTypes.weapon) {
                hoveredCell.item = draggedItem;
                draggedCell.item = null;
            }
            // Swap weapons
            else if (draggedItem.type === itemTypes.weapon && hoveredItem.type === itemTypes.weapon) {
                [ hoveredCell.item, draggedCell.item ] = [ draggedCell.item, hoveredCell.item ];
            }
        }
    }
    // Right click sell\buy
    else if (!inventoryData.draggedCell && which === keys.mouseright) {
        const { x, y } = convertMouseToGameCoords({ x: offsetX, y: offsetY });

        let hoveredCell = getCellByMouseCoords({ x, y });
        let hoveredItem = null;

        if (hoveredCell && hoveredCell.item) {
            hoveredItem = Object.assign({}, hoveredCell.item);
        }

        if (!hoveredItem) return;

        // Buy another items
        if (hoveredCell.type === slotTypes.shop && playerShip.money > hoveredItem.price && hoveredItem.type === itemTypes.another) {
            let findedCell = playerShip.inventory.find(cell => cell.item && cell.item.name === hoveredItem.name);

            if (findedCell) {
                findedCell.item.count += 1;
                hoveredCell.item.count -= 1;
                playerShip.money -= hoveredItem.price;

                if (hoveredCell.item.count <= 0) {
                    hoveredCell.item = null;
                    inventoryData.hoveredCell = null;
                }
            }
            else {
                findedCell = playerShip.inventory.find(cell => !cell.item && cell.type === slotTypes.inventory);

                hoveredItem.count = 1;
                findedCell.item = hoveredItem;
                hoveredCell.item.count -= 1;
                playerShip.money -= hoveredItem.price;
            }
        }
        // Buy weapons
        else if (hoveredCell.type === slotTypes.shop && playerShip.money > hoveredItem.price && hoveredItem.type === itemTypes.weapon) {
            let findedCell = playerShip.inventory.find(cell => !cell.item && cell.type === slotTypes.inventory);

            if (findedCell) {
                findedCell.item = hoveredItem;
                hoveredCell.item = null;
                playerShip.money -= hoveredItem.price;
                inventoryData.hoveredCell = null;
            }
        }
        // Sell another items
        else if (hoveredCell.type === slotTypes.inventory && hoveredItem.type === itemTypes.another) {
            let findedCell = playerShip.currentTrigger.items.find(cell => cell.item && cell.item.name === hoveredItem.name);

            if (findedCell) {
                findedCell.item.count += 1;
                hoveredCell.item.count -= 1;
                playerShip.money += hoveredItem.price;

                if (hoveredCell.item.count <= 0) {
                    hoveredCell.item = null;
                    inventoryData.hoveredCell = null;
                }
            }
            else {
                findedCell = playerShip.currentTrigger.items.find(cell => !cell.item && cell.type === slotTypes.shop);

                hoveredItem.count = 1;
                findedCell.item = hoveredItem;
                hoveredCell.item.count -= 1;
                playerShip.money -= hoveredItem.price;
            }
        }
        else if (hoveredCell.type !== slotTypes.shop && hoveredItem.type === itemTypes.weapon) {
            let findedCell = playerShip.currentTrigger.items.find(cell => !cell.item && cell.type === slotTypes.shop);

            if (findedCell) {
                findedCell.item = hoveredItem;
                hoveredCell.item = null;
                playerShip.money += hoveredItem.price;
                inventoryData.hoveredCell = null;
            }
        }
    }
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

    ctx.fillStyle = 'rgba(255, 255, 255, .5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.fillRect(
        x + offsetX,
        y + offsetY,
        200,
        200
    );
    ctx.fillStyle = '#000';
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

        if (cell.item && cell.item.count) {
            ctx.fillStyle = 'rgba(255, 255, 255, .8)';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';

            ctx.fillText(
                cell.item.count,
                cell.x + inventoryData.inventoryOffsetX + inventoryData.cellSize,
                cell.y + inventoryData.inventoryOffsetY + inventoryData.cellSize
            );
        }
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

function createInventory(ship, level) {
    const size = inventoryData.cellSize;
    const gap = inventoryData.cellGap;

    const seed = new RNG(ship.id.toString(36));

    const weaponSlotsCount = 5 || Math.floor(seed.unit() * 5) + 1;
    const inventorySlotsCount = 15 || Math.floor(seed.unit() * 15) + 3;

    // WEAPONS
    for (let i = 0; i < weaponSlotsCount; i++) {
        let item = null;

        if (seed.unit() > 0.4) {
            item = createItem(seed, itemTypes.weapon, level);
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
            item = createItem(seed, itemTypes.another);
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

        if (cell.item && cell.item.count) {
            ctx.fillStyle = 'rgba(255, 255, 255, .8)';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';

            ctx.fillText(
                cell.item.count,
                cell.x - inventoryData.inventoryOffsetX + inventoryData.cellSize,
                cell.y - inventoryData.inventoryOffsetY + inventoryData.cellSize
            );
        }
    });
}

function changeInventoryPrice() {
    playerShip.inventory.forEach(cell => {
        if (!cell.item || cell.item.type === itemTypes.weapon) return;

        cell.item.price = computeItemPrice(itemCategories[cell.item.name]);
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

        const x = canvas.width / 2 - inventoryData.width / 2 + counter * size + gap;
        const y = canvas.height / 2 - inventoryData.height / 2 + row + gap;

        let item = null;
        let findedItem = null;

        if (itemCounter < stuffCount) {
            const chance = ~~(seed.unit() * 10);

            switch(chance) {
                case 0:
                    item = createItem(seed, itemTypes.weapon);
                    break;
                default:
                    item = createItem(seed, itemTypes.another);
                    break;
            }

            findedItem = shop.items.find(cell => 
                cell.item && cell.item.name === item.name
            );

            if (findedItem) {
                findedItem.item.count += item.count;

                item = null;
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

/**
 * 
 * @param {object} seed seed for items
 * @param {string} type items type (weapon/another)
 */
function createItem(seed, type, level) {
    if (type === itemTypes.weapon) {
        level = level === undefined
            ? Math.floor(seed.unit() * config.itemsLevel.length)
            : level;

        const maxLevel = config.itemsLevel.length;
        const data = config.itemsLevel[level];

        const reload = data.reload.min + ~~(data.reload.mid * seed.unit());
        const damage = data.damage.min + ~~(data.damage.mid * seed.unit());
        const price = ~~(1000 / reload * damage * 500 / (maxLevel - level + 1));

        return {
            name: 'Weapon',
            description: `ls-${ level } type.`,
            type: itemTypes.weapon,
            lastShot: performance.now(),
            price,
            stats: {
                reload,
                damage
            }
        }
    }
    else {
        const itemId = ~~(legalItems.length * seed.unit());
        
        const item = legalItems[itemId];
        const price = computeItemPrice(item);
        const count = computeItemCount(item);

        return {
            name: item.name,
            description: 'Legal item',
            type: itemTypes.another,
            price,
            count
        }
    }
}

function computeItemPrice(item) {
    const availability = currentSystem.availabilityItems[item.name];

    return item.price.min + ~~(item.price.mid * availability);
}

function computeItemCount(item) {
    const availability = currentSystem.availabilityItems[item.name];

    return ~~(availability * 10);
}