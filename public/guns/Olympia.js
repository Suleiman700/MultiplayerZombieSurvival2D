class Olympia extends Shotgun{
    constructor(xPos ,yPos){
        super();
        this.name = "Olympia";
        this.gunIndex = 7;

        this.sounds = {
            firedBullet: './assets/sounds/guns/Olympia_bullet.mp3',
            gunReload: './assets/sounds/guns/gun_reload.mp3',
        }
    }
}