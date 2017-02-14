var startGame = function() {
    // SpriteSheet.draw(Game.ctx,"ship",100,100,0);
    Game.setBoard(0, new Starfield(20, 0.4, 100, true));
    Game.setBoard(1, new Starfield(50, 0.6, 100));
    Game.setBoard(2, new Starfield(100, 1.0, 50));
    Game.setBoard(3, new TitleScreen("Evoque`s Fly", "Press space to start playing", playGame));
};

var playGame = function() {
    // Game.setBoard(3, new TitleScreen("Evoque`s Fly","Game Started..."));
    // Game.setBoard(3, new PlayerShip())
    // ＝> GameBoard： 统一管理资源
    var board = new GameBoard();
    board.add(new Level(level1, winGame));
    board.add(new PlayerShip());
    Game.setBoard(3, board);
};

var winGame = function() {
    Game.setBoard(3, new TitleScreen("Aha , Win", "Press fire to start again", playGame));
};
var loseGame = function() {
    Game.setBoard(3, new TitleScreen("You lose!", "Press fire to start again", playGame));
};

window.addEventListener("load", function() {
    Game.initialize("game", sprites, startGame);

});


var Starfield = function(speed, opacity, numStars, isClear) {

    var starCanvas = document.createElement("canvas");
    starCanvas.width = Game.width;
    starCanvas.height = Game.height;

    var starCtx = starCanvas.getContext('2d');
    var offSet = 0;

    if (isClear) {
        starCtx.fillStyle = "black";
        starCtx.fillRect(0, 0, starCanvas.width, starCanvas.height);
    }

    starCtx.fillStyle = "#FFF";
    starCtx.globalAlpha = opacity;
    for (var i = 0; i < numStars; i++) {
        starCtx.fillRect(Math.floor(Math.random() * starCanvas.width),
            Math.floor(Math.random() * starCanvas.height),
            2, 2);
    }

    //把星雨画到主canvas上
    this.draw = function(ctx) {
        var intOffSet = Math.floor(offSet);
        var remaining = starCanvas.height - intOffSet;

        if (intOffSet > 0) {
            ctx.drawImage(starCanvas, 0, remaining, starCanvas.width, intOffSet,
                0, 0, starCanvas.width, intOffSet);
        }

        if (remaining > 0) {
            ctx.drawImage(starCanvas, 0, 0, starCanvas.width, remaining,
                0, intOffSet, starCanvas.width, remaining);
        }
    };

    this.step = function(dt) {
        offSet += dt * speed;
        offSet = offSet % starCanvas.height;
    };

};



var GameBoard = function() {

    var board = this;
    this.objects = [];
    // this.cnt = [];

    // 
    this.add = function(obj) {
        //对于一个要与其他对象进行交互的对象来说，它需要访问其所属的面板，
        //为此，在GameBoard.add被调用时，面板为对象设置了名为board的属性
        obj.board = this;
        this.objects.push(obj);
        //不同类型的活动对象的数目, 下面的布尔或｜｜ 运算符，在需要时把计数初始化为0
        // this.cnt[obj.type] = (this.cnt[obj.type] || 0) + 1;
        return obj;
    };

    
    this.remove = function(obj) {
        this.removed.push(obj);
    };

    //Reset 一下
    this.resetRemoved = function() {
        this.removed = [];
    };


    this.finalizeRemoved = function() {
        for (var i = 0; i < this.removed.length; i++) {
            var idx = this.objects.indexOf(this.removed[i]);
            if (idx != -1) {
                // this.cnt[this.removed[i].type]--;
                this.objects.splice(idx, 1);
            }
        }
    };

    //Call the same method on all current objects
    this.iterate = function(funcName) {
        var args = Array.prototype.slice.call(arguments, 1);
        for (var i = 0; i < this.objects.length; i++) {
            var obj = this.objects[i];
            obj[funcName].apply(obj, args);
        }
    };

    // 碰撞
    this.collide = function(obj, type) {
        return this.detect(function() {
            if (obj != this) {
                // 通过执行按位与(AND)运算，在不必因查找数组或哈希表而降低速度
                var col = (!type || this.type & type) &&
                    board.overlap(obj, this);
                return col ? this : false;
            }
        });
    };

    // Find the first object for which func is true
    this.detect = function(func) {
        for (var i = 0; i < this.objects.length; i++) {
            if (func.call(this.objects[i])) {
                return this.objects[i];
            }
        }
        return false;
    };

    // 碰撞监测
    this.overlap = function(o1, o2) {
        return !((o1.y + o1.h - 1 < o2.y) ||
            (o1.y > o2.y + o2.h - 1) ||
            (o1.x + o1.w - 1 < o2.x) ||
            (o1.x > o2.x + o2.w - 1));
    };


    this.step = function(dt) {
        this.resetRemoved();
        // 这里，会便利所有精灵的step方法， 而在其中，精灵会判断自己是否应该被删除，如果是
        // 调用board的remove 方法。
        this.iterate('step', dt);
        this.finalizeRemoved();
    };

    this.draw = function(ctx) {
        this.iterate('draw', ctx);
    };
};



