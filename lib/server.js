
/*

This is the Stable File!!!!
Do not Edit!
Game.1.js and Server.1.js is Unstable!!!!!

*/



var util = require('util')
var http = require('http')
var path = require('path')
var ecstatic = require('ecstatic')
var io = require('socket.io')

var Player = require('./Player')

var port = process.env.PORT || 8080

/* ************************************************
** GAME VARIABLES
************************************************ */
var socket	// Socket controller
var players	// Array of connected players

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

  
}

// Socket client has disconnected
function onClientDisconnect () {
  util.log('Player has disconnected: ' + this.id)

  var removePlayer = playerById(this.id)

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

  var removePlayer = playerById(this.id)

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





// New player has joined
function onNewPlayer (data) {
  // Create a new player
  var newPlayer = new Player(data.x, data.y)
  newPlayer.id = this.id

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



setInterval(onNewBullet,150);

function onNewBullet(data){
  //   setInterval(io.emit.bind(this, "new bullet"), 1000);


  var y = Math.floor((Math.random() * 600)+1);
  // var y = 400; 
  // console.log("NewBullet "+"X:"+1000+" Y:"+y );
  // console.log(y);
  socket.emit('new bullet',{x: 1000, y: y, d: 40});
  
  
}


/* ************************************************
** GAME HELPER FUNCTIONS
************************************************ */
// Find player by ID
function playerById (id) {
  var i
  // console.log("This is the players: " + players);
  for (i = 0; i < players.length; i++) {
    if (players[i].id === id) {
      return players[i]
    }
  }

  return false
}
