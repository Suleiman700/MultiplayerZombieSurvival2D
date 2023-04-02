class Score{
    constructor(){
        this.round;
        this.money = 0;
        this.enemiesRemaining;
        this.playerHealth = 100;
        this.ammoOut = currentGun.startingOut;
        this.ammoIn = currentGun.startingIn;
        this.reloading = false;
    }

    drawScoreLayout(){

        //bottom right menu (round, kills, money, enemies)
        fill(185, 185, 185)
        var rectX = windowWidth - 210;
        var rectY = windowHeight - 210;
        var rectXlen = 200;
        var rectYlen = 200;

        //top center section (round)
        textSize(25);
        fill(255, 0, 0);
        textAlign(CENTER);
        text("Wave " + this.round, windowWidth/2, 30);
        textSize(20);
        text("Enemies Left: " + this.enemiesRemaining, windowWidth/2, 60);

        // top left section
        textSize(20);
        textAlign(LEFT);
        text("Kills: " + players[clientPlayer.roomIndex].kills, 20, 30);
        text("Money: $" + this.money, 20, 60);

        fill(185, 185, 185)
        textAlign(CENTER);

        // rect(rectX, rectY, rectXlen, rectYlen, 50)
        // fill(185, 0, 0)
        // textSize(25);
        // text("Round " + this.round, rectX + rectXlen/2, rectY + 40);
        // text("Kills: " + players[clientPlayer.roomIndex].kills, rectX + rectXlen/2, rectY + 80);
        // text("Money: $" + this.money, rectX + rectXlen/2, rectY + 120);
        // text("Enemies: " + this.enemiesRemaining, rectX + rectXlen/2, rectY + 160);

        //botttom left menu(health bar)
        rectX = 10;
        rectY = windowHeight - 60;
        rectXlen = 300;
        rectYlen = 50;

        fill(185, 185, 185)
        rect(rectX, rectY, rectXlen, rectYlen, 50)
        fill(200 - this.playerHealth*2, 0, 0);
        if(this.playerHealth > 0){
            rect(rectX + 25, rectY + 5, this.playerHealth * 2.5, 40);
        }

        // bottom right menu (gun, total ammo, ammo in mag)
        rectX = windowWidth - 250;
        rectY = windowHeight - 60;
        rectXlen = 220;
        rectYlen = 50;
        fill(185, 185, 185);
        rect(rectX, rectY, rectXlen, rectYlen, 50);
        fill(185, 0, 0);
        textSize(currentGun.textSize);
        // image(currentGun.img, rectX + 10, rectY + 7, 35, 35); // Draw gun image
        text(currentGun.name, rectX + 115, rectY + rectYlen/2);
        textSize(20);
        text(this.ammoIn, rectX + 195, rectY + rectYlen/3);
        text(this.ammoOut, rectX + 195, rectY + 2*(rectYlen/3));

        // //top right menu(gun, total ammo, ammo in mag)
        // rectX =  windowWidth - 210;
        // rectY =  10;
        // rectXlen = 200;
        // rectYlen = 50;
        // fill(185, 185, 185);
        // rect(rectX, rectY, rectXlen, rectYlen, 50);
        // fill(185, 0, 0)
        // textSize(currentGun.textSize);
        // text(currentGun.name, rectX + 80, rectY + rectYlen/2);
        // // Draw gun image
        // image(currentGun.img, rectX + 10, rectY + 10, 50, 50);
        // textSize(20);
        // text(this.ammoIn, rectX + 170, rectY + rectYlen/3);
        // text(this.ammoOut, rectX + 170, rectY + 2*(rectYlen/3));

        //reload
        if(this.reloading){
            textSize(40);
            text("Reloading", windowWidth/2, clientPlayer.y + 300);
        }




        // ORIGINAL CODE
        // //bottom right menu (round, kills, money, enemies)
        // fill(185, 185, 185)
        // var rectX = windowWidth - 210;
        // var rectY = windowHeight - 210;
        // var rectXlen = 200;
        // var rectYlen = 200;
        //
        // rect(rectX, rectY, rectXlen, rectYlen, 50)
        // fill(185, 0, 0)
        // textSize(25);
        // // text("Round " + this.round, rectX + rectXlen/2, rectY + 40);
        // text("Kills: " + players[clientPlayer.roomIndex].kills, rectX + rectXlen/2, rectY + 80);
        // text("Money: $" + this.money, rectX + rectXlen/2, rectY + 120);
        // text("Enemies: " + this.enemiesRemaining, rectX + rectXlen/2, rectY + 160);
        //
        // //botttom left menu(health bar)
        // rectX = 10;
        // rectY = windowHeight - 60;
        // rectXlen = 300;
        // rectYlen = 50;
        //
        // fill(185, 185, 185)
        // rect(rectX, rectY, rectXlen, rectYlen, 50)
        // fill(200 - this.playerHealth*2, 0, 0);
        // if(this.playerHealth > 0){
        //     rect(rectX + 25, rectY + 5, this.playerHealth * 2.5, 40);
        // }
        //
        //
        // //top right menu(gun, total ammo, ammo in mag)
        // rectX =  windowWidth - 210;
        // rectY =  10;
        // rectXlen = 200;
        // rectYlen = 50;
        // fill(185, 185, 185);
        // rect(rectX, rectY, rectXlen, rectYlen, 50);
        // fill(185, 0, 0)
        // textSize(currentGun.textSize);
        // text(currentGun.name, rectX + 80, rectY + rectYlen/2);
        // textSize(20);
        // text(this.ammoIn, rectX + 170, rectY + rectYlen/3);
        // text(this.ammoOut, rectX + 170, rectY + 2*(rectYlen/3));
        //
        // //reload
        // if(this.reloading){
        //     textSize(40);
        //     text("Reloading", windowWidth/2, clientPlayer.y + 300);
        // }
        //
        //
        //
    }

    kill(){
        this.kills++;
        this.increaseMoney(25);
        this.enemiesRemaining--;
    }

   
    increaseMoney(amount){
        this.money += amount;
    }
    
    
}
