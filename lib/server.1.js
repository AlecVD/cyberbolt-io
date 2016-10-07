var util = require('util')
var http = require('http')
var path = require('path')
var ecstatic = require('ecstatic')
var io = require('socket.io')
 
var Player = require('./Player')

var port = process.env.PORT || 8080
// App42.initialize("8268c463bc4362bae4d2854972c234905febc90ddaa70cb554815500492af05b","163bedd0c3275dd5cfa5521fa6cdb551be5a202fbf361861e71a95ab33a4312b");  

/* ************************************************
** GAME VARIABLES
************************************************ */
var socket	// Socket controller
var players	// Array of connected players
var gameStarted = false
var playersInQueue = 0;
var playerCount = 0;
var diff = 50
var number = 4
var rate = 250
var counter;
var newBullet;
/* ************************************************
** GAME INITIALISATION
************************************************ */

// Create and start the http server
var server = http.createServer(
  ecstatic({ root: path.resolve(__dirname, '../public') })
).listen(port, function (err) {
  if (err) {
    throw err
  }

  init()
})

function init () {
  // Create an empty array to store players
  players = []

  // Attach Socket.IO to server
  socket = io.listen(server)

  // Start listening for events
  setEventHandlers()
}

/* ************************************************
** GAME EVENT HANDLERS
************************************************ */
var setEventHandlers = function () {
  // Socket.IO
  socket.sockets.on('connection', onSocketConnection)
}

// New socket connection
function onSocketConnection (client) {
  util.log('New player has connected: ' + client.id)

  // Listen for client disconnected
  client.on('disconnect', onClientDisconnect)

  // Listen for new player message
  client.on('new player', onNewPlayer)

  // Listen for move player message
  client.on('move player', onMovePlayer)
  
  client.on('player death', onPlayerDeath)
  
  client.on('new bullet',onNewBullet)
  
  client.on('join queue',onJoinQueue)

  
}


function onJoinQueue(){
  playersInQueue += 1;
  console.log(playersInQueue)
  
  socket.emit('players in queue',{q:playersInQueue})
  
  if(playerCount === 0 && playersInQueue > 0){
    // socket.emit('gaem start')
    playersInQueue = 0;
    // gameStarted = true;
    number = 4
    counter = setInterval(countdown,1000)
  }
}
// Socket client has disconnected
function onClientDisconnect () {
  util.log('Player has disconnected: ' + this.id)

  var removePlayer = playerById(this.id)
  playerCount -= 1;
  if(playerCount < 0){
    playerCount = 0;
  }
  // Player not found
  if (!removePlayer) {
    util.log('Player on disconnect not found: ' + this.id)
    return
  }

  // Remove player from players array
  players.splice(players.indexOf(removePlayer), 1)

  // Broadcast removed player to connected socket clients
  this.broadcast.emit('remove player', {id: this.id})
}

// Socket client has died
function onPlayerDeath () {
  util.log('Player has died: ' + this.id)
  playerCount -= 1;
  var removePlayer = playerById(this.id)
  if(playerCount === 0 && playersInQueue > 0){
    // socket.emit('gaem start')
    playersInQueue = 0;
    // gameStarted = true;
    number = 4
    counter = setInterval(countdown,1000)
  }
  
  if(playerCount === 0 && gameStarted === true){
    gameStarted = false;
  }
  // Player not found
  if (!removePlayer) {
    util.log('Player that died not found: ' + this.id)
    return
  }
  // Remove player from players array
  players.splice(players.indexOf(removePlayer), 1)
  // Broadcast removed player to connected socket clients
  this.broadcast.emit('remove player', {id: this.id})
}


function countdown(){
  
  number -= 1
  socket.emit('start countdown',{n:number})
  
  if(number <= 0 && playerCount <= 0){
    socket.emit('gaem start');
    clearInterval(counter)
    gameStarted = true;
    playersInQueue = 0
    diff = 25
    rate = 420
  }
  
}


// New player has joined
function onNewPlayer (data) {
  // Create a new player
  var newPlayer = new Player(data.x, data.y)
  newPlayer.id = this.id
  
  playerCount += 1;
  
  // Broadcast new player to connected socket clients
  this.broadcast.emit('new player', {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY()})

  // Send existing players to the new player
  var i, existingPlayer
  for (i = 0; i < players.length; i++) {
    existingPlayer = players[i]
    this.emit('new player', {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY()})
  }

  // Add new player to the players array
  console.log(newPlayer)
  players.push(newPlayer)
  console.log("players from onNewPlayer: " + players);
}

// Player has moved
function onMovePlayer (data) {
  console.log(data);
  // Find player in array
  var movePlayer = playerById(this.id)
  console.log(movePlayer);
  // Player not found
  if (!movePlayer) {
    util.log('Player not move found: ' + this.id)
    return
  }

  // Update player position 
  movePlayer.setX(data.x)
  movePlayer.setY(data.y)

  // Broadcast updated position to connected socket clients
  this.broadcast.emit('move player', {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY()})
}

// var rate = 200;


// Math.seed = 1;

// /**
// * Math.seededRandom()
// * 
// */
// Math.seededRandom = function(max, min) {
//     max = max || 1;
//     min = min || 0;

//     Math.seed = (Math.seed * 9301 + 49297) % 233280;
//     var rnd = Math.seed / 233280.0;

//     return min + rnd * (max - min);
// }




 newBullet = setInterval(onNewBullet,rate);

function onNewBullet(data){
  //   setInterval(io.emit.bind(this, "new bullet"), 1000);

  // difficulty += 0.1;
  // var diff = difficulty/3;
  
  // var diff = 50;
  var y = Math.floor((Math.random() * 600)+1);
  // var y = 600; 
  // console.log("NewBullet "+"X:"+1000+" Y:"+y+" Speed: "+Math.round(diff)+" Difficulty: "+Math.round(difficulty) );
  // console.log(y);
  if(playerCount < 0){
    playerCount = 0
  }
  // console.log('Player Count: '+playerCount+ ' Players In Queue: '+playersInQueue);
  
  if(gameStarted === true){
    diff += 0.5;
    rate -= 1;
  socket.emit('new bullet',{ y: y, s: diff, p: playerCount});
  }else{
    socket.emit('new bullet',{p:playerCount})
    
  }
  // console.log(playerCount);
      // console.log(gameStarted);

  //So I have 2 variables
  // Speed: How fast the boolets go
  // Difficulty: How many boolets there are
  // window.requestAnimationFrame(onNewBullet);
}
// window.requestAnimationFrame(onNewBullet);


/* ************************************************
** GAME HELPER FUNCTIONS
************************************************ */
// Find player by ID
function playerById (id) {
  var i
  // console.log("This is the players: " + playerCount);
  for (i = 0; i < players.length; i++) {
    if (players[i].id === id) {
      return players[i]
    }
  }

  return false
}
