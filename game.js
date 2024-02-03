//--------------------------------------------------
// time: defined as time in msecs since app started
//--------------------------------------------------
const allImages = [],
    allAudios = [];
const gravity = 0.7;
const floorHeight = 94;
class Sprite {
    constructor({ position, direction, sprites, currentSprite }) {
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
        });
        this.switchToSprite(currentSprite);
    }

    switchToDirection(direction) {
        this.direction = direction;
    }

    switchToSprite(spriteName) {
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
        this.currentFrame = Math.ceil(time / this.currentSprite.msPerFrame) % this.currentSprite.framesMax;
        this.draw();
    }
};

class Fighter extends Sprite {
    constructor({ height, position, direction, velocity, sprites, currentSprite }) {
        super({ position, direction, sprites, currentSprite });
        this.velocity = velocity;
        this.height = height;
    }

    updateKeys(top, right, left, hit) {
        let dx = right ? 5 : left ? -5 : 0;
        if (dx != this.velocity.x) {
            if (dx > 0) this.direction = 1;
            else if (dx < 0) this.direction = 0;
            this.velocity.x = dx;
            this.switchToSprite(dx == 0 ? 'idle' : 'run');
        }
        if (top && this.velocity.y == 0) this.velocity.y -= 18;
    }

    update(time) {
        if (this.position.y + this.height + floorHeight + this.velocity.y >= canvas.height) {
            this.position.y = canvas.height - floorHeight - this.height;
            this.velocity.y = 0;
        }
        else this.velocity.y += gravity;
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        super.update(time);
    }
};

class Game {
    constructor() {
        this.background = null;
        this.shop = null;
        this.player1 = null;
        this.player2 = null;
        this.keys = {
            w: false, d: false, a: false, lastad: '', hit1: false,
            t: false, r: false, l: false, lastrl: '', hit2: false
        };
    }

    initialize() {
        // Defining objects of the game
        this.background = new Sprite({
            position: { x: 0, y: 0 }, sprites: [{
                name: 'bkg',
                imageSrc: './game-sprites/background.png'
            }], currentSprite: 'bkg'
        });
        this.shop = new Sprite({
            position: { x: 600, y: 128 }, sprites: [{
                name: 'shop',
                imageSrc: './game-sprites/shop.png',
                scale: 2.75,
                framesPerLine: 6,
                framesMax: 6,
                msPerFrame: 42
            }], currentSprite: 'shop'
        });
        this.player1 = new Fighter({
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            direction: 1,
            sprites: [
                {
                    name: 'run',
                    imageSrc: './game-sprites/run.png',
                    frameSize: { w: 495, h: 375 },
                    scale: 0.5,
                    offset: { x: 0, y: 44 },
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
                    framesPerLine: 4,
                    framesMax: 12,
                    msPerFrame: 42
                }
            ],
            currentSprite: 'idle',
            height: 224
        });
        this.player2 = new Fighter({
            position: { x: 790, y: 0 },
            velocity: { x: 0, y: 0 },
            direction: 0,
            sprites: [
                {
                    name: 'run',
                    imageSrc: './game-sprites/run.png',
                    frameSize: { w: 495, h: 375 },
                    scale: 0.5,
                    offset: { x: 0, y: 44 },
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
                    framesPerLine: 4,
                    framesMax: 12,
                    msPerFrame: 42
                }
            ],
            currentSprite: 'idle',
            height: 224
        });
        this.startTime = (new Date()).getTime();
        this.animate();
    }

    animate() {
        const currentTime = (new Date()).getTime() - this.startTime;

        c.clearRect(0, 0, canvas.width, canvas.height);

        this.background.update(currentTime);
        this.shop.update(currentTime);
        c.fillStyle = '#ffffff50';
        c.fillRect(0, 0, canvas.width, canvas.height);

        this.player1.updateKeys(this.keys.w, this.keys.d && this.keys.lastad == 'd', this.keys.a && this.keys.lastad == 'a', this.keys.hit1);
        this.player1.update(currentTime);
        this.player2.updateKeys(this.keys.t, this.keys.r && this.keys.lastrl == 'r', this.keys.l && this.keys.lastrl == 'l', this.keys.hit2);
        this.player2.update(currentTime);

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
    if (ev.key == 'w') game.keys.w = true;
    else if (ev.key == 'd') { game.keys.d = true; game.keys.lastad = 'd'; }
    else if (ev.key == ' ') game.keys.hit1 = true;
    else if (ev.key == 'a') { game.keys.a = true; game.keys.lastad = 'a'; }
    else if (ev.key == 'ArrowUp') game.keys.t = true;
    else if (ev.key == 'ArrowRight') { game.keys.r = true; game.keys.lastrl = 'r'; }
    else if (ev.key == 'Enter') game.keys.hit2 = true;
    else if (ev.key == 'ArrowLeft') { game.keys.l = true; game.keys.lastrl = 'l'; }
});

window.addEventListener('keyup', ev => {
    if (ev.key == 'w') game.keys.w = false;
    else if (ev.key == 'd') game.keys.d = false;
    else if (ev.key == ' ') game.keys.hit1 = false;
    else if (ev.key == 'a') game.keys.a = false;
    else if (ev.key == 'ArrowUp') game.keys.t = false;
    else if (ev.key == 'ArrowRight') game.keys.r = false;
    else if (ev.key == 'Enter') game.keys.hit2 = false;
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
    btn.addEventListener("click", _ => {
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
    });
});

