
class GunSoundsC {
    constructor() {

    }

    /**
     * play fired bullet sound
     * the sound volume is changed based on the shooter distance from the current player
     * @param firedBulletSoundPath {string} > example: ./assets/sounds/guns/M1911_bullet.mp3
     * @param _bulletStartX {string|number} > example: 500.04
     * @param _bulletStartY {string|number} > example: 610.50
     * */
    playFiredBulletSound(_firedBulletSoundPath, _bulletStartX, _bulletStartY) {
        // Play sound
        try {
            const audio = new Audio(_firedBulletSoundPath)
            audio.volume = 0.5
            audio.play()

            // Position the sound based on the bullet's position
            const listenerX = players[clientPlayer.roomIndex].x
            const listenerY = players[clientPlayer.roomIndex].y
            const dx = _bulletStartX - listenerX
            const dy = _bulletStartY - listenerY
            const distance = Math.sqrt(dx*dx + dy*dy)

            // Calculate the volume based on the distance (lower volume for longer distances)
            let volume = 1 - (distance / 1650)  // Adjust this constant to control the volume drop-off
            volume = Math.max(0, volume) // Clamp the volume to a minimum of 0

            // Set the volume and position of the sound
            audio.volume = volume
            audio.positonX = dx
            audio.positionY = dy
        }
        catch (e) {
            console.log(e)
        }

    }

    /**
     * play reload sound
     * @param _reloadSoundPath {string} > example: ./assets/sounds/guns/gun_reload.mp3
     */
    playReloadSound(_reloadSoundPath) {
        // Play sound
        const audio = new Audio(_reloadSoundPath)
        audio.volume = 0.5
        audio.play()
    }
}