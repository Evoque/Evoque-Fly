var OBJECT_PLAYER = 1,
    OBJECT_PLAYER_PROJECTILE = 2,
    OBJECT_ENEMY = 4,
    OBJECT_ENEMY_PROJECTILE = 8,
    OBJECT_POWERUP = 16;


var level1 = [
    // Start,   End, Gap,  Type,   Override
    [0, 4000, 500, 'step'],
    [6000, 13000, 800, 'ltr'],
    [10000, 16000, 400, 'circle'],
    [17800, 20000, 500, 'straight', { x: 50 }],
    [18200, 20000, 500, 'straight', { x: 90 }],
    [18200, 20000, 500, 'straight', { x: 10 }],
    [22000, 25000, 400, 'wiggle',   { x: 150 }],
    [22000, 25000, 400, 'wiggle',   { x: 100 }]
];




//使用Game类重构
var sprites = {
    ship: {
        sx: 0,
        sy: 0,
        w: 37,
        h: 42,
        frames: 0
    },
    missile: {
        sx: 0,
        sy: 30,
        w: 2,
        h: 10,
        frames: 1
    },
    enemy_purple: {
        sx: 37,
        sy: 0,
        w: 42,
        h: 43,
        frames: 1
    },
    enemy_bee: {
        sx: 79,
        sy: 0,
        w: 37,
        h: 43,
        frames: 1
    },
    enemy_ship: {
        sx: 116,
        sy: 0,
        w: 42,
        h: 43,
        frames: 1
    },
    enemy_circle: {
        sx: 158,
        sy: 0,
        w: 32,
        h: 33,
        frames: 1
    },
    explosion: {
        sx: 0,
        sy: 64,
        w: 64,
        h: 64,
        frames: 12
    }
};

var enemies = {
    straight: {
        x: 0,
        y: -50,
        sprite: 'enemy_ship',
        health: 20,
        E: 100
    },
    ltr: {
        x: 0,
        y: -100,
        sprite: 'enemy_purple',
        health: 10,
        B: 200,
        C: 1,
        E: 200
    },
    circle: {
        x: 400,
        y: -50,
        sprite: 'enemy_circle',
        health: 10,
        A: 0,
        B: -200,
        C: 1,
        E: 20,
        F: 200,
        G: 1,
        H: Math.PI / 2
    },
    wiggle: {
        x: 100,
        y: -50,
        sprite: 'enemy_bee',
        health: 20,
        B: 100,
        C: 4,
        E: 100
    },
    step: {
        x: 0,
        y: -50,
        sprite: 'enemy_circle',
        health: 10,
        B: 300,
        C: 1.5,
        E: 60
    }
};
