/* global game Phaser*/

var RemotePlayer = function (index, game, player, startX, startY) {
  var x = startX
  var y = startY

  this.game = game
  this.player = player
  this.alive = true

  this.player = game.add.sprite(x, y, 'greenCar')

  this.player.scale.setTo(4, 4);
  
  this.player.animations.add('drive');

  this.player.name = index.toString()
  game.physics.enable(this.player, Phaser.Physics.ARCADE)
  this.player.body.collideWorldBounds = true  

  this.lastPosition = { x: x, y: y }
  
  
}


RemotePlayer.prototype.update = function () {
  this.player.play('drive')
  this.player.body.setSize(20, 7, 33, 56);
  this.lastPosition.x = this.player.x
  this.lastPosition.y = this.player.y
}

window.RemotePlayer = RemotePlayer


//Remote bullets


var RemoteBullet = function (index, game, startX, startY) {
  var x = startX
  var y = startY

  this.game = game
  this.alive = true
  
  this.bullet = game.add.sprite(x, y, 'buster')

  this.bullet.scale.setTo(4, 4);
  

  this.bullet.name = index.toString()
  game.physics.enable(this.bullet, Phaser.Physics.ARCADE)
  this.bullet.body.collideWorldBounds = true  

  this.lastPosition = { x: x, y: y }
  
}


RemoteBullet.prototype.update = function () {
  this.bullet.body.setSize(20, 7, 33, 56);
}

window.Remotebullet = RemoteBullet
