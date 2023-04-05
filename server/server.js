const express = require("express");
const socket = require('socket.io');
const app = express();
const short = require('short-uuid');
const mysql = require('mysql');

const Player = require("./Player");
const Door = require("./Door");
const Bullet = require("./Bullet");
const Enemy = require("./Enemy");
const RoundInfo = require("./RoundInfo");
//const { Client } = require("socket.io/dist/client");

const MAP_lvl_square_o1 = require('./maps/lvl_square_01/map.js')

const ROOM_MAX_CAPACITY = 4;

const server = 3000 /// app.listen(process.env.PORT || 3000);
console.log('The server is now running at port ' + process.env.PORT);
app.use(express.static("public"));
const io = socket(server);

let sqlConnected = false;
let LBsolos;
let LBduos;
let LBtrios;
let LBquads;

// const connection = mysql.createConnection({
//     host: 'cgrozdatabase.ciimbtwlcait.us-east-1.rds.amazonaws.com', // host for connection
//     port: '3306', // default port for mysql is 3306
//     database: 'sys', // database from which we want to connect out node application
//     user: 'admin', // username of the mysql connection
//     password: 'SQL45rootuser.0' // password of the mysql connection
// });

// try {
//     connection.connect();
//     sqlConnected = true;
//     updateLeaderBoard();
//     console.log('sql connected');
// } catch (err) {
//     console.log('unable to connect to mysql err: ' + err);
//     sqlConnected = false;
// }

let lobbies = [];
let rooms = [short.generate()];
let lastRoomLoggedInDB = "";
let players = [];
let doors = [];
let roundInfos = [];
let userCounter = 0;
let bullets = [];
var enemies = []
var mapData;
var sessionInfo = [];
var playerKills;
var deadEnemies = []
const actionsData = {
    firedBullets: [
        // example:
        // {
        //     "gunName": "M1911",
        //     "startX": 340.5786693928469,
        //     "startY": 311.1392587706047,
        //     "damage": 20,
        //     "velocity": 8,
        //     "angle": 0.5635034222608851,
        //     "sprayDeviation": 0,
        //     "playerFired": 0,
        //     "roomId": "ewEePFD2iYMACJ2iFvmN1A",
        //     "decreaseConstant": 5,
        //     "bulletDecay": 0
        // }
    ],
    drawBlood: [
        // example
        // {
        //     x: 34.70,
        //     y: 298.11
        // }
    ]
}
setInterval(updateGame, 8); //default 16 
setInterval(updateLeaderBoard, 12000);


