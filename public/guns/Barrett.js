class Barrett extends Sniper{
    constructor(xPos, yPos){
        super();
        this.name = "Barrett 50 Cal";
        this.img = loadImage('images/barrett.png');
        this.cost = 2000;
        this.ammoCost = 1000;
        this.imgl = 100;
        this.imgw = 40;
        this.damageDecreaseConstant = 5;

        this.sounds = {
            firedBullet: './assets/sounds/guns/Barett_bullet.mp3',
            gunReload: './assets/sounds/guns/gun_reload.mp3',
        }
    }
}