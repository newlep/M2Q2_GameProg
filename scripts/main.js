// BootScene: Preload assets
class BootScene extends Phaser.Scene {
    constructor() {
      super('BootScene')
    }
  
    preload() {
      this.load.image('player', './assets/player/player.png')
      this.load.image('projectile', './assets/objects/projectile.png')
      this.load.image('asteroid', './assets/objects/asteroid.png')
      this.load.audio('bgMusic', './assets/audio/bgmusic.mp3')
      this.load.audio('shootSound', './assets/audio/shootSound.mp3')
      this.load.audio('hitSound', './assets/audio/hitSound.mp3')
    }
  
    create() {
      this.scene.start('TitleScene')
    }
  }
  
  // TitleScene: Display the game title and start button
  class TitleScene extends Phaser.Scene {
    constructor() {
      super('TitleScene')
    }
  
    create() {
      this.add.text(400, 300, 'Space Shooter Game', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5)
      this.add.text(400, 400, 'Click to Start', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5)
      this.input.on('pointerdown', () => this.scene.start('GameScene'))
    }
  }
  
  // GameScene: Main gameplay
  class GameScene extends Phaser.Scene {
    constructor() {
      super('GameScene')
    }
  
    create() {
      this.bgMusic = this.sound.add('bgMusic')
      this.bgMusic.play({ loop: true })
  
      this.player = this.physics.add.sprite(400, 550, 'player')
      this.player.setCollideWorldBounds(true)
      this.player.setScale(0.2)
  
      this.cursors = this.input.keyboard.createCursorKeys()
      this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
  
      this.projectiles = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Image,
        maxSize: 20,
        runChildUpdate: true
      })
  
      this.asteroids = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Image,
        maxSize: 20,
        runChildUpdate: true
      })
  
      this.physics.add.collider(this.projectiles, this.asteroids, this.hitAsteroid, null, this)
      this.physics.add.collider(this.player, this.asteroids, this.playerHit, null, this)
  
      this.time.addEvent({
        delay: 1000,
        callback: this.spawnAsteroid,
        callbackScope: this,
        loop: true
      })
  
      this.score = 0
      this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '24px', fill: '#fff' })
  
      this.startTime = new Date().getTime()
      this.timeText = this.add.text(16, 50, 'Time: 0', { fontSize: '24px', fill: '#fff' })
    }
  
    update() {
      this.player.setVelocityX(0)
  
      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-300)
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(300)
      }
  
      if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
        this.shootProjectile()
      }
  
      this.updateTime()
    }
  
    shootProjectile() {
      const projectile = this.projectiles.get(this.player.x, this.player.y, 'projectile')
      if (projectile) {
        projectile.setActive(true)
        projectile.setVisible(true)
        projectile.setScale(0.05)
        projectile.body.enable = true
        projectile.setVelocityY(-400)
        this.sound.play('shootSound')
      }
    }
  
    spawnAsteroid() {
      const x = Phaser.Math.Between(50, 750)
      const asteroid = this.asteroids.get(x, 0, 'asteroid')
      if (asteroid) {
        asteroid.setActive(true)
        asteroid.setVisible(true)
        asteroid.setScale(0.05)
        asteroid.body.enable = true
        asteroid.setVelocityY(200)
        asteroid.setCollideWorldBounds(true)
        asteroid.body.onWorldBounds = true
        asteroid.body.world.on('worldbounds', (body) => {
          if (body.gameObject === asteroid) {
            asteroid.destroy()
          }
        })
      }
    }
  
    hitAsteroid(projectile, asteroid) {
      projectile.destroy()
      asteroid.destroy()
      this.sound.play('hitSound')
      this.score += 10
      this.scoreText.setText('Score: ' + this.score)
    }
  
    playerHit(player, asteroid) {
      this.bgMusic.stop()
      this.scene.start('GameOverScene', { score: this.score })
    }
  
    updateTime() {
      const elapsedTime = new Date().getTime() - this.startTime
      const seconds = Math.floor(elapsedTime / 1000)
      this.timeText.setText('Time: ' + seconds)
  
      if (seconds >= 120) {
        this.bgMusic.stop()
        this.scene.start('GameOverScene', { score: this.score })
      }
    }
  }
  
  // GameOverScene: Show score and restart option
  class GameOverScene extends Phaser.Scene {
    constructor() {
      super('GameOverScene')
    }
  
    init(data) {
      this.score = data.score
    }
  
    create() {
      this.add.text(400, 300, 'Game Over', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5)
      this.add.text(400, 400, 'Score: ' + this.score, { fontSize: '24px', fill: '#fff' }).setOrigin(0.5)
      this.add.text(400, 500, 'Click to Restart', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5)
      this.input.on('pointerdown', () => this.scene.start('GameScene'))
    }
  }
  
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scene: [BootScene, TitleScene, GameScene, GameOverScene]
  }
  
  const game = new Phaser.Game(config)
  