// BootScene: Preload assets
class BootScene extends Phaser.Scene {
    constructor() {
      super('BootScene')
    }
  
    preload() {
      this.load.image('player', './assets/player/player.png')
      this.load.image('projectile', './assets/objects/projectile.png')
      this.load.image('asteroid', './assets/objects/asteroid.png')
      this.load.image('background', './assets/background/background.jpg') // Load background image
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
      // Display and stretch the background image
      const background = this.add.image(400, 300, 'background')
      background.setDisplaySize(this.sys.canvas.width, this.sys.canvas.height)
  
      this.bgMusic = this.sound.add('bgMusic')
      this.bgMusic.play({ loop: true })
  
      this.player = this.physics.add.sprite(400, 550, 'player')
      this.player.setCollideWorldBounds(true)
      this.player.setScale(0.1)
  
      this.cursors = this.input.keyboard.createCursorKeys()
      this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
  
      this.projectiles = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Image,
        runChildUpdate: true,
        allowGravity: false
      })
  
      this.asteroids = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Image,
        runChildUpdate: true,
        allowGravity: false
      })
  
      this.physics.add.collider(this.projectiles, this.asteroids, this.hitAsteroid, null, this)
      this.physics.add.collider(this.player, this.asteroids, this.playerHit, null, this)
      this.physics.add.collider(this.asteroids, this.asteroids) // Ensure asteroids don't destroy each other
  
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
      this.checkWinCondition()
    }
  
    shootProjectile() {
      const projectile = this.projectiles.get(this.player.x, this.player.y, 'projectile')
      if (projectile) {
        projectile.setActive(true)
        projectile.setVisible(true)
        projectile.body.enable = true
        projectile.setScale(0.05)
        projectile.setVelocityY(-400)
  
        // Recycle projectile when it goes out of bounds
        projectile.body.onWorldBounds = true
        projectile.body.world.on('worldbounds', (body) => {
          if (body.gameObject === projectile) {
            projectile.setActive(false)
            projectile.setVisible(false)
            projectile.body.enable = false
          }
        })
  
        this.sound.play('shootSound')
      }
    }
  
    spawnAsteroid() {
      const x = Phaser.Math.Between(50, 750)
      const scale = Phaser.Math.FloatBetween(0.05, 0.2) // Random scale for the asteroid
      const asteroid = this.asteroids.get(x, 0, 'asteroid')
      if (asteroid) {
        asteroid.setActive(true)
        asteroid.setVisible(true)
        asteroid.body.enable = true
        asteroid.setScale(scale)
        asteroid.setVelocityY(200)
  
        // Apply random angular velocity for spinning effect
        asteroid.setAngularVelocity(Phaser.Math.Between(-200, 200))
  
        // Initially disable world bounds destruction
        asteroid.body.setCollideWorldBounds(false)
  
        // Enable world bounds destruction after 1 second
        this.time.delayedCall(1000000000, () => {
          asteroid.setCollideWorldBounds(true)
          asteroid.body.onWorldBounds = true
  
          // Add unique world bounds listener for this asteroid
          asteroid.body.world.on('worldbounds', (body) => {
            if (body.gameObject === asteroid) {
              asteroid.setActive(false)
              asteroid.setVisible(false)
              asteroid.body.enable = false
            }
          })
        })
  
        // Despawn asteroid after approximately 10 seconds
        this.time.delayedCall(10000000, () => {
          if (asteroid.active) {
            asteroid.setActive(false)
            asteroid.setVisible(false)
            asteroid.body.enable = false
          }
        })
      }
    }
  
    hitAsteroid(projectile, asteroid) {
      projectile.setActive(false)
      projectile.setVisible(false)
      projectile.body.enable = false
  
      asteroid.setActive(false)
      asteroid.setVisible(false)
      asteroid.body.enable = false
  
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
  
    checkWinCondition() {
      if (this.score >= 200) {
        this.bgMusic.stop()
        this.scene.start('WinScene', { score: this.score })
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
  
  // WinScene: Show winning message and restart option
  class WinScene extends Phaser.Scene {
    constructor() {
      super('WinScene')
    }
  
    init(data) {
      this.score = data.score
    }
  
    create() {
      this.add.text(400, 300, 'You Win!', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5)
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
    scene: [BootScene, TitleScene, GameScene, GameOverScene, WinScene]
  }
  
  const game = new Phaser.Game(config)
  