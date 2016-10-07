/* global Phaser RemotePlayer io */

/*

This is the Stable File!!!
Do not Edit!!!
Game.1.js and Server.1.js is Unstable!!!!!

*/


var game = new Phaser.Game(1000, 600, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update, render: render});

var player;
var enemies;
var sky;
var explosionSound;
var style = { font: "20px Arial", fill: "#ff0044", align: "center" };
var obstacle;
var bullet;
var BUSTER;
var text;
var music;
var cursors;
var number1;
var difficulty = 25;
var difftext;

var startX = 100;
var startY = 400;

var socket // Socket connection

var timer;
var score = 0;

function preload() {
    game.load.spritesheet('car', 'assets/Spaceship.png', 32, 32);
    game.load.spritesheet('greenCar', 'assets/Spaceship clone.png', 32, 32);
    game.load.spritesheet('sky', 'assets/backgroundCyberPunk.png',389,218);
    game.load.spritesheet('explode', 'assets/explode.png', 128,128);
    game.load.spritesheet('boolet', 'assets/boolet.png', 28, 14, 4);
    game.load.spritesheet('buster', 'assets/busterBullet.png',28,14);
    game.load.audio('music','assets/race.mp3');
    game.load.audio('sound','assets/explosion.mp3');
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.scale.refresh();
    game.stage.smoothed=false;
}


function create() {
    socket = io.connect();
  
  
    game.physics.startSystem(Phaser.Physics.ARCADE);
    
        
    sky = game.add.sprite(0, 0, 'sky');
    sky.scale.setTo(2.75,2.75);
    sky.animations.add('scroll');
    sky.animations.play('scroll', 29.9, true);
    
    music = game.add.audio('music');
    music.loopFull();
    obstacle = game.add.group();
    
    // Player 1
    player = game.add.sprite(startX, startY, 'car');
    player.scale.setTo(4, 4);
    game.physics.arcade.enable(player);
    player.animations.add('drive');
    player.enableBody = true;
    player.body.drag.set(2000);
    player.body.collideWorldBounds = true;
    
    player.animations.play('drive', 100, true);
    player.body.setSize(20, 7, 33, 56);
    
    // game.time.events.loop(Phaser.Timer.SECOND*0.01, incrementDifficulty, this);
    // game.time.events.loop(Phaser.Timer.SECOND/5, genBullet, this);
    // game.time.events.loop(30*Phaser.Timer.SECOND/5, hellFire, this);
    
    cursors = game.input.keyboard.createCursorKeys();

    enemies = [];
        
    game.physics.arcade.enable(obstacle);
    obstacle.enableBody = true;
    obstacle.checkWorldBounds = true;
    obstacle.outOfBoundsKill = true;
    game.physics.arcade.collide(obstacle,player);
        
    game.physics.arcade.collide(obstacle,obstacle);
         
    // Start listening for events
    setEventHandlers();
    
    timer = setInterval(updateScore, 100);
      text = game.add.text(16,16,'Score:'+score);
      difftext = game.add.text(800,16,'Difficulty:'+difficulty);
}

    // socket events
var setEventHandlers = function () {
  // Socket connection successful
  socket.on('connect', onSocketConnected);

  // Socket disconnection
  socket.on('disconnect', onSocketDisconnect);

  // New player message received
  socket.on('new player', onNewPlayer);

  // Player move message received
  socket.on('move player', onMovePlayer);

  // Player removed message received
  socket.on('remove player', onRemovePlayer);
  
  socket.on("new bullet",onNewBullet);

};
function onNewBullet(data){
  
  
  bullet = obstacle.create(data.x,data.y,'boolet');
    bullet.scale.setTo(3, 3);
    game.physics.arcade.enable(bullet);
    bullet.body.setSize(26,8,3,9);
    bullet.body.immovable = true;
    bullet.body.velocity.x = -20* data.d;
    bullet.checkWorldBounds = true;
    bullet.outOfBoundsKill = true;
    bullet.animations.add('shooty', [0, 1, 2, 3, ], 15, true);
    bullet.animations.play('shooty');
    
    difficulty = data.d;
    
}

// Socket connected
function onSocketConnected () {
  console.log('Connected to socket server')

  // Reset enemies on reconnect
  enemies.forEach(function (enemy) {
    enemy.player.kill()
  })
  enemies = []

  // Send local player data to the game server
  socket.emit('new player', { x: player.x, y: player.y })
}

// Socket disconnected
function onSocketDisconnect () {
  console.log('Disconnected from socket server')
}

