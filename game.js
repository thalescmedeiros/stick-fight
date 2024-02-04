//--------------------------------------------------
// time: defined as time in msecs since app started
//--------------------------------------------------
const allImages = [],
    allAudios = [];
const gravity = 0.7;
const deltaX = 5; // 5
const floorHeight = 94;

const playMusic = 0;

class oldSprite {
    constructor({ game, position, direction, sprites, currentSprite }) {
        this.game = game;
        this.position = position;
        this.direction = direction;
        this.sprites = sprites;
        this.sprites.forEach(img => {
            let filename = img.imageSrc.substring(img.imageSrc.lastIndexOf('/') + 1);
            for (let i = 0; i < allImages.length; i++) {
                if (allImages[i].src.substring(allImages[i].src.lastIndexOf('/') + 1) == filename) {
                    img.image = allImages[i];
                    break;
                }
            }
            if (!img.image) {
                // img.image = new Image();
                // img.image.src = img.imageSrc;
            }
            if (!img.msPerFrame) img.msPerFrame = 1;
            if (!img.offset) img.offset = { x: 0, y: 0 };
            if (!img.scale) img.scale = 1;
            if (!img.framesPerLine) img.framesPerLine = 1;
            if (!img.framesMax) img.framesMax = 1;
            if (!img.frameSize)
                img.frameSize = { w: img.image.width / img.framesPerLine, h: img.image.height / Math.ceil(img.framesMax / img.framesPerLine) };
            if (!img.loop) img.loop = true;
            if (!img.startUpFrames) {
                img.startUpFrames = [];
                if (!!img.loop) for (let i = 0; i < img.framesMax; i++) img.startUpFrames.push(i);
            }
            if (!img.loopFrames && img.loop) {
                img.loopFrames = [];
                for (let i = 0; i < img.framesMax; i++) img.loopFrames.push(i);
            }
        });
        this.switchToSprite(currentSprite);
    }

    switchToSprite(spriteName) {
        this.currentSpriteStartTime = this.game.currentTime;
        for (let i = 0; i < this.sprites.length; i++) if (this.sprites[i].name == spriteName) {
            this.currentSprite = this.sprites[i];
            this.currentFrame = 0;
            break;
        }
    }

    draw() {
        let x = this.position.x + this.currentSprite.offset.x,
            y = this.position.y + this.currentSprite.offset.y,
            w = this.currentSprite.frameSize.w * this.currentSprite.scale,
            h = this.currentSprite.frameSize.h * this.currentSprite.scale;
        if (this.direction == 0) {
            c.save();
            c.setTransform(-1, 0, 0, 1, x + w + x, 0);
        }
        c.drawImage(
            /* image */ this.currentSprite.image,
            /* sx    */(this.currentFrame % this.currentSprite.framesPerLine) * this.currentSprite.frameSize.w,
            /* sy    */ Math.floor(this.currentFrame / this.currentSprite.framesPerLine) * this.currentSprite.frameSize.h,
            /* sw    */ this.currentSprite.frameSize.w,
            /* sh    */ this.currentSprite.frameSize.h,
            /* dx    */ x,
            /* dy    */ y,
            /* dw    */ w,
            /* dh    */ h
        );
        if (this.direction == 0) {
            c.restore();
        }
    }

    update(time) {
        let ellapsedTime = time - this.currentSpriteStartTime,
            numberFramesPassed = Math.floor(ellapsedTime / this.currentSprite.msPerFrame);
        if (numberFramesPassed > this.currentSprite.startUpFrames.length)
            this.currentFrame = this.currentSprite.loopFrames[(numberFramesPassed - this.currentSprite.startUpFrames.length) % this.currentSprite.loopFrames.length];
        else this.currentFrame = this.currentSprite.startUpFrames[numberFramesPassed];
        this.draw();
    }
}

class Sprite {
    constructor({ name, game, direction = 1, position = { x: 0, y: 0 }, imageSrc, offset = { x: 0, y: 0 }, offsetInv = null, scale = 1,
        framesPerLine = 1, framesMax = 1, frameSize, loop = true, startUpFrames, loopFrames, msPerFrame = 1 }) {
        this.name = name;
        this.game = game;
        this.direction = direction;
        this.position = position;
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
    }

    switchToDirection(direction) {
        this.direction = direction;
    }