io.sockets.on('connection', function (socket) {
    console.log("New connection " + socket.id);

    /**
     * create lobby
     * @param data {object} example: {playerName: 'Player', selectedLevelData: {levelId: 0, levelName: 'Default Level'}}
     */
    socket.on('createLobby', (data) => {
        const timestamp = Date.now()
        const lobbyId = timestamp.toString()

        // store lobby data
        const lobbyData = {
            lobbyId: lobbyId,
            players: [
                {
                    id: socket.id,
                    name: data.playerName,
                }
            ],
            selectedLevelData: {
                levelId: data.selectedLevelData.levelId,
                levelName: data.selectedLevelData.levelName,
            }
        }
        lobbies.push(lobbyData)

        socket.join(lobbyId);
        socket.lobbyId = lobbyId
        socket.playerName = data.playerName
        console.log(`Player connected to lobby: ${lobbyId}`)

        io.to(lobbyId).emit('lobbyCreated', lobbyData);
    })

    /**
     * change lobby selected level
     * @param _selectedLevelData {object} example: {levelId: 0, levelName: 'Default Level'}
     */
    socket.on('changeLobbySelectedLevel', (_selectedLevelData) => {
        const lobbyId = (socket.lobbyId).toString()
        console.log(`Changed lobby ${lobbyId} level to: ${(_selectedLevelData.levelId).toString()} - ${_selectedLevelData.levelName}`)

        // update lobby
        const lobbyIndex = lobbies.findIndex(lobby => (lobby.lobbyId).toString() == lobbyId.toString())
        lobbies[lobbyIndex]['selectedLevelData']['levelId'] = (_selectedLevelData.levelId).toString()
        lobbies[lobbyIndex]['selectedLevelData']['levelName'] = _selectedLevelData.levelName

        // emit to all lobby players
        io.to(lobbyId).emit('changeLobbySelectedLevel', _selectedLevelData);
    })

    /**
     * change lobby player name
     * @param _newPlayerName {string} example: John Smith
     */
    socket.on('changeLobbyPlayerName', (_newPlayerName) => {
        const lobbyId = (socket.lobbyId).toString()
        console.log(`Player in lobby ${lobbyId} changed his name to: ${_newPlayerName}`)

        // update socket player name
        socket.playerName = _newPlayerName

        // update lobby
        const lobbyIndex = lobbies.findIndex(lobby => (lobby.lobbyId).toString() == lobbyId) // example: 0
        // find player in lobby players
        const lobbyPlayers = lobbies[lobbyIndex]['players']
        const playerIndexInLobby = lobbyPlayers.findIndex(lobbyPlayer => (lobbyPlayer.id).toString() == (socket.id).toString()) // example: 1
        // update player name
        lobbies[lobbyIndex]['players'][playerIndexInLobby]['name'] = _newPlayerName

        // emit to update players list
        io.to(lobbyId).emit('updateLobbyPlayersList', lobbies[lobbyIndex]['players']);
    })

    /**
     * join lobby id
     * @param _joinedPlayerData {object} example: { lobbyId: '1', playerName: '2' }
     */
    socket.on('joinLobbyId', (_joinedPlayerData) => {
        const lobbyId = _joinedPlayerData.lobbyId.toString()

        // check if lobby id exists
        const lobbyIndex = lobbies.findIndex(lobby => (lobby.lobbyId).toString() == lobbyId)
        if (lobbyIndex == -1) {
            // return back to emit
            socket.emit('lobbyJoinError', 'Lobby ID not found')
        }
        // lobby found
        else {
            // update lobby players
            const newJoinedPlayerData = {
                id: (socket.id).toString(),
                name: _joinedPlayerData.playerName,
            }

            console.log(`Player joined lobby: ${lobbyId}`)
            lobbies[lobbyIndex]['players'].push(newJoinedPlayerData)

            // update socket
            socket.join(lobbyId);
            socket.lobbyId = lobbyId
            socket.playerName = _joinedPlayerData.playerName

            // emit to update players list
            io.to(lobbyId).emit('updateLobbyPlayersList', lobbies[lobbyIndex]['players']);

            io.to(lobbyId).emit('lobbyJoinedSuccessfully', {playerName: _joinedPlayerData.playerName});
        }

        console.log('good')
    })

    socket.on('start', function (data) {
        updateLeaderBoard();
        userCounter++;

        // check lobby
        var roomId;
        if (data.lobby !== null && data.lobby !== '') {
            roomId = data.lobby
            rooms.push(roomId);
        }
        else {
            roomId = getRoom()
        }
        socket.join(roomId);

        console.log(`Player joined lobby ${roomId}`)

        var playersInRoom = players.filter(p => p.roomId == roomId);

        let playerInfo = {
            playerNum: userCounter, roomId: roomId, index: players.length, roomIndex: playersInRoom.length,
        }
        socket.emit('setPlayerNum', playerInfo);

        players.push(new Player(socket.id, roomId, userCounter, data.winL, data.winW, data.decX, data.decY, 0, players.length, 0));
    });

    socket.on('drawData', function (data) {
        if (players[data.index] != null) {
            players[data.index].decY = data.decY;
            players[data.index].decX = data.decX;
            players[data.index].angle = data.angle;
            players[data.index].gun = data.gunIndex;
        }
    });

    socket.on('bulletFired', function (bulletData) {
            actionsData['firedBullets'] = []

            if (bulletData.startX != null) {
                bullets.push(new Bullet(bulletData.startX, bulletData.startY, bulletData.angle, bulletData.damage, bulletData.velocity, bulletData.sprayDeviation, bulletData.playerFired, bulletData.roomId, bulletData.decreaseConstant, bulletData.bulletDecay, bulletData.gunName));

                actionsData['firedBullets'].push(bulletData)
            }

            io.to(bulletData.roomId).emit("actionsData", actionsData);
    });

    socket.once('allPlayersDowned', function (playerInfo) {
        var gameActive = false;
        io.to(playerInfo.roomId).emit('sessionOver', gameActive);
        sendGameDataToDataBase(playerInfo.roomId);
    });

    socket.on('nameChange', function (nameData) {
        players.forEach(player => {
            if (player.number == nameData.number) {
                player.name = nameData.name;
            }
        })
    });

    socket.on('playerRevive', function (downedPlayer) {
        players[downedPlayer.index].gun = 0;
        players[downedPlayer.index].downed = false;
        players[downedPlayer.index].health = 100;
        io.to(downedPlayer.roomId).emit('playerRevived', downedPlayer);
    })


    socket.on('openDoor', function (doorData) {
        doors.forEach(door => {
            if (door.roomId == doorData.roomId && door.doorNum == doorData.doorNum) {
                door.open = true;
                let roundInfo = roundInfos.filter(r => r.roomId == doorData.roomId);
                doorData.spawnsActivate.forEach(spawn => {
                    roundInfos[roundInfo[0].index].spawnsActive.push(spawn);
                });
            }
        })
    })
    socket.once('mapData', function (mapCoords) {
        // get map coords
        let roundInfo = roundInfos.filter(r => r.roomId == socket.roomId);
        console.log(socket.roomId)

        mapData = mapCoords;
        currentDoorCoords = mapCoords.doorCoords;
    });

    socket.once('startRoom', function (_roomData) {
        const room  =_roomData['roomId']

        currentDoorCoords = MAP_lvl_square_o1.coords

        console.log('here')
        console.log(currentDoorCoords)


        // get map enemies spawns locations
        let MAP_enemySpawns = getMapEnemiesSpawns(_roomData['map'])

        doors.push(new Door(1, room, 1000, 600, 200, 30, 200, 50, 25, [1, 5]))
        doors.push(new Door(2, room, 1000, 700, 700, 30, 200, 50, 25, [3, 4]))
        // enemies.push(new Enemy(0, enemies.length, .25, 25, .25, room, 0));
        // enemies.push(new Enemy(2, enemies.length, .25, 25, .25, room, 0));

        // start round 1 with these spawns
        enemies.push(new Enemy(0, enemies.length, .25, 25, .25, room, 0, MAP_enemySpawns));
        enemies.push(new Enemy(2, enemies.length, .25, 25, .25, room, 0, MAP_enemySpawns));
        // enemies.push(new Enemy(1, enemies.length, .25, 25, .25, room, 0, MAP_enemySpawns));

        roundInfos.push(new RoundInfo(room, roundInfos.length));
        var playersInRoomStart = players.filter(p => p.roomId == room);
        var playerNames = "";
        playersInRoomStart.forEach(player => {
            playerNames += player.name + ", ";
        });
        playerNames = playerNames.substring(0, playerNames.length - 2);
        sessionInfo.push([room, 0, playersInRoomStart.length, playerNames]);
        let doorsInRoomStart = doors.filter(d => d.roomId == room);
        io.to(room).emit("startGame", doorsInRoomStart);
    });


    socket.on("disconnect", () => {
        //io.sockets.emit("disconnect", socket.id);
        tempPlayer = players.filter(player => player.id == socket.id);
        players = players.filter(player => player.id !== socket.id);
        if (tempPlayer[0] != null) {
            updateIndexes(tempPlayer[0].index);
        }

        console.log(`Player disconnected from lobby: ${socket.lobbyId}`)

        // remove player from lobby
        const lobbyIndex = lobbies.findIndex(lobby => lobby.lobbyId == socket.lobbyId)
        if (lobbyIndex !== -1) {
            const lobbyData = lobbies[lobbyIndex]
            lobbyData.players.splice(lobbyData.players.indexOf(socket.playerName), 1)

            // delete lobby if it has no players
            if (lobbyData.players.length === 0) {
                lobbies.splice(lobbyIndex, 1)
                console.log(`Lobby deleted: ${socket.lobbyId}`)
            }
        }

        console.log(socket.lobbyId)

        socket.leave(socket.lobbyId)
    });


});


