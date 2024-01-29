//--------------------------------------------------
// time: defined as time in msecs since app started
//--------------------------------------------------
const gravity = 0.7;
const floorHeight = 94;
class Sprite {
    constructor({ position, direction, sprites, currentSprite }) {
        this.position = position;
        this.direction = direction;
        this.sprites = sprites;
        this.sprites.forEach(img => {
            img.image = new Image();
            img.image.src = img.imageSrc;
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
            let horizontal = true, vertical = false;
            c.setTransform(-1, 0,
                0, 1,
                x + w + x,
                0);
            // c.setTransform(
            //     horizontal ? -1 : 1, 0, // set the direction of x axis
            //     0, vertical ? -1 : 1,   // set the direction of y axis
            //     x + (horizontal ? w : 0), // set the x origin
            //     y + (vertical ? h : 0)   // set the y origin
            // );
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
        // console.log(this.currentFrame);
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


const O = id => document.getElementById(id);
const canvas = O('cv');
const c = canvas.getContext('2d');

var keys = {
    w: false, d: false, a: false, lastad: '', hit1: false,
    t: false, r: false, l: false, lastrl: '', hit2: false
}

// Defining objects of the game
const background = new Sprite({
    position: { x: 0, y: 0 }, sprites: [{
        name: 'bkg',
        imageSrc: './game-sprites/background.png'
    }], currentSprite: 'bkg'
});
const shop = new Sprite({
    position: { x: 600, y: 128 }, sprites: [{
        name: 'shop',
        imageSrc: './game-sprites/shop.png',
        scale: 2.75,
        framesPerLine: 6,
        framesMax: 6,
        msPerFrame: 42
    }], currentSprite: 'shop'
});
const player1 = new Fighter({
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

const player2 = new Fighter({
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

const startTime = (new Date()).getTime();

canvas.width = 1024;
canvas.height = 576;

const animate = _ => {
    const currentTime = (new Date()).getTime() - startTime;

    c.clearRect(0, 0, canvas.width, canvas.height);

    background.update(currentTime);
    shop.update(currentTime);
    c.fillStyle = '#ffffff50';
    c.fillRect(0, 0, canvas.width, canvas.height);

    player1.updateKeys(keys.w, keys.d && keys.lastad == 'd', keys.a && keys.lastad == 'a', keys.hit1);
    player1.update(currentTime);
    player2.updateKeys(keys.t, keys.r && keys.lastrl == 'r', keys.l && keys.lastrl == 'l', keys.hit2);
    player2.update(currentTime);

    window.requestAnimationFrame(animate);
};
animate();

window.addEventListener('keydown', ev => {
    if (ev.key == 'w') keys.w = true;
    else if (ev.key == 'd') { keys.d = true; keys.lastad = 'd'; }
    else if (ev.key == ' ') keys.hit1 = true;
    else if (ev.key == 'a') { keys.a = true; keys.lastad = 'a'; }
    else if (ev.key == 'ArrowUp') keys.t = true;
    else if (ev.key == 'ArrowRight') { keys.r = true; keys.lastrl = 'r'; }
    else if (ev.key == 'Enter') keys.hit2 = true;
    else if (ev.key == 'ArrowLeft') { keys.l = true; keys.lastrl = 'l'; }
});

window.addEventListener('keyup', ev => {
    if (ev.key == 'w') keys.w = false;
    else if (ev.key == 'd') keys.d = false;
    else if (ev.key == ' ') keys.hit1 = false;
    else if (ev.key == 'a') keys.a = false;
    else if (ev.key == 'ArrowUp') keys.t = false;
    else if (ev.key == 'ArrowRight') keys.r = false;
    else if (ev.key == 'Enter') keys.hit2 = false;
    else if (ev.key == 'ArrowLeft') keys.l = false;
});

