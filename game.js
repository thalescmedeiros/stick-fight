//--------------------------------------------------
// time: defined as time in msecs since app started
//--------------------------------------------------
const allImages = [],
    allAudios = [];
const gameTime = 20;
const gravity = 0.2;
const deltaX = 4;
const floorHeight = 94;

const playMusic = 0;
const drawQuads = 1;

class Sprite {
    constructor({ name, game, direction = 1, position = { x: 0, y: 0 }, imageSrc, offset = { x: 0, y: 0 }, offsetInv = null, scale = 1,
        framesPerLine = 1, framesMax = 1, frameSize, loop = true, startUpFrames, loopFrames, msPerFrame = 1, quadAttack, quadBody, minAttackFrame, maxAttackFrame }) {
        this.name = name;
        this.game = game;
        this.direction = direction;
        this.position = position;
        this.quadAttack = quadAttack ?? null;
        this.quadBody = quadBody;
        this.minAttackFrame = minAttackFrame ?? 0;
        this.maxAttackFrame = maxAttackFrame ?? 0;
        let filename = imageSrc.substring(imageSrc.lastIndexOf('/') + 1);
        for (let i = 0; i < allImages.length; i++) {
            if (allImages[i].src.substring(allImages[i].src.lastIndexOf('/') + 1) == filename) {
                this.image = allImages[i];
                break;
            }
        }
        if (!this.image) {
            this.image = new Image();
            this.image.src = imageSrc;
        }
        this.offset = offset;
        this.offsetInv = offsetInv ?? offset;
        this.scale = scale;
        this.msPerFrame = msPerFrame;
        this.framesPerLine = framesPerLine;
        this.framesMax = framesMax;
        this.frameSize = frameSize ?? { w: this.image.width / this.framesPerLine, h: this.image.height / Math.ceil(this.framesMax / this.framesPerLine) };
        this.loop = loop;
        this.startUpFrames = startUpFrames ?? [];
        if (!startUpFrames && !this.loop)
            for (let i = 0; i < framesMax; i++) this.startUpFrames.push(i);
        this.loopFrames = loopFrames ?? [];
        if (!loopFrames && this.loop)
            for (let i = 0; i < this.framesMax; i++) this.loopFrames.push(i);
        this.start();
    }

    start() {
        this.startTime = this.game.currentTime;
        this.finished = false;
        this.attackSuccess = false;
    }

    switchToDirection(direction) {
        this.direction = direction;
    }

    draw() {
        let x = this.position.x + (this.direction == 1 ? this.offset.x : this.offsetInv.x),
            y = this.position.y + this.offset.y,
            w = this.frameSize.w * this.scale,
            h = this.frameSize.h * this.scale,
            drawInverted = this.direction == 0;
        if (drawInverted) {
            c.save();
            c.setTransform(-1, 0, 0, 1, x + w + x, 0);
        }
        c.drawImage(
            /* image */ this.image,
            /* sx    */(this.currentFrame % this.framesPerLine) * this.frameSize.w,
            /* sy    */ Math.floor(this.currentFrame / this.framesPerLine) * this.frameSize.h,
            /* sw    */ this.frameSize.w,
            /* sh    */ this.frameSize.h,
            /* dx    */ x,
            /* dy    */ y,
            /* dw    */ w,
            /* dh    */ h
        );

        if (drawInverted) {
            c.restore();
        }
    }

    update(time) {
        let ellapsedTime = time - this.startTime,
            numberFramesPassed = Math.floor(ellapsedTime / this.msPerFrame);
        if (numberFramesPassed >= this.startUpFrames.length) {
            if (this.loop)
                this.currentFrame = this.loopFrames[(numberFramesPassed - this.startUpFrames.length) % this.loopFrames.length];
            else this.currentFrame = this.startUpFrames[this.startUpFrames.length - 1];

            if (!this.loop && !this.finished && numberFramesPassed >= this.startUpFrames.length)
                this.finished = true;
        }
        else this.currentFrame = this.startUpFrames[numberFramesPassed];
        this.draw();
    }
};

class Fighter {
    constructor({ game, height, position, direction, velocity, sprites, currentSprite }) {
        this.position = position;
        this.velocity = velocity;
        this.height = height;
        this.direction = direction;
        this.sprites = [];
        this.health = 1;
        sprites.forEach(sprite => this.sprites.push(new Sprite({ game, direction, position, ...sprite })));
        this.switchToSprite(currentSprite);
    }