function updateGame() {
    for (const room of rooms) {
        try {
            var playersInRoom = players.filter(p => p.roomId === room);
            var doorsInRoom = doors.filter(d => d.roomId === room);
            var bulletsInRoom = bullets.filter(b => b.roomId === room);
            var enemiesInRoom = enemies.filter(e => e.roomId === room);
            var roundInfoInRoom = roundInfos.filter(r => r.roomId === room);
            var deadEnemiesInRoom = deadEnemies.filter(deadEnemy => deadEnemy.roomId === room)

            io.to(room).emit("heartbeat", playersInRoom);
            io.to(room).emit("doorData", doorsInRoom);
            io.to(room).emit('bulletData', bulletsInRoom);
            io.to(room).emit('enemyData', enemiesInRoom);
            io.to(room).emit('roundData', roundInfoInRoom);
            io.to(room).emit('deadEnemies', deadEnemiesInRoom);

            players.forEach(element => {
                if (element != null) {
                    playerKills.push(element.kills);
                    element.x = returnPlayerLocationX(element.decX);
                    element.y = returnPlayerLocationY(element.decY);
                }
            });

            playersInRoom.forEach(player => {
                if (player.health <= 0 && !player.downed) {
                    player.downed = true;
                    player.gun = 9;
                    let playerData = {
                        id: player.id, roomId: room, name: player.name, index: player.index,
                    }
                    io.to(room).emit('playerDown', playerData);
                    io.to(room).emit('downedPlayerMessage', playerData);
                }
            })


            if (roundInfoInRoom[0] != null) {
                if (roundInfoInRoom[0].enemiesRemaining <= 0 && enemiesInRoom.length == 0 && roundInfoInRoom[0].enemyCounter == roundInfoInRoom[0].roundEnemyAmount) {
                    roundInfos[roundInfoInRoom[0].index].round++;
                    roundInfos[roundInfoInRoom[0].index].enemyCounter = 0;
                    roundInfos[roundInfoInRoom[0].index].roundEnemyAmount = 2 * roundInfos[roundInfoInRoom[0].index].round + 4;
                    roundInfos[roundInfoInRoom[0].index].enemiesRemaining = roundInfos[roundInfoInRoom[0].index].roundEnemyAmount;
                    if (roundInfos[roundInfoInRoom[0].index].enemySpeed <= 1) {
                        roundInfos[roundInfoInRoom[0].index].enemySpeed += .05;
                    }
                    if (roundInfos[roundInfoInRoom[0].index].timeBetweenEnemies >= 200) {
                        roundInfos[roundInfoInRoom[0].index].timeBetweenEnemies -= 20;
                    }
                    roundInfos[roundInfoInRoom[0].index].enemyStartingHealth += 5;

                }
                spawnEnemies(roundInfos[roundInfoInRoom[0].index]);
            }


            updateBullets(room);
            moveEnemies(room);
            playerEnemyContact(playersInRoom, enemiesInRoom);


            if (playersInRoom.length == 0) {
                rooms = rooms.filter(r => r != room);
                console.log("Removed room " + room);
            }

            io.to(room).emit('killData', playerKills);

            playerKills = [];


        } catch (err) {
            console.log("room: " + room + " err: " + err);
            rooms = rooms.filter(r => r != room);
            console.log("Removed room due to err" + room);
            sendGameDataToDataBase(room);
        }
    }
}