    draw() {
        let x = this.position.x + (this.direction == 1 ? this.offset.x : this.offsetInv.x),
            y = this.position.y + this.offset.y,
            w = this.frameSize.w * this.scale,
            h = this.frameSize.h * this.scale;
        if (this.direction == 0) {
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
        if (this.direction == 0) {
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
        let dx = down ? 0 : right ? deltaX : left ? -deltaX : 0;
        if (dx != this.velocity.x) {
            if (dx > 0) this.switchToDirection(1);
            else if (dx < 0) this.switchToDirection(0);
            this.velocity.x = dx;
            this.switchToSprite(dx == 0 ? 'idle' : 'run');
        }
        if (up && this.velocity.y == 0) {
            this.switchToSprite('jump');
            this.velocity.y -= 18;
        }
        else if (down && this.velocity.y == 0 && this.currentSprite.name != 'crouch') {
            this.switchToSprite('crouch');
        }
        else if (!down && this.currentSprite.name == 'crouch') {
            this.switchToSprite('idle');
        }
        if (hit1 && this.currentSprite.name == 'idle') {
            this.switchToSprite('lightHit1');
        }
        if (hit2 && this.currentSprite.name == 'idle') {
            this.switchToSprite('heavyHit1');
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

        // Controlling jump and fall
        if (this.velocity.y >= 0 && this.currentSprite.name == 'jump') {
            this.switchToSprite('fall');
        }
        if (this.position.y == yFloor && this.currentSprite.name == 'fall') {
            this.switchToSprite('idle');
        }

        // Controlling hits
        if (this.currentSprite.name == 'lightHit1' && this.currentSprite.finished) {
            this.switchToSprite('idle');
        }
        if (this.currentSprite.name == 'heavyHit1' && this.currentSprite.finished) {
            this.switchToSprite('idle');
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
                offset: { x: 60, y: 44 },
                offsetInv: { x: 80, y: 44 },
                framesPerLine: 4,
                framesMax: 8,
                msPerFrame: 42
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
                msPerFrame: 42
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
                loop: false
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
                loopFrames: [1, 2, 3, 4, 5]
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
                loopFrames: [8, 9, 9, 10, 10, 11]
            },
            {
                name: 'lightHit1',
                frameSize: { w: 620, h: 444 },
                imageSrc: './game-sprites/light-hit-1.png',
                scale: 0.5,
                offset: { x: 0, y: 0 },
                offsetInv: { x: 70, y: 0 },
                framesPerLine: 3,
                framesMax: 8,
                msPerFrame: 42,
                loop: false
            },
            {
                name: 'heavyHit1',
                frameSize: { w: 604, h: 453 },
                imageSrc: './game-sprites/heavy-hit-1.png',
                scale: 0.5,
                offset: { x: 0, y: 0 },
                offsetInv: { x: 70, y: 0 },
                framesPerLine: 6,
                framesMax: 13,
                msPerFrame: 42,
                loop: false
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

    checkCollisions() {

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
        // c.strokeStyle = 'red';
        // c.beginPath();
        // c.rect(this.player1.position.x + (this.player1.direction == 1 ? this.player1.currentSprite.offset.x : this.player1.currentSprite.offsetInv.x), this.player1.position.y, this.player1.currentSprite.frameSize.w * this.player1.currentSprite.scale, this.player1.currentSprite.frameSize.w * this.player1.currentSprite.scale);
        // c.stroke();


        this.player2.updateKeys(this.keys.up, this.keys.down, this.keys.r && this.keys.lastrl == 'r', this.keys.l && this.keys.lastrl == 'l', this.keys.hit21, this.keys.hit22);
        this.player2.update(this.currentTime);
        // c.strokeStyle = 'red';
        // c.beginPath();
        // c.rect(this.player2.position.x + (this.player2.direction == 1 ? this.player2.currentSprite.offset.x : this.player2.currentSprite.offsetInv.x), this.player2.position.y, this.player2.currentSprite.frameSize.w * this.player2.currentSprite.scale, this.player2.currentSprite.frameSize.w * this.player2.currentSprite.scale);
        // c.stroke();

        window.requestAnimationFrame(_ => this.animate());
    }
}

const O = id => document.getElementById(id);
const canvas = O('cv');
const c = canvas.getContext('2d');

canvas.width = 1024;
canvas.height = 576;

const game = new Game();

window.addEventListener('keydown', ev => {
    ev.preventDefault();
    if (ev.key == 'w') game.keys.w = true;
    else if (ev.key == 's') game.keys.s = true
    else if (ev.key == 'd') { game.keys.d = true; game.keys.lastad = 'd'; }
    else if (ev.key == ' ') game.keys.hit11 = true;
    else if (ev.key == 'Control') game.keys.hit12 = true;
    else if (ev.key == 'a') { game.keys.a = true; game.keys.lastad = 'a'; }
    else if (ev.key == 'ArrowUp') game.keys.up = true;
    else if (ev.key == 'ArrowDown') game.keys.down = true;
    else if (ev.key == 'ArrowRight') { game.keys.r = true; game.keys.lastrl = 'r'; }
    else if (ev.key == 'Enter') game.keys.hit21 = true;
    else if (ev.key == 'Shift') game.keys.hit22 = true;
    else if (ev.key == 'ArrowLeft') { game.keys.l = true; game.keys.lastrl = 'l'; }
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
        let timerSecs = 20;
        const countDown = _ => {
            if (timerSecs > 0) {
                timerSecs--;
                setTimeout(countDown, 1000);
            }
            // else
            document.querySelector('.timer').innerText = timerSecs;
        };

        btn.style.display = 'none';
        O('top-bar').style.display = 'flex';
        Promise.all(promises).then(_ => {
            game.initialize();
            allAudios[0].play();
            setTimeout(countDown, 1000);
        });
    };

    btn.addEventListener("click", startGame);
    if (!playMusic) startGame();
});

