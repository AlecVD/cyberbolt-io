/* global Phaser RemotePlayer io */

Array.prototype.l = Array.prototype.length;

App42.initialize("8268c463bc4362bae4d2854972c234905febc90ddaa70cb554815500492af05b","163bedd0c3275dd5cfa5521fa6cdb551be5a202fbf361861e71a95ab33a4312b");  
//Fps Meter
   // Theme
    // theme: 'dark', // Meter theme. Build in: 'dark', 'light', 'transparent', 'colorful'.
    // heat:  0,      // Allow themes to use coloring by FPS heat. 0 FPS = red, maxFps = green.

    FPSMeter.defaults.top = 0;
		FPSMeter.defaults.right = 'auto';
		FPSMeter.defaults.heat = 1;
		FPSMeter.defaults.graph = 1;
		FPSMeter.defaults.history = 20;
    FPSMeter.defaults.margin = '50px 0 0 1000px';
    //Transparent
var meter = new FPSMeter(document.getElementById('fps'), { theme: 'transparent' });
//Dark
// var meter = new FPSMeter(document.getElementById('fps'), { theme: 'dark' });

// alert("Come on and slam");
// alert("And welcome to the jam ( ͡° ͜ʖ ͡°)");

var game = new Phaser.Game(1000, 600, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update, render: render});
//Change tab test
// this.stage.disableVisibilityChange = true;

var player;
var enemies;
var sky;
var explosionSound;
var obstacle;
var bullet;
var BUSTER;
var text;
var music;
var music2;
var musicText;
var currentSong;
var nuke;
var cursors;
var number1;
var difficulty = 0;
var difftext;
var speed = 0;
var startX = 100;
var startY = 225;
var info;
var playerDead = true;
var playerCount = 0;
var joinText;
var counter;
var socket; // Socket connection
var playersInQueue = 1;
var timer;
var score = 0;
var number;
var w;
var a;
var s;
var count;
var d;
var loaded = false;
var text2;


var inQueue = false;






function preload() {
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
    

    text2 = game.add.text(game.world.centerX, game.world.centerY, 'Start', { fill: '#000000' });
    text2.inputEnabled = true;
    
    info = game.add.text(16,16,'(Please use one username)', {font:'17px Arial', fill: '#000000' })
    
    
    game.physics.startSystem(Phaser.Physics.ARCADE);
    
  
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
    
    
    cursors = game.input.keyboard.createCursorKeys();

    enemies = [];
        
    game.physics.arcade.enable(obstacle);
    obstacle.enableBody = true;
    obstacle.checkWorldBounds = true;
    obstacle.outOfBoundsKill = true;
    game.physics.arcade.collide(obstacle,player);
        
    game.physics.arcade.collide(obstacle,obstacle);
    
    
    
         
    
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
  
  
   if(inQueue === true){
    joinText.setText(data.n);
    }
    if(data.n >=3){
      nuke.play();
    }
    
    if(inQueue === false){
      joinText.setText("You're missing out!");
    }

}
function onGameStart(){
  // scoreBoard();
  if(inQueue === true){
  joinGame()
  
  }else{
    joinText.setText('Join Game')
    
  }
}
function onQueue(data){
  playersInQueue = data.q

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
    
    // difficulty = data.d;
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
    var explosion = game.add.sprite(enemies[i].player.body.x-30,enemies[i].player.body.y-56,'explode');
    explosion.animations.add('exploding',[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],20, false);
    explosion.animations.play('exploding');
    explosion.scale.setTo(1,1); 
    explosionSound.play();
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
    
    explosionSound.play();
    
    playerDead = true;
    
    saveScore(score);
    score = 0;
    joinText = game.add.text(game.world.centerX, game.world.centerY, 'Join Game', { fill: '#ffffff' });
    joinText.inputEnabled = true;
    
    
  
    
  }
  
  
  game.world.bringToTop(player);

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
  
 
  
  if(playerDead === false){
  socket.emit('move player', { x: player.x, y: player.y });

  }    
  if(game.input.keyboard.isDown(Phaser.Keyboard.R)){
    joinQueue();
  }
  
  
  joinText.events.onInputDown.add(joinQueue, this);
  musicText.events.onInputDown.add(changeTrack, this);
  
  }
 }
function updateScore(){
  if(playerDead === false){
  score += 1;
  text.setText('Score:'+score , { fill: '#ffffff' });
  }
  difftext.setText('  Speed:'+Math.round(speed)+'  Players Alive:'+playerCount , { fill: '#ffffff' });

}