// New player
function onNewPlayer (data) {
  console.log('New player connected:', data.id)

  // Avoid possible duplicate players
  var duplicate = playerById(data.id)
  if (duplicate) {
    console.log('Duplicate player!')
    return
  }

  // Add new player to the remote players array
  enemies.push(new RemotePlayer(data.id, game, player, data.x, data.y))
}

// Move player
function onMovePlayer (data) {
  var movePlayer = playerById(data.id)

  // Player not found
  if (!movePlayer) {
    console.log('Player not found: ', data.id)
    return
  }
  // Update player position
  movePlayer.player.x = data.x
  movePlayer.player.y = data.y
}

// Remove player
function onRemovePlayer (data) {
  var removePlayer = playerById(data.id)
  
  
  // Player not found
  if (!removePlayer) {
    console.log('Player not found: ', data.id)
    return
  }
  
    
  removePlayer.player.kill();
  // Remove player from array
  enemies.splice(enemies.indexOf(removePlayer), 1)
  
}




function update() {
  
  
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].alive) {
      enemies[i].update()
      game.physics.arcade.collide(player, enemies[i].player)
    }
  }
  //if the player touches a bullet
  if (game.physics.arcade.collide(obstacle,player)){
    player.kill();
    clearInterval(timer);
    var explosion = game.add.sprite(player.body.x-30,player.body.y-56,'explode');
    explosion.animations.add('exploding',[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],20, false);
    explosion.animations.play('exploding');
    explosion.scale.setTo(1,1); 
    socket.emit('player death', {id: player.id});
  }

  game.world.bringToTop(player);
  //player controls
  if (cursors.left.isDown)
  {
        player.x -= 6;
    }
  else if (cursors.right.isDown)
  {     player.x += 6;
    }
  else if (cursors.left.isUp || cursors.right.isUp){
        player.x += 0;
        }
  if (cursors.up.isDown)
  {     
        player.y -= 6;
    }
  else if (cursors.down.isDown)
  {
       player.y += 6;
    }
  else if (cursors.up.isUp || cursors.down.isUp){
        player.y += 0;
        }
         
        
  if (number1 === 1 ){
    bullet = obstacle.create(1000,Math.floor((Math.random() * player.body.y+15)+ player.body.y-15),'boolet');
    bullet.scale.setTo(3, 3);
    game.physics.arcade.enable(bullet);
    bullet.body.setSize(26,8,3,9);
    bullet.body.immovable = true;
    bullet.body.velocity.x = -20*difficulty;
    bullet.checkWorldBounds = true;
    bullet.outOfBoundsKill = true;
    bullet.animations.add('shooty', [0, 1, 2, 3, ], 15, true);
    bullet.animations.play('shooty');
    
    }
  if (number1 === 3 ){
    bullet = obstacle.create(1000,Math.floor((Math.random() * 600)+1),'boolet');
    bullet.scale.setTo(3, 3);
    game.physics.arcade.enable(bullet);
    bullet.body.setSize(26,8,3,9);
    bullet.body.immovable = true;
    bullet.body.velocity.x = -20*difficulty;
    bullet.checkWorldBounds = true;
    bullet.outOfBoundsKill = true;
    bullet.animations.add('shooty', [0, 1, 2, 3, ], 15, true);
    bullet.animations.play('shooty');
    

    }

socket.emit('move player', { x: player.x, y: player.y });
 
}
function genBullet(){
     number1 = Math.floor((Math.random() * 3) + 1);
     game.time.events.add(Phaser.Timer.SECOND*0.0001, number0, this);
}
function number0(){
    number1 = 0;
}
function hellFire(){
        BUSTER = obstacle.create(1000,Math.floor((Math.random() * 600)+1),'buster');
        BUSTER.scale.setTo(3, 3);
        game.physics.arcade.enable(BUSTER);
        BUSTER.body.setSize(19,12,12,3);
        BUSTER.body.immovable = true;
        BUSTER.body.velocity.x = -300;
        BUSTER.checkWorldBounds = true;
        BUSTER.outOfBoundsKill = true;
        BUSTER.animations.add('shooty', [0,1,2,3,4,5,6,7,8,9,10], 15, true);
        BUSTER.animations.play('shooty');
        game.time.events.add(Phaser.Timer.SECOND*5, burst, this);
}
function incrementDifficulty(){
     difficulty += .1;
}
function updateScore(){
  score += 1;
  text.setText('Score:'+score);
  difftext.setText('Difficulty:'+difficulty);

}
function burst(){
    //explode into a cluster of bullets idk 
}

function render(){
    //for debugging
    // game.debug.body(player);
    // game.debug.body(obstacle);
}

// Find player by ID
function playerById (id) {
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].player.name === id) {
      return enemies[i]
    }
  }

  return false
}
