(function(exports){
    var Cell = function(color,grid){
        this.color = color;
        this.grid = grid;
        this.dropped = false;
    };
    Cell.prototype = {
        tick: function(){},
        render: function(ctx,topx,topy,width,height) {
            ctx.save();
            ctx.strokeStyle = "rbga(0,0,0,200)"
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(topx, topy);
            ctx.lineTo(topx + width, topy);
            ctx.lineTo(topx + width, topy + height);
            ctx.lineTo(topx + width, topy + height);
            ctx.lineTo(topx,topy + height);
            ctx.lineTo(topx,topy);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.restore();

        },
        move: function(x,y) {
            if(this.x !== undefined && this.y !== undefined && this.grid.getCell(this.x,this.y) === this) {
                this.grid.setCell(this.x,this.y,undefined);
            }
            this.grid.setCell(this.x = x, this.y = y, this);
        },
        canMove:function(x,y) {
            return this.grid.isEmpty(x,y);
        }
    };

    var Shape = function(type,color,grid,x,y) {
        this.type = type;
        this.color = color;
        this.grid = grid;
        this.x = x;
        this.y = y;
        this.dropped = false;
        if(type === "square") {
            this.layout = [1,0, 0,0, 0,1, 1,1];
        }
        else if(type === 'l') {
            this.layout = [0,2, 0,1, 0,0, 1,0];
        }
        else if(type === 'reverse-l') {
            this.layout = [0,2, 0,1, 0,0, -1,0];
        }
        else if(type === 'long') {
            this.layout = [0,1, 0,0, 0,-1, 0,-2];
        }
        else if(type === 'z') {
            this.layout = [1,0, 0,0, 0,1, -1,1];
        }
        else if(type === 'reverse-z') {
            this.layout = [-1,0, 0,0, 0,1, 1,1];
        }
        else if(type === 't') {
            this.layout = [-1,0, 0,0, 1,0, 0,-1];
        }
        else {
            throw "don't know how to draw shape: " + type;
        }
        this.blocks = [];
        for(var i = 0; i < 4; i++) {
            this.blocks.push(new Cell(color,grid))
        }
        this.applyLayout();
    };
    Shape.prototype = {
        applyLayout: function() {
            var block;
            for(i = 0; i < 4; i++) {
                block = this.blocks[i];
                block.move(this.x + this.layout[2 * i], this.y + this.layout[2 * i + 1]);
            }
        },
        tick: function() {
            var i;
            if(!this.canMove(this.x,this.y - 1)) {
                this.dropped = true;
                for(i = 0; i < 4; i++) {
                    this.blocks[i].dropped = true;
                }
            }
            else {
                this.move(this.x, this.y - 1);
            }
        },
        canMove: function(x,y) {
            var block, i, dx = this.x - x,dy = this.y - y;
            for(i = 0; i < 4; i++) {
                block = this.blocks[i];
                if(!block.canMove(block.x - dx, block.y - dy)) {
                    return false;
                }
            }
            return true;
        },
        move: function(x,y) {
            var block, i, dx = this.x - x,dy = this.y - y;
            this.x = x;
            this.y = y;
            for(i = 0; i < 4; i++) {
                block = this.blocks[i];
                block.move(block.x - dx, block.y - dy);
            }
        },
        spin: function() {
            var newlayout = this.layout.slice(0), oldlayout = this.layout,block, i,bounds=true;
            for(var i = 0; i < this.layout.length; i++) {
                newlayout[2 * i] = -1 * this.layout[2 * i + 1];
                newlayout[2 * i + 1] = this.layout[2 * i]
            }
            this.layout = newlayout;
            this.applyLayout();
            for(i = 0; i < 4; i++) {
                block = this.blocks[i];
                if(block.x < 0 || block.x >= this.grid.width || block.y < 0 || block.y >= this.grid.height) {
                    bounds = false;
                    break;
                }
            }
            if(!bounds) {
                this.layout = oldlayout;
                this.applyLayout();
            }

        }
    };

    var Grid = function(width,height) {
        var x, y;
        this.width = width;
        this.height = height;
        this.cells = [];
        for(y = 0; y < height; y++) {
            this.cells[y] = [];
        }
    };
    Grid.prototype = {
        tick: function(){
            var row = -1,full=false,fullRows=[];
            this.visitCells(function(cell){
                cell && cell.tick();
            });
            this.visitCells(function(cell,x,y) {
                if(y !== row) {
                    if(full) { fullRows.push(row); }
                    row = y;
                    full = true;
                }
                full = full && (cell !== undefined);
            });
            console.log(fullRows);
            for(row = 0; row < fullRows.length; row++) {
                this.cells.splice(fullRows[row], 1);
                this.cells[this.height - 1] = [];
            }

        },
        setCell: function(x,y,cell) {
            if(this.isEmpty(x,y)) {
                this.cells[y][x] = cell;
            }
        },
        isEmpty: function(x,y) {
            return x > -1 && y > 0 && x < this.width && y < this.height && (this.cells[y][x] === undefined || !this.cells[y][x].dropped);
        },
        getCell: function(x,y) {
            return this.cells[y][x];
        },
        visitCells: function(visitor) {
            var x, y,row;
            for(y = 0; y < this.height; y++) {
                row = this.cells[y];
                for(x = 0; x < this.width; x++) {
                    visitor(row[x],x,y);
                }
            }
        }
    };

    var Tetris = function(el, width, height) {
        var _this = this;
        this.canvas = el;
        this.width = width || 10;
        this.height = height || 20;
        this.grid = new Grid(this.width,this.height);
        this.callback = function(){_this.tick.apply(_this);};
        this.intervalMs = 400;
        document.onkeydown = function(e){_this.keyDown.call(_this,e);}
        this.tick();
    };
    Tetris.prototype = {
        tick: function() {
            if(this.shape === undefined) {
                var shape = this.pickShape(), color = this.pickColor(shape);
                this.shape = new Shape(shape, color, this.grid, 4, 27);
            }
            this.shape.tick();
            if(this.shape.dropped) {
                this.shape = undefined;
            }
            this.grid.tick();
            this.renderGrid();
            setTimeout(this.callback, this.intervalMs);

        },
        renderGrid: function() {
            var _this = this,
                gridHeight = this.grid.height,
                cellWidth = this.canvas.width / this.width,
                cellHeight = cellWidth,
                topx,topy,ctx;
            ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.grid.visitCells(function(cell,x,y){
                if(cell !== undefined) {
                    topx =  x / _this.width * _this.canvas.width;
                    topy = (_this.height - y) / _this.height * _this.canvas.height;
                    cell.render(ctx, topx, topy, cellWidth, cellHeight);
                }
            });
        },
        pickShape: function() {
            var ret = ['square','z','t','reverse-z','long','l','reverse-l'][Math.round(Math.abs(Math.random()) * 6)];
            return ret;
        },
        pickColor: function(shape) {
            return {
                'square': 'red',
                'z': 'green',
                't': 'blue',
                'reverse-z': 'cyan',
                'long': 'grey',
                'l': 'pink',
                'reverse-l': 'white'
            }[shape];
        },
        keyDown: function(e) {
            var code = this.getKeyCode(e), shape = this.shape;
            if(!this.shape) {
                return;
            }
            if(code === 37 && shape.canMove(shape.x - 1, shape.y)) {
                shape.move(shape.x - 1, shape.y);
            }
            else if(code === 39 && shape.canMove(shape.x + 1, shape.y)) {
                shape.move(shape.x + 1, shape.y);
            }
            else if(code === 40 && shape.canMove(shape.x, shape.y - 1)) {
                shape.move(shape.x, shape.y - 1);
            }
            else if(code == 32) {
                shape.spin();
            }
            this.renderGrid();

        },
        getKeyCode : function(e) {
            var keycode,newDir;
            if (window.event) keycode = window.event.keyCode;
            else if (e) keycode = e.which;
            return keycode;
        }
    };

    exports.Tetris = {
        Cell: Cell,
        Shape: Shape,
        Grid: Grid,
        Tetris: Tetris
    };

})(window);