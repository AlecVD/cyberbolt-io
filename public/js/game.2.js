/* global Phaser RemotePlayer io */

var game = new Phaser.Game(1000, 600, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update, render: render});
var pause = false;
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
var difficulty = 0;
var difftext;
var speed = 0;
var startX = 100;
var startY = 225;
var playerDead = true;
var playerCount = 0;
var joinText;
var counter;
var socket // Socket connection
var playersInQueue = 1
var timer;
var score = 0;
var respawnButton
var number
var w
var a
var s
var count;
var d
var m;
var loaded = false;
var text2;
var button;
var x = 32;
var y = 80;
var gameStart = false;
var inQueue = false;



//Scoreboard Test
// var scoreboard = require('scoreboard')
// var Score = scoreboard.Score;
// var scores = new Score();

// scoreboard.redis.createClient = function() {
//   var client = redis.createClient(1234, '192.168.100.1');
//   client.auth('somethingsecret');
//   return client;
// };


function preload() {
    game.load.spritesheet('button', 'assets/button.png', 193, 71);
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.scale.refresh();
    game.stage.smoothed=false;
}


function create() {
    socket = io.connect();
  
    game.stage.backgroundColor = '#ffffff';
    game.load.onLoadStart.add(loadStart, this);
    game.load.onFileComplete.add(fileComplete, this);
    game.load.onLoadComplete.add(loadComplete, this);
    
    // button = game.add.button(game.world.centerX - 95, 400, 'button', start, this, 2, 1, 0);
    
    text2 = game.add.text(game.world.centerX, game.world.centerY, 'Start', { fill: '#000000' });
    text2.inputEnabled = true;
    
    game.physics.startSystem(Phaser.Physics.ARCADE);
    
    
    w = game.input.keyboard.addKey(87);
    a = game.input.keyboard.addKey(65);
    s = game.input.keyboard.addKey(83);
    d = game.input.keyboard.addKey(68);
    m = game.input.keyboard.addKey(77);

    
    
    // sky = game.add.sprite(0, 0, 'sky');
    // sky.scale.setTo(2.75,2.75);
    // sky.animations.add('scroll');
    // sky.animations.play('scroll', 29.9, true);
    
    // music = game.add.audio('music');
    // music.loopFull();
    obstacle = game.add.group();
    
    // Player 1
    player = game.add.sprite(2000, startY, 'car');
    player.scale.setTo(4, 4);
    game.physics.arcade.enable(player);
    player.animations.add('drive');
    player.enableBody = true;
    player.body.drag.set(9000);
    player.body.collideWorldBounds = true;
    // playerDead = false;
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
    
    
    respawnButton = game.add.sprite(900,16,'reload')
    respawnButton.inputEnabled = true;
    respawnButton.scale.setTo(0.1, 0.1);
         
    
    timer = setInterval(updateScore, 100);
      text = game.add.text(16,16,'Score:'+score);
      difftext = game.add.text(150,16,'Difficulty:'+difficulty);
      
      // Start listening for events
    setEventHandlers();
    
    
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
  
  socket.on('players in queue',onQueue)
  
  socket.on('gaem start', onGameStart)
  
  socket.on('start countdown', onCountdown)

};

function onCountdown(data){
  // if(data.n <= 0){
  //   // if(inQueue === true){
  //   joinText.setText(data.n);
  //   // }else{
  //     // joinText.setText("You're missing out!");
  //   // }
  // }else{
  //   joinText.setText('Players in Queue: '+ playersInQueue)
  // }
  
   if(inQueue === true){
    joinText.setText(data.n);
    }
    
    if(inQueue === false){
      joinText.setText("You're missing out!");
    }
  joinText.setText(data.n);

}
function onGameStart(){
  // gameStart = true;
  if(inQueue === true){
  joinGame()
  // number = 4
  // counter = setInterval(countdown,1000)
  }else{
    joinText.setText('Join Gaem')
  }
}
function onQueue(data){
  playersInQueue = data.q
  // joinText.setText('Players in Queue: '+ playersInQueue)

}
function onNewBullet(data){
  
  if(loaded === true){
  bullet = obstacle.create(1000,data.y,'boolet');
    bullet.scale.setTo(3, 3);
    game.physics.arcade.enable(bullet);
    bullet.body.setSize(26,8,3,9);
    bullet.body.immovable = true;
    bullet.body.velocity.x = -20* data.s;
    bullet.checkWorldBounds = true;
    bullet.outOfBoundsKill = true;
    bullet.animations.add('shooty', [0, 1, 2, 3, ], 15, true);
    bullet.animations.play('shooty');
    
    difficulty = data.d;
    speed = data.s;
    playerCount = data.p
  }
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
  // socket.emit('new player', { x: player.x, y: player.y })
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
  
  if(loaded === false){
    player.kill();
    text.kill();
    difftext.kill()
    clearInterval(timer);
    
    text2.events.onInputDown.add(start, this);
  }
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].alive) {
      enemies[i].update()
      game.physics.arcade.collide(player, enemies[i].player)
      if (game.physics.arcade.collide(obstacle,enemies[i].player)){
    enemies[i].player.kill();
    // clearInterval(timer);
    clearInterval(timer);
    var explosion = game.add.sprite(enemies[i].player.body.x-30,enemies[i].player.body.y-56,'explode');
    explosion.animations.add('exploding',[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],20, false);
    explosion.animations.play('exploding');
    explosion.scale.setTo(1,1); 
     }
    }
  }
  //if the player touches a bullet
  
  if (loaded === true){
  if (game.physics.arcade.collide(obstacle,player)){
    player.kill();
    
    // clearInterval(timer);
    var explosion = game.add.sprite(player.body.x-30,player.body.y-56,'explode');
    explosion.animations.add('exploding',[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],20, false);
    explosion.animations.play('exploding');
    explosion.scale.setTo(1,1); 
    socket.emit('player death', {id: player.id});
    
    
    
    playerDead = true;
    
    
    // score.index('player',score,'name')
    
    // scores.leaders({keys:['player']}).run(function(err, leaderboard)) {
    //   console.log(leaderboard);
    //   });
        
    joinText = game.add.text(game.world.centerX, game.world.centerY, 'Join Game', { fill: '#ffffff' });
    joinText.inputEnabled = true;
    
    
    // This or player id
    // 
    // 
    // 
    // 
    // 
    
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
  
  //player controls
  if (a.isDown)
  {
        player.x -= 6;
    }
  else if (d.isDown)
  {     player.x += 6;
    }
  else if (a.isUp || d.isUp){
        player.x += 0;
        }
  if (w.isDown)
  {     
        player.y -= 6;
    }
  else if (s.isDown)
  {
       player.y += 6;
    }
  else if (w.isUp || s.isUp){
        player.y += 0;
        }
  
  if(m.isDown){
    if(pause === false){
      pause = true;
      music.pause();
      
    }
    
    
  }
  
  if(playerDead === false){
  socket.emit('move player', { x: player.x, y: player.y });

  }    
  if(game.input.keyboard.isDown(Phaser.Keyboard.R)){
    joinQueue();
  }
  
  respawnButton.events.onInputDown.add(joinQueue, this);
  joinText.events.onInputDown.add(joinQueue, this);
  
  }
 }