/**************************************************
 重构，继承Sprite.
 ps: 从精灵集合中取出玩家的角色,操作player，并调用精灵公共的draw方法，把ship画到主canvas上
**************************************************/
var PlayerShip = function() {

    this.setup('ship', {
        vx: 0,
        reloadTime: 0.25,
        maxVel: 200
    });

    this.reload = this.reloadTime;
    this.x = Game.width / 2 - this.w / 2;
    this.y = Game.height - Game.playerOffset - this.h;

    this.step = function(dt) {
        if (Game.keys['left']) {
            this.vx = -this.maxVel;
        } else if (Game.keys['right']) {
            this.vx = this.maxVel;
        } else {
            this.vx = 0;
        }

        this.x += this.vx * dt;
        this.x = this.x < 0 ? 0 : this.x;
        if (this.x > Game.width - this.w) {
            this.x = Game.width - this.w;
        }

        this.reload -= dt;
        if (Game.keys['fire'] && this.reload < 0) {
            this.reload = this.reloadTime;
            this.board.add(new PlayerMissile(this.x, this.y + this.h / 2));
            this.board.add(new PlayerMissile(this.x + this.w, this.y + this.h / 2));
        }
    };


}

PlayerShip.prototype = new Sprite();
PlayerShip.prototype.type = OBJECT_PLAYER;

PlayerShip.prototype.hit = function() {
    if (this.board.remove(self)) {
        loseGame();
    }
}



/***************************************************
重构之后的PlayerMissile.
***************************************************/
var PlayerMissile = function(x, y) {

    this.setup('missile', {
        vy: -700,
        damage: 10
    });

    // Center the missile on x
    this.x = x - this.w / 2;
    //Use the passed in y as the bottom of the missile
    this.y = y - this.h;
};

PlayerMissile.prototype = new Sprite();
PlayerMissile.prototype.type = OBJECT_PLAYER_PROJECTILE;

PlayerMissile.prototype.step = function(dt) {
    this.y += this.vy * dt;

    var collision = this.board.collide(this, OBJECT_ENEMY);
    if (collision) {
        collision.hit(this.damage);
        this.board.remove(this);
    } else if (this.y < -this.h) {
        this.board.remove(this);
    }

};




/***************************************************
 Enemy  日军
***************************************************/
var Enemy = function(blueprint, override) {

    this.merge(this.baseParameters);
    this.setup(blueprint.sprite, blueprint);
    this.merge(override);

};
Enemy.prototype = new Sprite();
Enemy.prototype.type = OBJECT_ENEMY;

Enemy.prototype.baseParameters = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    F: 0,
    G: 0,
    H: 0,
    t: 0
};

Enemy.prototype.step = function(dt) {
    this.t += dt;
    this.vx = this.A + this.B * Math.sin(this.C * this.t + this.D);
    this.vy = this.E + this.F * Math.sin(this.G * this.t + this.H);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.y > Game.height ||
        this.x < -this.w ||
        this.x > Game.width) {
        this.board.remove(this);
    }
};


Enemy.prototype.hit = function(damage) {
    this.health -= damage;
    if (this.health <= 0) {
        if (this.board.remove(this)) {
            this.board.add(new Explosion(this.x + this.w / 2,
                this.y + this.h / 2));
        }
    }
};


/***************************************************
 Explosion
***************************************************/
var Explosion = function(centerX, centerY) {
    this.setup('explosion', {
        frame: 0
    });
    this.x = centerX - this.w / 2;
    this.y = centerY - this.h / 2;
    this.subFrame = 0;
};

Explosion.prototype = new Sprite();

Explosion.prototype.step = function(dt) {
        this.frame = Math.floor(this.subFrame++/ 3);
            if (this.subFrame >= 36) {
                this.board.remove(this);
            }
        };
