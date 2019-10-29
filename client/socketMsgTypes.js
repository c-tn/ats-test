const socketMsgTypes = {
    firstConnect: 'firstConnect',
    respawn: 'respawn',
    dead: 'dead',
    shot: 'shot',
    createParticles: 'createParticles',
    disconnect: 'disconnect',
    updateGameData: 'updateGameData',
    updatePlayerData: 'updatePlayerData',
    log: 'log'
}

try {
    module.exports = socketMsgTypes;
}
catch(e) {

}