function sendGameDataToDataBase(roomId) {
    if (sqlConnected) {
        var kills = sessionInfo.filter(session => session[0] == roomId)[0][1];
        var gameType;
        var numPlayers = sessionInfo.filter(session => session[0] == roomId)[0][2];
        var playerNamesString = sessionInfo.filter(session => session[0] == roomId)[0][3];

        if (numPlayers == 1) {
            //gameType = "solos";
            gameType = "solos";
        } else if (numPlayers == 2) {
            //gameType = "duos";
            gameType = "duos";
        } else if (numPlayers == 3) {
            //gameType = "trios";
            gameType = "trios";
        } else if (numPlayers == 4) {
            //gameType = "quads";
            gameType = "quads";
        }
        var today = new Date().toLocaleString('en-us', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2');

        var sql = "INSERT INTO " + gameType + " (name, kills, date) VALUES ('" + playerNamesString + "', '" + kills + "', '" + today + "')";
        if (lastRoomLoggedInDB != roomId || gameType == "") {
            connection.query(sql, function (err, result) {
                if (err) throw err;
                console.log("1 record inserted");
            });
            lastRoomLoggedInDB = roomId;
        }

    }
}

function updateLeaderBoard() {
    return;
    if (sqlConnected) {
        try {
            var sql = "SELECT * FROM solos ORDER BY kills DESC LIMIT 0, 3;"
            connection.query(sql, function (err, result) {
                if (err) throw err;
                LBsolos = result;
            });

            sql = "SELECT * FROM duos ORDER BY kills DESC LIMIT 0, 3;"
            connection.query(sql, function (err, result) {
                if (err) throw err;
                LBduos = result;
            });

            sql = "SELECT * FROM trios ORDER BY kills DESC LIMIT 0, 3;"
            connection.query(sql, function (err, result) {
                if (err) throw err;
                LBtrios = result;
            });

            sql = "SELECT * FROM quads ORDER BY kills DESC LIMIT 0, 3;"
            connection.query(sql, function (err, result) {
                if (err) throw err;
                LBquads = result;
            });
            data = {
                solos: LBsolos, duos: LBduos, trios: LBtrios, quads: LBquads,
            };
            io.sockets.emit('leaderBoardData', data);
        } catch (err) {
            console.log(err);
        }
    }
}

function returnPlayerLocationX(decimal) {
    return (1000 * decimal);
}

function returnPlayerLocationY(decimal) {
    return (1500 * decimal);
}

function updateIndexes(removedIndex) {
    for (var i = removedIndex; i < players.length; i++) {
        players[i].index--;
    }
    for (const room of rooms) {
        io.to(room).emit("updateIndex", removedIndex);
    }
}

function getRoom() {
    let leastPopulatedCount = Infinity;
    let leastPopulatedRoom = rooms[0];

    for (const room of rooms) {
        let roomRoundInfo = roundInfos.filter(r => r.roomId === room);
        if (roomRoundInfo[0] == null || roomRoundInfo[0].gameActive == false) {
            const count = players.filter(p => p.roomId == room).length;
            if (count < leastPopulatedCount) {
                leastPopulatedCount = count;
                leastPopulatedRoom = room;
            }
        }
    }

    if (leastPopulatedCount >= ROOM_MAX_CAPACITY) {

        const newRoom = short.generate()
        console.log('Creating new room', newRoom);
        rooms.push(newRoom);
        leastPopulatedRoom = newRoom;
    }
    return leastPopulatedRoom;
}

function rectangleContains(x, y, rectX, rectY, rectL, rectW) {
    if ((x > rectX) && (x < rectX + rectL) && (y > rectY) && (y < rectY + rectW)) {
        return true;
    }
    return false
}

function enemyContainsBullet(enemyX, enemyY, bulletX, bulletY) {
    if (bulletX == null || enemyX == null) {
        return false;
    }
    var distance = Math.sqrt(Math.pow(enemyX - bulletX, 2) + Math.pow(enemyY - bulletY, 2));
    if (distance <= 30) {
        return true;
    }
    return false;
}

function removeEnemy(index, roomId) {

    enemies.splice(index, 1);
    if (enemies.length > 0) {
        for (var i = index; i < enemies.length; i++) {
            if (enemies[i] != null) {
                enemies[i].index--;
            }
        }
    }
    let roundInfo = roundInfos.filter(r => r.roomId == roomId);
    roundInfos[roundInfo[0].index].enemiesRemaining--;
}

function spawnEnemies(roundInfo) {
    if (((roundInfo.lastEnemySpawn + roundInfo.timeBetweenEnemies) < Date.now()) && (roundInfo.enemyCounter < roundInfo.roundEnemyAmount)) {
        roundInfo.enemyRandomSpawnVariable = Math.random();

        // get map settings
        let MAP_enemySpawns = getMapEnemiesSpawns(roundInfo.mapName)

        enemies.push(new Enemy(roundInfo.spawnsActive[Math.trunc((roundInfo.spawnsActive.length) * Math.random())], enemies.length, roundInfo.enemySpeed, roundInfo.enemyStartingHealth, .5, roundInfo.roomId, roundInfo.enemyRandomSpawnVariable, MAP_enemySpawns));
        roundInfo.lastEnemySpawn = Date.now();
        roundInfo.enemyCounter++;
    }
}

/**
 * get map enemies spawns
 * @param _mapName {string} example: lvl_square_01
 * @return {*}
 */
function getMapEnemiesSpawns(_mapName) {
    switch (_mapName) {
        case 'lvl_square_01':
            return MAP_lvl_square_o1.enemySpawns
    }
}

function getMapCoords(_mapName) {
    switch (_mapName) {
        case 'lvl_square_01':
            return MAP_lvl_square_o1.coords
    }
}

function moveEnemies(roomId) {
    enemies.forEach(enemy => {
        if (enemy.roomId == roomId) {
            var closestPlayer = determineClosestPlayer(enemy.x, enemy.y, enemy.roomId);
            if (closestPlayer != null) {
                determineEnemyTraj(enemy, closestPlayer);
                if (enemy.x < closestPlayer.x && enemy.xClearPos) {
                    enemy.x += enemy.Xspeed;
                }
                if (enemy.x > closestPlayer.x && enemy.xClearNeg) {
                    enemy.x += enemy.Xspeed;
                }
                if (enemy.y < closestPlayer.y && enemy.yClearPos) {
                    enemy.y += enemy.Yspeed;
                }
                if (enemy.y > closestPlayer.y && enemy.yClearNeg) {
                    enemy.y += enemy.Yspeed;
                }
            }
        }
    });


}

function determineEnemyTraj(enemy, player) {
    //quad 1
    if (player.x >= enemy.x && player.y < enemy.y) {
        enemy.angle = -1 * Math.atan((enemy.y - player.y) / (player.x - enemy.x));
    }

    //quad 2
    if (player.x > enemy.x && player.y >= enemy.y) {
        enemy.angle = Math.atan((player.y - enemy.y) / (player.x - enemy.x));
    }

    //quad 3
    if (player.x <= enemy.x && player.y > enemy.y) {
        enemy.angle = 3.14159 + Math.atan((enemy.y - player.y) / (Math.abs(enemy.x - player.x)));
    }

    //quad 4
    if (player.x < enemy.x && player.y <= enemy.y) {
        enemy.angle = 3.14159 + Math.atan((enemy.y - player.y) / (Math.abs(enemy.x - player.x)));
    }

    if (enemyRectangleContains(enemy.x + 27, enemy.y)) {
        enemy.xClearPos = false;
    } else {
        enemy.xClearPos = true;
    }
    if (enemyRectangleContains(enemy.x - 27, enemy.y)) {
        enemy.xClearNeg = false;
    } else {
        enemy.xClearNeg = true;
    }
    if (enemyRectangleContains(enemy.x, enemy.y + 27)) {
        enemy.yClearPos = false;
    } else {
        enemy.yClearPos = true;
    }
    if (enemyRectangleContains(enemy.x, enemy.y - 27)) {
        enemy.yClearNeg = false;
    } else {
        enemy.yClearNeg = true;
    }
    enemy.Xspeed = enemy.speed * Math.cos(enemy.angle);
    enemy.Yspeed = enemy.speed * Math.sin(enemy.angle);

}

function enemyRectangleContains(xPos, yPos) {
    for (var i = 4; i < mapData.rectCoords.length; i++) {
        if ((xPos > (mapData.rectCoords[i][0])) && (xPos < (mapData.rectCoords[i][0]) + mapData.rectCoords[i][2]) && (yPos > (mapData.rectCoords[i][1])) && (yPos < (mapData.rectCoords[i][1]) + mapData.rectCoords[i][3])) {
            return true;
        }
    }

    for (var i = 4; i < mapData.doorCoords.length; i++) {
        if ((xPos > (mapData.doorCoords[i][0])) && (xPos < (mapData.doorCoords[i][0]) + mapData.doorCoords[i][2]) && (yPos > (mapData.doorCoords[i][1])) && (yPos < (mapData.doorCoords[i][1]) + mapData.doorCoords[i][3])) {
            return true;
        }
    }

    return false;

}

function determineClosestPlayer(enemyX, enemyY, roomId) {
    var playersInRoom = players.filter(p => p.roomId == roomId);

    var minDistance = 100000000;
    var closestPlayer;

    playersInRoom.forEach(player => {
        if (!player.downed) {
            tempDistance = Math.sqrt(Math.pow(player.x - enemyX, 2) + Math.pow(player.y - enemyY, 2));
            if (tempDistance < minDistance) {
                minDistance = tempDistance;
                closestPlayer = player;
            }
        }
    })
    return closestPlayer;
}

function playerEnemyContact(players, enemies) {
    enemies.forEach(enemy => {
        players.forEach(player => {
            var distance = 0;
            distance = Math.sqrt(Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2));
            if (distance <= 50) {
                player.health -= enemy.damage;
            }
        });
    });
}