    switchToSprite(spriteName) {
        for (let i = 0; i < this.sprites.length; i++) if (this.sprites[i].name == spriteName) {
            this.currentSprite = this.sprites[i];
            this.currentSprite.switchToDirection(this.direction);
            this.currentSprite.start();
            break;
        }
    }

    updateKeys(up, down, right, left, hit1, hit2) {
        let dx = down && right && this.velocity.y == 0 ? deltaX / 3 : down && left && this.velocity.y == 0 ? -deltaX / 3 : right ? deltaX : left ? -deltaX : 0;
        if (dx != this.velocity.x) {
            let switchDir = (dx > 0 && this.direction == 0) || (dx < 0 && this.direction == 1);
            if (dx > 0) this.switchToDirection(1);
            else if (dx < 0) this.switchToDirection(0);
            this.velocity.x = dx;
            if (this.velocity.y == 0) {
                if (!down) this.switchToSprite(dx == 0 ? 'idle' : switchDir ? 'runSwitch' : 'idleToRun');
                else this.switchToSprite(dx == 0 ? 'crouchIdle' : 'crouchWalk');
            }
        }
        else if (dx != 0 && this.currentSprite.name == 'idle') {
            this.switchToSprite('idleToRun');
        }
        if (up && this.velocity.y == 0) {
            this.switchToSprite('jump');
            this.velocity.y -= 8;
        }
        else if (down && this.velocity.y == 0 && this.currentSprite.name.substring(0, 2) != 'cr') {
            this.switchToSprite('crouch');
        }
        else if (!down && this.currentSprite.name.substring(0, 2) == 'cr') {
            this.switchToSprite('idle');
        }
        if (hit1 && this.currentSprite.name == 'idle') {
            this.switchToSprite('lightHit');
        }
        else if (hit1 && this.velocity.y == 0 && this.velocity.x != 0 && this.currentSprite.name == 'run') {
            this.switchToSprite('runLightHit');
        }
        else if (hit1 && this.velocity.y != 0) {
            this.switchToSprite('jumpLightHit');
        }
        else if (hit2 && this.currentSprite.name == 'idle') {
            this.switchToSprite('heavyHit');
        }
        else if (hit2 && this.velocity.y == 0 && this.velocity.x != 0 && this.currentSprite.name == 'run') {
            this.switchToSprite('runHeavyHit');
        }
        else if (hit2 && this.velocity.y != 0) {
            this.switchToSprite('jumpHeavyHit');
        }
    }

    switchToDirection(direction) {
        this.direction = direction;
        this.currentSprite.switchToDirection(direction);
    }

    update(time) {
        let yFloor = canvas.height - floorHeight - this.height;
        if (this.position.y + this.velocity.y >= yFloor) {
            this.position.y = yFloor;
            this.velocity.y = 0;
        }
        else this.velocity.y += gravity;
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Controlling crouch animation
        if (this.currentSprite.name === 'crouch' && this.currentSprite.finished) {
            this.switchToSprite('crouchIdle');
        }

        // Controlling run animation
        if (this.currentSprite.name === 'runSwitch' && this.currentSprite.finished) {
            this.switchToSprite('run');
        }
        if (this.currentSprite.name === 'idleToRun' && this.currentSprite.finished) {
            this.switchToSprite(this.velocity.x == 0 ? 'idle' : 'run')
        }

        // Controlling jump and fall
        if (this.velocity.y >= 0 && this.currentSprite.name == 'jump') {
            this.switchToSprite('fall');
        }
        if (this.position.y == yFloor && this.currentSprite.name == 'fall') {
            this.switchToSprite(this.velocity.x == 0 ? 'jumpLandIdle' : 'jumpLandRun');
        }
        if (this.currentSprite.name == 'jumpLandIdle' && this.currentSprite.finished) {
            this.switchToSprite(this.velocity.x == 0 ? 'idle' : 'run');
        }
        if (this.currentSprite.name == 'jumpLandRun' && this.currentSprite.finished) {
            this.switchToSprite(this.velocity.x == 0 ? 'idle' : 'run');
        }

        // Controlling hits
        if (this.currentSprite.name == 'lightHit' && this.currentSprite.finished) {
            this.switchToSprite(this.velocity.x == 0 ? 'idle' : 'run');
        }
        if (this.currentSprite.name == 'runLightHit' && this.currentSprite.finished) {
            this.switchToSprite('idle');
        }
        if (this.currentSprite.name == 'heavyHit' && this.currentSprite.finished) {
            this.switchToSprite('idle');
        }
        if (this.currentSprite.name == 'runHeavyHit' && this.currentSprite.finished) {
            this.switchToSprite('idle');
        }
        if (this.currentSprite.name == 'jumpLightHit' && this.currentSprite.finished) {
            if (this.velocity.y == 0)
                this.switchToSprite(this.velocity.x == 0 ? 'jumpLandIdle' : 'jumpLandRun');
            else if (this.velocity < 0)
                this.switchToSprite('jump');
            else this.switchToSprite('fall');
        }
        if (this.currentSprite.name == 'jumpHeavyHit' && this.currentSprite.finished) {
            if (this.velocity.y == 0)
                this.switchToSprite(this.velocity.x == 0 ? 'jumpLandIdle' : 'jumpLandRun');
            else if (this.velocity < 0)
                this.switchToSprite('jump');
            else this.switchToSprite('fall');
        }

        this.currentSprite.update(time);
    }
};

