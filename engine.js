/******************************************
目前的页面切换机制：
			传入回调函数， 在相关对象的step中做判断，是否执行回调函数，
			回调函数的主要作用就是根据index替换特性的board，达到页面切换的效果
******************************************/

 
var Game = new function() {

    // Game Initialization
    this.initialize = function(canvasElementId, sprite_data, callback) {
        this.canvas = document.getElementById(canvasElementId);
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        //Set up the rendering context
        this.ctx = this.canvas.getContext && this.canvas.getContext('2d');

        if (!this.ctx) {
            return alert("Please upgrade your browser to play");
        }
 
        this.setupInput();
        this.setBoard(4, new TouchControls()); 
        this.loop();
 
        SpriteSheet.load(sprite_data, callback);
    };

    // Handle Input
    var KEY_CODES = {
        37: 'left',
        39: 'right',
        32: 'fire'
    };
    this.keys = {};
    this.setupInput = function() {
        window.addEventListener('keydown', function(e) {
            if (KEY_CODES[e.keyCode]) {
                Game.keys[KEY_CODES[e.keyCode]] = true;
                // Default那么一下
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', function(e) {
            if (KEY_CODES[e.keyCode]) {
                Game.keys[KEY_CODES[e.keyCode]] = false;
                e.preventDefault();
            }
        });
    };

    var count = 0;
    var boards = []; //存放已更新并已经绘制到画布上的游戏的各块内容
    this.loop = function() {
        var dt = 30 / 1000;
        for (var i = 0; i < boards.length; i++) {
            if (boards[i]) {
                //这里要确认每个存储在board中的对象都要声明step和draw方法,其实最好通过接口的方式进行约束
                boards[i].step(dt);
                boards[i].draw(Game.ctx);
                count++;
            }
        }
        
        // setInterval 会出现莫名bug？ 难道是用完没清理？
        setTimeout(Game.loop, 30);
    };

    //Change an active game board
    this.setBoard = function(index, board) {
        boards[index] = board;
    };
};



/*\
|*|
|*|因为只能有一个SpriteSheet对象: 该语句把构造函数和new操作符放在同一行中，确保该类永远只会有一个实例被创建
|*|
\*/
var SpriteSheet = new function() {
    this.map = {};
    // spriteData: 把链接了精灵矩形和名称的精灵数据传递进来
    // callback: 把图像onload的回调函数传递进来
    this.load = function(spriteData, callback) {
        this.map = spriteData;
        this.image = new Image();
        this.image.onload = callback;
        this.image.src = 'images/sprites.png';
    };
    // 把精灵绘制到上下文, sprite:spriteData映射表中的精灵名称的字符串、frame:具有多帧的精灵提供的一个可选的帧
    this.draw = function(ctx, sprite, x, y, frame) {
        var s = this.map[sprite];
        if (!frame) frame = 0;
        ctx.drawImage(this.image,
            s.sx + frame * s.w, s.sy, s.w, s.h,
            Math.floor(x), Math.floor(y), s.w, s.h);
    };
};



//标题...
var TitleScreen = function(title, subtitle, callback) {
    // var up = false;

    this.step = function(dt) {
        if (Game.keys['fire'] && callback) {
            callback();
        }
    };

    this.draw = function(ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";

        ctx.font = "bold 40px bangers";
        ctx.fillText(title, Game.width / 2, Game.height / 2);

        ctx.font = "bold 20px bangers";
        ctx.fillText(subtitle, Game.width / 2, Game.height / 2 + 40);
    };
};


/*
   构造函数的主要职责是深度复制关卡数据，因为方法会修改关卡数据，而对象的引用传递，所以修改会影响
 初始化的关卡数据。
   JS没有内置的用于深度复制数组内部对象列表的机制，简单通过Object.create方法创建一个新对象

 ==> Level 假扮精灵，通过响应step和draw来让自己像精灵一样行事
*/
var Level = function(levelData, callback) {
    this.levelData = [];
    for (var i = 0; i < levelData.length; i++) {
        // Object.create实现深度复制
        this.levelData.push(Object.create(levelData[i]));
    }
    this.t = 0;
    this.callback = callback;
}

Level.prototype.step = function(dt) {

    var idx = 0,
        removeArray = [],
        curShip = null;

    //update current time;
    this.t += dt * 1000;

    // Start, End,  Gap, Type,   Override
    //[ 0,    4000, 500, 'step', {x:100}]
    while ((curShip = this.levelData[idx]) &&
        (curShip[0] < this.t + 2000)) // 开始时间小于 this.t + 2000 ??
    {
        // 如果大于结束时间
        if (this.t > curShip[1]) {
            removeArray.push(curShip);
        } else if (curShip[0] < this.t) {
            // Get the enemy definition blueprint
            var enemy = enemies[curShip[3]];
            var override = curShip[4];

            this.board.add(new Enemy(enemy, override));
            //Increment the start time by the Gap
            curShip[0] += curShip[2]; // 
        }
        idx++;
    }

    // Remove the passed
    removeArray.forEach(function(element, index) {
        var i = this.levelData.indexOf(element);
        if (i != -1) {
            this.levelData.splice(i, 1);
        }
    });

    // if no more enemies on board and in levelData, this level is done
    if (this.levelData.length == 0 &&
        this.board.cnt[OBJECT_ENEMY] == 0) {

        if (this.callback) {
            this.callback();
        }
    }

}

// Dummy method, doesn`t draw anything
Level.prototype.draw = function(ctx) {};



/****************************************************
 所有精灵的基类。
 ＝> 可根据一组设置参数及一个要用到的精灵来处理初始化
*****************************************************/

//构造函数为空因为每个精灵都有自己的构造函数，
var Sprite = function() {};

Sprite.prototype.setup = function(sprite, props) {
    this.sprite = sprite;
    this.merge(props);
    this.frame = this.frame || 0;
    this.w = SpriteSheet.map[sprite].w;
    this.h = SpriteSheet.map[sprite].h;
};

Sprite.prototype.merge = function(props) {
    if (props) {
        for (var p in props) {
            this[p] = props[p];
        }
    }
};


Sprite.prototype.draw = function(ctx) {
    SpriteSheet.draw(ctx, this.sprite, this.x, this.y, this.frame);
};

Sprite.prototype.hit = function(damage) {
    this.board.remove(this);
};


var TouchControls = function() {
    var gutterWidth = 10;
    var unitWidth = Game.width / 5;
    var blockWidth = unitWidth - gutterWidth;

    this.drawSquare = function(ctx, x, y, txt, on) {
        ctx.globalAlpha = on ? 0.9 : 0.6;
        ctx.fillStyle = "#CCC";
        ctx.fillRect(x, y, blockWidth, blockWidth);

        ctx.fillStyle = "#FFF";
        ctx.textAlign = "center";
        ctx.globalAlpha = 1.0;
        ctx.font = "bold " + (3 * unitWidth / 4) + "px arial";
        ctx.fillText(txt, x + blockWidth / 2, y + 3 * blockWidth / 4 + 5);
    };

    this.draw = function(ctx) {
        // 画布上下文的save和restore方法，以防不透明度和字体的改变对其他任何画布调用造成影响
        ctx.save();
        var yLoc = Game.height - unitWidth;
        this.drawSquare(ctx, gutterWidth, yLoc, "\u25C0", Game.keys['left']);
        this.drawSquare(ctx, unitWidth + gutterWidth, yLoc, "\u25B6", Game.keys['right']);
        this.drawSquare(ctx, 4 * unitWidth, yLoc, "A", Game.keys['fire']);
        ctx.restore();
    };
    this.step = function(dt) {};

    /**
     * touchstart touchmove touchend ==> event.touches & event.targetTouches & event.changedTouches
     */
    this.trackTouch = function(e) {
        var x;
        e.preventDefault();
        Game.keys["left"] = false;
        Game.keys["right"] = false;
        e.targetTouches.forEach(function(touch, idx) {
            x = touch.pageX / Game.canvasMultiplier - Game.offsetLeft;
            if (x < unitWidth) {
                Game.keys['left'] = true;
            }
            if (x > unitWidth && x < 2 * unitWidth) {
                Game.keys['right'] = true;
            }
        });

        //只检查了changedTouches, 为了强调玩家反复按下发射按钮，接连不断的发射导弹
        if (e.type == 'touchstart' || e.type == 'touchend') {
            e.changedTouches.forEach(function(touch, idx) {
                 x = touch.pageX / Game.canvasMultiplier - Game.canvas.offsetLeft;
                if (x > 4 * unitWidth) {
                    Game.keys['fire'] = (e.type == 'touchstart');
                }
            });
        }
    };

    Game.canvas.addEventListener('touchstart', this.trackTouch, true);
    Game.canvas.addEventListener('touchmove', this.trackTouch, true);
    Game.canvas.addEventListener('touchend', this.trackTouch, true);
    //玩家飞船向屏幕上方移动
    Game.playerOffset = unitWidth + 20;

};




 
var Evoque = function() {}