function updateBullets(roomId) {

    if (bullets.length != 0) {
        for (var i = 0; i < bullets.length; i++) {
            if (bullets[i].roomId == roomId) {
                mapData.rectCoords.forEach(element => {
                    if (bullets[i] != null) {
                        if (rectangleContains(bullets[i].x, bullets[i].y, element[0], element[1], element[2], element[3])) {
                            bullets.splice(i, 1);
                        }
                    }
                });
                doors.forEach(door => {
                    if (bullets[i] != null && !door.open && door.roomId == bullets[i].roomId) {
                        if (rectangleContains(bullets[i].x, bullets[i].y, door.x, door.y, door.l, door.w)) {
                            bullets.splice(i, 1);
                        }
                    }
                });

                enemies.forEach(enemy => {
                    if (bullets[i] != null && enemy != null && enemy.roomId == bullets[i].roomId) {
                        if (enemyContainsBullet(enemy.x, enemy.y, bullets[i].x, bullets[i].y)) {
                            if (enemy.bulletInEnemy != i && bullets[i].bulletInEnemy != enemy.index && enemy.roomId == bullets[i].roomId) {
                                enemy.health -= bullets[i].damage;
                                enemy.healthPercent = enemy.health / enemy.initialHealth;
                                bullets[i].damage -= bullets[i].damageDecreaseConstant;
                            }
                            enemy.bulletInEnemy = i;
                            bullets[i].bulletInEnemy = enemy.index;
                        } else if (enemy.bulletInEnemy == i) {
                            enemy.bulletInEnemy = -1;
                        }
                        if (enemy.health <= 0) {
                            players[bullets[i].playerFired].kills++;
                            sessionInfo.forEach(session => {
                                if (session[0] == players[bullets[i].playerFired].roomId) {
                                    session[1]++;
                                }
                            })
                            // save dead enemy
                            console.log(`Enemy killed at: X:${enemy.x} Y:${enemy.y}`)
                            const deadEnemyData = {
                                x: enemy.x,
                                y: enemy.y,
                                roomId: enemy.roomId
                            }
                            deadEnemies.push(deadEnemyData)

                            // remove enemy
                            removeEnemy(enemy.index, enemy.roomId);
                            bullets[i].bulletInEnemy = -1;
                        }
                        if (bullets[i].damage <= 0) {
                            bullets.splice(i, 1);
                        }
                    }
                });
                if (bullets[i] != null) {
                    bullets[i].x += bullets[i].velocity * Math.cos(bullets[i].angle) + (bullets[i].sprayDeviation * Math.sin(bullets[i].angle));
                    bullets[i].y += bullets[i].velocity * Math.sin(bullets[i].angle) - (bullets[i].sprayDeviation * Math.cos(bullets[i].angle));
                    bullets[i].damage -= bullets[i].bulletDecay;
                }
            }
        }
    }


}