class Game {
    constructor() {
        this.background = null;
        this.shop = null;
        this.player1 = null;
        this.player2 = null;
        this.keys = {
            w: false, s: false, d: false, a: false, lastad: '', hit11: false, hit12: false,
            up: false, down: false, r: false, l: false, lastrl: '', hit21: false, hit22: false
        };
        this.gameover = false;
    }

    initialize() {
        // First initialize global game time
        this.startTime = (new Date()).getTime();
        this.currentTime = 0;

        // Defining objects of the game
        this.background = new Sprite({
            name: 'bkg',
            game: this,
            imageSrc: './game-sprites/background.png'
        });
        this.shop = new Sprite({
            name: 'shop',
            game: this,
            frameSize: { w: 118, h: 128 },
            position: { x: 600, y: 128 },
            imageSrc: './game-sprites/shop.png',
            scale: 2.75,
            framesPerLine: 6,
            framesMax: 6,
            msPerFrame: 42,
            loopFrames: [0, 1, 2, 3, 4, 5]
        });
        let sprites = [
            {
                name: 'run',
                imageSrc: './game-sprites/run.png',
                frameSize: { w: 495, h: 375 },
                scale: 0.5,
                offset: { x: -10, y: 44 },
                offsetInv: { x: 120, y: 44 },
                framesPerLine: 4,
                framesMax: 8,
                msPerFrame: 42,
                quadBody: { x: 115, y: 0, w: 100, h: 180 }
            },
            {
                name: 'runSwitch',
                imageSrc: './game-sprites/run-switch2.png',
                frameSize: { w: 435, h: 375 },
                scale: 0.5,
                offset: { x: 60, y: 44 },
                offsetInv: { x: 80 },
                framesPerLine: 4,
                framesMax: 6,
                msPerFrame: 42,
                loop: false,
                quadBody: { x: 45, y: 0, w: 140, h: 190 }
            },
            {
                name: 'idleToRun',
                imageSrc: './game-sprites/idle-to-run.png',
                frameSize: { w: 472, h: 425 },
                scale: 0.5,
                offset: { x: 60, y: 18 },
                offsetInv: { x: 80 },
                framesPerLine: 2,
                framesMax: 4,
                msPerFrame: 42,
                loop: false,
                quadBody: { x: 105, y: 0, w: 100, h: 210 }
            },
            {
                name: 'runLightHit',
                imageSrc: './game-sprites/run-light-hit.png',
                frameSize: { w: 558, h: 400 },
                scale: 0.5,
                offset: { x: 60, y: 28 },
                offsetInv: { x: 80, y: 44 },
                framesPerLine: 3,
                framesMax: 8,
                msPerFrame: 42,
                loop: false,
                quadAttack: { x: 120, y: 20, w: 130, h: 60 },
                quadBody: { x: 80, y: 0, w: 100, h: 200 },
                minAttackFrame: 2,
                maxAttackFrame: 5
            },
            {
                name: 'runHeavyHit',
                imageSrc: './game-sprites/run-heavy-hit.png',
                frameSize: { w: 690, h: 400 },
                scale: 0.5,
                offset: { x: 60, y: 37 },
                offsetInv: { x: 80, y: 44 },
                framesPerLine: 5,
                framesMax: 12,
                msPerFrame: 42,
                loop: false,
                quadAttack: { x: 170, y: 30, w: 150, h: 110 },
                quadBody: { x: 130, y: 0, w: 100, h: 185 },
                minAttackFrame: 6,
                maxAttackFrame: 9
            },
            {
                name: 'idle',
                frameSize: { w: 452, h: 448 },
                imageSrc: './game-sprites/idle.png',
                scale: 0.5,
                offset: { x: 0, y: 0 },
                offsetInv: { x: 155, y: 0 },
                framesPerLine: 4,
                framesMax: 12,
                msPerFrame: 42,
                quadBody: { x: 140, y: 0, w: 85, h: 224 }
            },
            {
                name: 'crouch',
                frameSize: { w: 400, h: 530 },
                imageSrc: './game-sprites/crouch.png',
                scale: 0.5,
                offset: { x: 0, y: -40 },
                offsetInv: { x: 120, y: -40 },
                framesPerLine: 5,
                framesMax: 5,
                msPerFrame: 42,
                loop: false,
                quadBody: { x: 80, y: 135, w: 115, h: 125 }
            },
            {
                name: 'crouchIdle',
                frameSize: { w: 446, h: 253 },
                imageSrc: './game-sprites/crouch-idle.png',
                scale: 0.5,
                offset: { x: -26, y: 96 },
                offsetInv: { x: 123, y: -40 },
                framesPerLine: 4,
                framesMax: 12,
                msPerFrame: 42,
                quadBody: { x: 107, y: 0, w: 115, h: 125 }
            },
            {
                name: 'crouchWalk',
                frameSize: { w: 393, h: 278 },
                imageSrc: './game-sprites/crouch-walk.png',
                scale: 0.5,
                offset: { x: 0, y: 87 },
                offsetInv: { x: 123, y: -40 },
                framesPerLine: 5,
                framesMax: 16,
                msPerFrame: 42,
                quadBody: { x: 110, y: 0, w: 85, h: 140 }
            },
            {
                name: 'jump',
                frameSize: { w: 490, h: 480 },
                imageSrc: './game-sprites/jump.png',
                scale: 0.5,
                offset: { x: 0, y: -20 },
                offsetInv: { x: 120, y: -20 },
                framesPerLine: 4,
                framesMax: 5,
                msPerFrame: 42,
                startUpFrames: [0],
                loopFrames: [1, 2, 3, 4, 5],
                quadBody: { x: 115, y: 10, w: 100, h: 210 }
            },
            {
                name: 'jumpLandIdle',
                frameSize: { w: 447, h: 500 },
                imageSrc: './game-sprites/jump-land-idle.png',
                scale: 0.5,
                offset: { x: 29, y: -26 },
                offsetInv: { x: 120 },
                framesPerLine: 4,
                framesMax: 8,
                msPerFrame: 42,
                loop: false,
                quadBody: { x: 85, y: 50, w: 100, h: 200 }
            },
            {
                name: 'jumpLandRun',
                frameSize: { w: 479, h: 500 },
                imageSrc: './game-sprites/jump-land-run.png',
                scale: 0.5,
                offset: { x: 0, y: -23 },
                offsetInv: { x: 120 },
                framesPerLine: 4,
                framesMax: 8,
                msPerFrame: 42,
                loop: false,
                quadBody: { x: 55, y: 60, w: 130, h: 185 }
            },
            {
                name: 'fall',
                frameSize: { w: 490, h: 480 },
                imageSrc: './game-sprites/jump.png',
                scale: 0.5,
                offset: { x: 0, y: -20 },
                offsetInv: { x: 120, y: -20 },
                framesPerLine: 4,
                framesMax: 12,
                msPerFrame: 42,
                startUpFrames: [6, 7, 8],
                loopFrames: [8, 9, 9, 10, 10, 11],
                quadBody: { x: 85, y: 10, w: 145, h: 220 }
            },
            {
                name: 'lightHit',
                frameSize: { w: 620, h: 444 },
                imageSrc: './game-sprites/light-hit-1.png',
                scale: 0.5,
                offset: { x: 0, y: 0 },
                offsetInv: { x: 70, y: 0 },
                framesPerLine: 3,
                framesMax: 8,
                msPerFrame: 42,
                loop: false,
                quadAttack: { x: 175, y: 0, w: 110, h: 80 },
                quadBody: { x: 145, y: 0, w: 90, h: 220 },
                minAttackFrame: 2,
                maxAttackFrame: 4
            },
            {
                name: 'heavyHit',
                frameSize: { w: 604, h: 453 },
                imageSrc: './game-sprites/heavy-hit-1.png',
                scale: 0.5,
                offset: { x: 0, y: 0 },
                offsetInv: { x: 70, y: 0 },
                framesPerLine: 6,
                framesMax: 13,
                msPerFrame: 42,
                loop: false,
                quadAttack: { x: 185, y: 10, w: 110, h: 170 },
                quadBody: { x: 115, y: 10, w: 100, h: 210 },
                minAttackFrame: 7,
                maxAttackFrame: 10
            },
            {
                name: 'jumpLightHit',
                frameSize: { w: 613, h: 392 },
                imageSrc: './game-sprites/jump-light-hit.png',
                scale: 0.5,
                offset: { x: 50, y: 60 },
                offsetInv: { x: 70, y: 0 },
                framesPerLine: 3,
                framesMax: 6,
                msPerFrame: 42,
                loop: false,
                quadAttack: { x: 175, y: 10, w: 115, h: 55 },
                quadBody: { x: 90, y: 10, w: 170, h: 150 },
                minAttackFrame: 2,
                maxAttackFrame: 5
            },
            {
                name: 'jumpHeavyHit',
                frameSize: { w: 573, h: 328 },
                imageSrc: './game-sprites/jump-heavy-hit.png',
                scale: 0.5,
                offset: { x: 50, y: 65 },
                offsetInv: { x: 70, y: 0 },
                framesPerLine: 3,
                framesMax: 9,
                msPerFrame: 42,
                loop: false,
                quadAttack: { x: 135, y: 52, w: 150, h: 85 },
                quadBody: { x: 100, y: 7, w: 185, h: 150 },
                minAttackFrame: 6,
                maxAttackFrame: 8
            }
        ];
        this.player1 = new Fighter({
            game: this,
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            direction: 1,
            sprites,
            currentSprite: 'fall',
            height: 224
        });
        this.player2 = new Fighter({
            game: this,
            position: { x: 640, y: 0 },
            velocity: { x: 0, y: 0 },
            direction: 0,
            sprites,
            currentSprite: 'fall',
            height: 224
        });
        this.animate();
    }