function updateScore(){
  if(playerDead === false){
  score += 1;
  text.setText('Score:'+score);
  }
  difftext.setText('Speed:'+Math.round(speed)+' Bullet Rate:'+Math.round(difficulty)+'  Players Alive:'+playerCount);

}
function burst(){
    //explode into a cluster of bullets idk 
}

function joinQueue(){
  if(playerDead === true){
  if(inQueue === false)  {
  socket.emit('join queue')
  inQueue = true
  joinText.setText('Players in Queue: '+ playersInQueue)
  }
  // if(gameStart === true){
  //   joinGame()
  //   }
  }
}
function joinGame(){
  if(playerDead === true){
  // Player 1
    joinText.kill()
    inQueue = false;
    player = game.add.sprite(startX, startY, 'car');
    player.scale.setTo(4, 4);
    game.physics.arcade.enable(player);
    player.animations.add('drive');
    player.enableBody = true;
    player.body.drag.set(2000);
    player.body.collideWorldBounds = true;
    playerDead = false;
    player.animations.play('drive', 100, true);
    player.body.setSize(20, 7, 33, 56);
    
    timer = setInterval(updateScore, 100);
    score = 0;
    socket.emit('new player', { x: player.x, y: player.y })
    gameStart = false;
    
    }
}

function render(){
    //for debugging
    // game.debug.body(player);
    // game.debug.body(obstacle);
}

function loadStart() {

	text.setText("Loading ...");

}



function start(){
    game.load.spritesheet('car', 'assets/Spaceship.png', 32, 32);
    game.load.spritesheet('greenCar', 'assets/Spaceship clone.png', 32, 32);
    game.load.spritesheet('sky', 'assets/backgroundCyberPunk.png',389,218);
    game.load.spritesheet('explode', 'assets/explode.png', 128,128);
    game.load.spritesheet('boolet', 'assets/boolet.png', 28, 14, 4);
    game.load.spritesheet('buster', 'assets/busterBullet.png',28,14);
    game.load.audio('music','assets/race.mp3');
    game.load.audio('sound','assets/explosion.mp3');
    game.load.image('reload','assets/reload.png');
    
    game.load.start();

    // button.visible = false;
}

function fileComplete(progress, cacheKey, success, totalLoaded, totalFiles) {

	text2.setText("File Complete: " + progress + "% - " + totalLoaded + " out of " + totalFiles);

	

}

function loadComplete() {
	text2.setText("Load Complete");
	loaded = true;
	sky = game.add.sprite(0, 0, 'sky');
    sky.scale.setTo(2.75,2.75);
    sky.animations.add('scroll');
    sky.animations.play('scroll', 29.9, true);
    
    music = game.add.audio('music');
    music.loopFull();
    obstacle = game.add.group();
    
    
    
    respawnButton = game.add.sprite(900,16,'reload')
    respawnButton.inputEnabled = true;
    respawnButton.scale.setTo(0.1, 0.1);
   
    joinText = game.add.text(game.world.centerX, game.world.centerY, 'Join Game', { fill: '#ffffff' });
    joinText.inputEnabled = true;
    
      timer = setInterval(updateScore, 100);
      text = game.add.text(16,16,'Score:', { fill: '#ffffff' });
      difftext = game.add.text(150,16,'Difficulty:', { fill: '#ffffff' });
}

function countdown(){
  
  
  number -= 1
  
  joinText.setText(number);
  
  if (number <= 0){
    joinGame();
    clearInterval(counter);
  }
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
