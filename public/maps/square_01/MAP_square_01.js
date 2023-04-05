const MAP_square_o1 = {
    coords: [
        //    xpos  ypos l(x) w(y)
        [-1000, 0, 1000, 1000], //left map edge
        [-1000, -1000, 3500, 1000], //top map edge
        [-1000, 1000, 3500, 1000], //bottom map edge
        [1500, 0, 1000, 1000], //right map edge
        // [600, 0, 30, 200], //right spawn room wall
        // [600, 400, 30, 200], //right spawn room wall
        // [0, 600, 630, 30], //bottom spawn room wall
        // [600, 600, 120, 30],//room under spawn connector wall
        // [700, 600, 30, 100],//room under spawn top door wall
        // [700, 900, 30, 100],//room under spawn bottom door wall
    ],
    doors: [
        //             n  x    y    l   w    cost  x/y interaction dist spawns
        //new ClientDoor(1, 600, 200, 30, 200, 1000, 50, 25, [1, 5]),
        //new ClientDoor(2, 700, 700, 30, 200, 1000, 50, 25, [3, 4]),
    ],
    doorCoords: [
        //   n  x    y    l   w
        // [1, 600, 198, 30, 204], //door 1
        // [2, 700, 698, 30, 204]  //door 2
    ],
    enemySpawns: [
        [300, -5, 100, 10], //spawn 0 (top left)
        [1100, -5, 100, 10], //spawn 1 (top right)
        [-5, 300, 10, 100], //spawn 2 (left top)
        [-5, 800, 10, 100], //spawn 3 (left bottom)
        [500, 995, 100, 10], //spawn 4 (bottom left)
        [1300, 995, 100, 10], //spawn 5 (bottom right)
    ],
}