    finishGame() {
        if (tmrVar) clearTimeout(tmrVar);
        this.gameover = true;
        
        let msg = 'Tie!';
        if (this.player1.health > this.player2.health) msg = 'Player 1 wins!';
        else if (this.player2.health > this.player1.health) msg = 'Player 2 wins!';
        
        let lbl = document.getElementById('lbl-msg');
        lbl.innerText = msg;
        lbl.style.display = 'flex';
    }

    checkCollisions() {
        let sp1 = this.player1.currentSprite,
            sp2 = this.player2.currentSprite;

        let p1Attacking = sp1.quadAttack && sp1.minAttackFrame <= sp1.currentFrame && sp1.maxAttackFrame >= sp1.currentFrame,
            p2Attacking = sp2.quadAttack && sp2.minAttackFrame <= sp2.currentFrame && sp2.maxAttackFrame >= sp2.currentFrame;
        // if (!p1Attacking && !p2Attacking) return;

        let p1Pos = {
            x: sp1.position.x + (sp1.direction == 1 ? sp1.offset.x : sp1.offsetInv.x),
            y: sp1.position.y + sp1.offset.y,
            w: sp1.frameSize.w * sp1.scale,
            h: sp1.frameSize.h * sp1.scale
        }, p1RectBody = {
            x: sp1.direction == 0 ? p1Pos.x + (p1Pos.w - sp1.quadBody.x) - sp1.quadBody.w : p1Pos.x + sp1.quadBody.x,
            y: p1Pos.y + sp1.quadBody.y,
            w: sp1.quadBody.w,
            h: sp1.quadBody.h
        }, p1RectAttack = sp1.quadAttack ? {
            x: sp1.direction == 0 ? p1Pos.x + (p1Pos.w - sp1.quadAttack.x) - sp1.quadAttack.w : p1Pos.x + sp1.quadAttack.x,
            y: p1Pos.y + sp1.quadAttack.y,
            w: sp1.quadAttack.w,
            h: sp1.quadAttack.h
        } : null;

        let p2Pos = {
            x: sp2.position.x + (sp2.direction == 1 ? sp2.offset.x : sp2.offsetInv.x),
            y: sp2.position.y + sp2.offset.y,
            w: sp2.frameSize.w * sp2.scale,
            h: sp2.frameSize.h * sp2.scale
        }, p2RectBody = {
            x: sp2.direction == 0 ? p2Pos.x + (p2Pos.w - sp2.quadBody.x) - sp2.quadBody.w : p2Pos.x + sp2.quadBody.x,
            y: p2Pos.y + sp2.quadBody.y,
            w: sp2.quadBody.w,
            h: sp2.quadBody.h
        }, p2RectAttack = sp2.quadAttack ? {
            x: sp2.direction == 0 ? p2Pos.x + (p2Pos.w - sp2.quadAttack.x) - sp2.quadAttack.w : p2Pos.x + sp2.quadAttack.x,
            y: p2Pos.y + sp2.quadAttack.y,
            w: sp2.quadAttack.w,
            h: sp2.quadAttack.h
        } : null;

        const rectTouches = (a, b) => {
            let ax1 = a.x, ax2 = a.x + a.w, bx1 = b.x, bx2 = b.x + b.w,
                ay1 = a.y, ay2 = a.y + a.h, by1 = b.y, by2 = b.y + b.h;

            // no horizontal overlap
            if (ax1 >= bx2 || bx1 >= ax2) return false;

            // no vertical overlap
            if (ay1 >= by2 || by1 >= ay2) return false;

            return true;
        };

        let p1HitP2 = !this.gameover && p1Attacking && !sp1.attackSuccess && rectTouches(p1RectAttack, p2RectBody),
            p2HitP1 = !this.gameover && p2Attacking && !sp2.attackSuccess && rectTouches(p2RectAttack, p1RectBody);
        if (p1HitP2 && p2HitP1) {
            // Priority for the one who started the attack first
            if (sp1.currentFrame < sp2.currentFrame) p2HitP1 = false;
            else if (sp1.currentFrame > sp2.currentFrame) p1HitP2 = false;
        }

        if (p1HitP2) {
            sp1.attackSuccess = true;

            let damage = /light/i.test(sp1.name) ? 0.10 : 0.30;
            this.player2.health -= damage;
            if (this.player2.health <= 0) {
                this.player2.health = 0;
                this.finishGame();
            }
            document.querySelectorAll('.health')[1].querySelector('div').style.width = (this.player2.health * 100) + '%';
        }
        if (p2HitP1) {
            sp2.attackSuccess = true;

            let damage = /light/i.test(sp2.name) ? 0.10 : 0.30;
            this.player1.health -= damage;
            if (this.player1.health <= 0) {
                this.player1.health = 0;
                this.finishGame();
            }
            document.querySelectorAll('.health')[0].querySelector('div').style.width = (this.player1.health * 100) + '%';
        }

        if (drawQuads) {
            c.strokeStyle = 'blue';
            c.beginPath();
            c.rect(p1RectBody.x, p1RectBody.y, p1RectBody.w, p1RectBody.h);
            c.stroke();
            c.beginPath();
            c.rect(p2RectBody.x, p2RectBody.y, p2RectBody.w, p2RectBody.h);
            c.stroke();
            if (p1Attacking) {
                c.strokeStyle = p1HitP2 ? 'yellow' : 'red';
                c.beginPath();
                c.rect(p1RectAttack.x, p1RectAttack.y, p1RectAttack.w, p1RectAttack.h);
                c.stroke();
            }
            if (p2Attacking) {
                c.strokeStyle = p2HitP1 ? 'yellow' : 'red';
                c.beginPath();
                c.rect(p2RectAttack.x, p2RectAttack.y, p2RectAttack.w, p2RectAttack.h);
                c.stroke();
            }
        }
    }