function joinQueue(){
  if(playerDead === true){
  if(inQueue === false)  {
  socket.emit('join queue')
  inQueue = true
  joinText.setText('Players in Queue: '+ playersInQueue)
  }
  
  }
}
function joinGame(){
  setTimeout(pauseSound,1500)
  if(playerDead){
  // Player 1
    

    // obstacle.kill()
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
    
    score = 0;
    socket.emit('new player', { x: player.x, y: player.y })

    }
}

function render(){
    //for debugging
    // game.debug.body(player);
    // game.debug.body(obstacle);
    meter.tick()
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
    game.load.audio('explosion', 'assets/explosion.mp3');
    game.load.audio('nuke','assets/tacticalNuke.mp3');
    game.load.audio('music2','assets/Derezzed.mp3');
    game.load.image('reload','assets/reload.png');
    
    game.load.start();

}

function fileComplete(progress, cacheKey, success, totalLoaded, totalFiles) {

	text2.setText("File Complete: " +cacheKey+' '+ progress + "% - " + totalLoaded + " out of " + totalFiles);

	

}

function loadComplete() {
	text2.setText("Load Complete");
	loaded = true;
	
	  w = game.input.keyboard.addKey(87);
    a = game.input.keyboard.addKey(65);
    s = game.input.keyboard.addKey(83);
    d = game.input.keyboard.addKey(68);
    m = game.input.keyboard.addKey(77);
    
	  sky = game.add.sprite(0, 0, 'sky');
    sky.scale.setTo(2.75,2.75);
    sky.animations.add('scroll');
    sky.animations.play('scroll', 29.9, true);
    
    explosionSound = game.add.audio('explosion')
    nuke = game.add.audio('nuke');
        nuke.volume += 1;

    music = game.add.audio('music');
    music2 = game.add.audio('music2');
    music.loopFull();
    music.volume -= 0.5;
    music2.volume += 5;
    currentSong = '8-bit';
    
    obstacle = game.add.group();
    
    
    
    // username = document.getElementById('t').value;
    joinText = game.add.text(game.world.centerX, game.world.centerY, 'Join Game', { fill: '#ffffff' });
    joinText.inputEnabled = true;
    
    timer = setInterval(updateScore, 50);
      text = game.add.text(16,16,'Score:'+0,{fill: '#ffffff' });
      difftext = game.add.text(150,16,'Difficulty:'+0,{fill: '#ffffff' });
      
      musicText = game.add.text(16,550,"Music: "+"8-bit",{fill: '#ffffff' })
      musicText.inputEnabled = true;
      
      game.add.text(250,550,"Username: "+document.getElementById('t').value,{fill: '#ffffff' })
      
    
    scoreBoard();
}

function changeTrack(){
  if(currentSong === 'Derezzed'){
    music2.pause();
    music.loopFull();
    currentSong = '8-bit'
    musicText.setText("Music: "+currentSong)
  }else if(currentSong === '8-bit'){
    music.pause();
    music2.loopFull();
    currentSong = 'Derezzed'
    musicText.setText("Music: "+currentSong)
  }
  
}
function pauseSound(){
    nuke.pause();
}


// var App42ScoreBoard
function saveScore(n){
     if(n){
        // alert("running saveScore")
          var gameName = "cyberbolt";  
          var userName = document.getElementById('t').value;
          if(userName == ""){
               userName = "Guest";
          }  
          var gameScore = n;  
          var result;
          var scoreBoardService = new App42ScoreBoard()    
          scoreBoardService.saveUserScore(gameName,document.getElementById('t').value,gameScore,{ success: function(object){} }); 
          
          setTimeout(scoreBoard,100);
          
          
     }
}



    
function scoreBoard(){
    

var scoreBoardService  = new App42ScoreBoard();  
scoreBoardService.getTopNRankers("cyberbolt", 10,{    
    success: function(object)   
    {    
     var scorelist = "";
        var game = JSON.parse(object);    
        var result = game.app42.response.games.game;  
        var scoreList = result.scores.score;  
        if (scoreList instanceof Array) {  
                for (var i = 0; i < scoreList.length; i++) {  
                    
                    scorelist += "<tr><td align = \"left\">" + scoreList[i].userName +" : " +scoreList[i].value + "</td><td align = \"right\">" + "</td></tr>";  
                     
                }  
            }
            document.getElementById("leaderboard").innerHTML = "<table width = \"100%\"><tr><td colspan = \"2\"><strong>TOP SCORES</strong></td>"+scorelist+"</table>"; 
    },    
    error: function(error) {    
    }    
}); 
}
//can u comment it out 4 now plz so soren and i can play
//Yeet
// Find player by ID
function playerById (id) {
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].player.name === id) {
      return enemies[i]
    }
  }
  return false
}