    animate() {
        this.currentTime = (new Date()).getTime() - this.startTime;

        c.clearRect(0, 0, canvas.width, canvas.height);

        this.background.update(this.currentTime);
        this.shop.update(this.currentTime);
        c.fillStyle = '#ffffff50';
        c.fillRect(0, 0, canvas.width, canvas.height);

        this.checkCollisions();

        this.player1.updateKeys(this.keys.w, this.keys.s, this.keys.d && this.keys.lastad == 'd', this.keys.a && this.keys.lastad == 'a', this.keys.hit11, this.keys.hit12);
        this.player1.update(this.currentTime);

        this.player2.updateKeys(this.keys.up, this.keys.down, this.keys.r && this.keys.lastrl == 'r', this.keys.l && this.keys.lastrl == 'l', this.keys.hit21, this.keys.hit22);
        this.player2.update(this.currentTime);

        window.requestAnimationFrame(_ => this.animate());
    }
}

const O = id => document.getElementById(id);
const canvas = O('cv');
const c = canvas.getContext('2d');

canvas.width = 1024;
canvas.height = 576;

const game = new Game();
var tmrVar = null;

window.addEventListener('keydown', ev => {
    if (ev.key == 'w') game.keys.w = true;
    else if (ev.key == 's') game.keys.s = true
    else if (ev.key == 'd') { game.keys.d = true; game.keys.lastad = 'd'; }
    else if (ev.key == ' ') game.keys.hit11 = true;
    else if (ev.key == 'Control') game.keys.hit12 = true;
    else if (ev.key == 'a') { game.keys.a = true; game.keys.lastad = 'a'; }
    else if (ev.key == 'ArrowUp') { game.keys.up = true; ev.preventDefault(); }
    else if (ev.key == 'ArrowDown') { game.keys.down = true; ev.preventDefault(); }
    else if (ev.key == 'ArrowRight') { game.keys.r = true; game.keys.lastrl = 'r'; ev.preventDefault(); }
    else if (ev.key == 'Enter') game.keys.hit21 = true;
    else if (ev.key == 'Shift') game.keys.hit22 = true;
    else if (ev.key == 'ArrowLeft') { game.keys.l = true; game.keys.lastrl = 'l'; ev.preventDefault(); }
});

window.addEventListener('keyup', ev => {
    if (ev.key == 'w') game.keys.w = false;
    else if (ev.key == 's') game.keys.s = false;
    else if (ev.key == 'd') game.keys.d = false;
    else if (ev.key == ' ') game.keys.hit11 = false;
    else if (ev.key == 'Control') game.keys.hit12 = false;
    else if (ev.key == 'a') game.keys.a = false;
    else if (ev.key == 'ArrowUp') game.keys.up = false;
    else if (ev.key == 'ArrowDown') game.keys.down = false;
    else if (ev.key == 'ArrowRight') game.keys.r = false;
    else if (ev.key == 'Enter') game.keys.hit21 = false;
    else if (ev.key == 'Shift') game.keys.hit22 = false;
    else if (ev.key == 'ArrowLeft') game.keys.l = false;
});

window.addEventListener('load', _ => {
    const promiseToLoadImage = imageSrc => new Promise(res => {
        const image = new Image();
        allImages.push(image);
        image.addEventListener('load', _ => res());
        image.src = imageSrc;
    });
    let promises = [],
        imageSources = [
            './game-sprites/background.png',
            './game-sprites/shop.png',
            './game-sprites/run.png',
            './game-sprites/crouch.png',
            './game-sprites/idle.png'
        ], audioSources = ["audios/music1.aac"];
    imageSources.forEach(src => promises.push(promiseToLoadImage(src)));

    audioSources.forEach(src => {
        const audioElement = new Audio(src);
        audioElement.loop = true;
        // audioElement.addEventListener('ended', _ => {
        //     audioElement.currentTime = 0;
        //     audioElement.play();
        // }, false);
        promises.push(new Promise(res => audioElement.addEventListener("loadeddata", _ => res())));
        allAudios.push(audioElement);
    });

    const btn = document.querySelector("button");
    const startGame = _ => {
        let timerSecs = gameTime;
        document.querySelector('.timer').innerText = timerSecs;

        const countDown = _ => {
            if (timerSecs > 0) timerSecs--;
            
            document.querySelector('.timer').innerText = timerSecs;

            if (timerSecs > 0) tmrVar = setTimeout(countDown, 1000);
            else game.finishGame();
        };

        btn.style.display = 'none';
        O('top-bar').style.display = 'flex';
        Promise.all(promises).then(_ => {
            game.initialize();
            if (playMusic) allAudios[0].play();
            tmrVar = setTimeout(countDown, 1000);
        });
    };

    btn.addEventListener("click", startGame);
    if (!playMusic) startGame();
});

