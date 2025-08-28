// ------------------------------------------------------------------------
// Bubble Shooter Game Tutorial With HTML5 And JavaScript
// Copyright (c) 2015 Rembound.com
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see http://www.gnu.org/licenses/.
//
// http://rembound.com/articles/bubble-shooter-game-tutorial-with-html5-and-javascript
// ------------------------------------------------------------------------

const Constants = {
    // Level dimensions
    COLUMNS: 15,
    ROWS: 14,
    TILE_WIDTH: 40,
    TILE_HEIGHT: 40,
    ROW_HEIGHT: 34,
    LEVEL_X: 4,
    LEVEL_Y: 83,

    // Bubble properties
    BUBBLE_RADIUS: 20,
    BUBBLE_COLORS: 7,

    // Player properties
    PLAYER_SPEED: 1000,
    PLAYER_DROPSPEED: 900,

    // Game states
    GAME_STATES: {
        INIT: 0,
        READY: 1,
        SHOOT_BUBBLE: 2,
        REMOVE_CLUSTER: 3,
        GAME_OVER: 4
    },

    // Neighbor offsets
    NEIGHBOR_OFFSETS: [
        [[1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]], // Even row
        [[1, 0], [1, 1], [0, 1], [-1, 0], [0, -1], [1, -1]]  // Odd row
    ]
};

class Tile {
    constructor(x, y, type, shift = 0) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.removed = false;
        this.shift = shift;
        this.velocity = 0;
        this.alpha = 1;
        this.processed = false;
    }
}

class Bubble {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.speed = Constants.PLAYER_SPEED;
        this.dropspeed = Constants.PLAYER_DROPSPEED;
        this.tiletype = 0;
        this.visible = false;
    }
}

class Player {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.tiletype = 0;
        this.bubble = new Bubble();
        this.nextbubble = {
            x: 0,
            y: 0,
            tiletype: 0
        };
    }
}

class Level {
    constructor(rowoffset) {
        this.x = Constants.LEVEL_X;
        this.y = Constants.LEVEL_Y;
        this.columns = Constants.COLUMNS;
        this.rows = Constants.ROWS;
        this.tilewidth = Constants.TILE_WIDTH;
        this.tileheight = Constants.TILE_HEIGHT;
        this.rowheight = Constants.ROW_HEIGHT;
        this.radius = Constants.BUBBLE_RADIUS;
        this.tiles = [];
        this.rowoffset = rowoffset;

        this.width = this.columns * this.tilewidth + this.tilewidth / 2;
        this.height = (this.rows - 1) * this.rowheight + this.tileheight;

        // Initialize the tile grid
        for (let i = 0; i < this.columns; i++) {
            this.tiles[i] = [];
            for (let j = 0; j < this.rows; j++) {
                this.tiles[i][j] = new Tile(i, j, 0);
            }
        }
    }

    // Create a random level
    create() {
        // Create a level with random tiles
        for (let j = 0; j < this.rows; j++) {
            let randomtile = this.randRange(0, Constants.BUBBLE_COLORS - 1);
            let count = 0;
            for (let i = 0; i < this.columns; i++) {
                if (count >= 2) {
                    let newtile = this.randRange(0, Constants.BUBBLE_COLORS - 1);
                    if (newtile === randomtile) {
                        newtile = (newtile + 1) % Constants.BUBBLE_COLORS;
                    }
                    randomtile = newtile;
                    count = 0;
                }
                count++;

                if (j < this.rows / 2) {
                    this.tiles[i][j].type = randomtile;
                } else {
                    this.tiles[i][j].type = -1;
                }
            }
        }
    }

    // Get a random int between low and high, inclusive
    randRange(low, high) {
        return Math.floor(low + Math.random() * (high - low + 1));
    }

    getTileCoordinate(column, row) {
        let tilex = this.x + column * this.tilewidth;

        if ((row + this.rowoffset) % 2) {
            tilex += this.tilewidth / 2;
        }

        let tiley = this.y + row * this.rowheight;
        return { tilex: tilex, tiley: tiley };
    }

    getGridPosition(x, y) {
        let gridy = Math.floor((y - this.y) / this.rowheight);

        let xoffset = 0;
        if ((gridy + this.rowoffset) % 2) {
            xoffset = this.tilewidth / 2;
        }
        let gridx = Math.floor(((x - xoffset) - this.x) / this.tilewidth);

        return { x: gridx, y: gridy };
    }

    getNeighbors(tile) {
        const tilerow = (tile.y + this.rowoffset) % 2;
        const neighbors = [];
        const n = Constants.NEIGHBOR_OFFSETS[tilerow];

        for (let i = 0; i < n.length; i++) {
            const nx = tile.x + n[i][0];
            const ny = tile.y + n[i][1];

            if (nx >= 0 && nx < this.columns && ny >= 0 && ny < this.rows) {
                neighbors.push(this.tiles[nx][ny]);
            }
        }
        return neighbors;
    }

    addBubbles() {
        for (let i = 0; i < this.columns; i++) {
            for (let j = 0; j < this.rows - 1; j++) {
                this.tiles[i][this.rows - 1 - j].type = this.tiles[i][this.rows - 1 - j - 1].type;
            }
        }

        for (let i = 0; i < this.columns; i++) {
            this.tiles[i][0].type = this.getExistingColor();
        }
    }

    findColors() {
        const foundcolors = [];
        const colortable = [];
        for (let i = 0; i < Constants.BUBBLE_COLORS; i++) {
            colortable.push(false);
        }

        for (let i = 0; i < this.columns; i++) {
            for (let j = 0; j < this.rows; j++) {
                const tile = this.tiles[i][j];
                if (tile.type >= 0) {
                    if (!colortable[tile.type]) {
                        colortable[tile.type] = true;
                        foundcolors.push(tile.type);
                    }
                }
            }
        }
        return foundcolors;
    }

    getExistingColor() {
        const existingcolors = this.findColors();
        let bubbletype = 0;
        if (existingcolors.length > 0) {
            bubbletype = existingcolors[this.randRange(0, existingcolors.length - 1)];
        }
        return bubbletype;
    }
}

class UI {
    constructor(context, canvas) {
        this.context = context;
        this.canvas = canvas;
    }

    drawCenterText(text, x, y, width) {
        const textdim = this.context.measureText(text);
        this.context.fillText(text, x + (width - textdim.width) / 2, y);
    }

    drawFrame(fps) {
        this.context.fillStyle = "#e8eaec";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.context.fillStyle = "#303030";
        this.context.fillRect(0, 0, this.canvas.width, 79);

        this.context.fillStyle = "#ffffff";
        this.context.font = "24px Verdana";
        this.context.fillText("Bubble Shooter Example - Rembound.com", 10, 37);

        this.context.fillStyle = "#ffffff";
        this.context.font = "12px Verdana";
        this.context.fillText("Fps: " + fps, 13, 57);
    }

    render(gamestate, level, player, score, cluster, floatingclusters, showcluster, bubbleimage) {
        const yoffset = level.tileheight / 2;

        this.context.fillStyle = "#8c8c8c";
        this.context.fillRect(level.x - 4, level.y - 4, level.width + 8, level.height + 4 - yoffset);

        this.renderTiles(level, bubbleimage);

        this.context.fillStyle = "#656565";
        this.context.fillRect(level.x - 4, level.y - 4 + level.height + 4 - yoffset, level.width + 8, 2 * level.tileheight + 3);

        this.context.fillStyle = "#ffffff";
        this.context.font = "18px Verdana";
        const scorex = level.x + level.width - 150;
        const scorey = level.y + level.height + level.tileheight - yoffset - 8;
        this.drawCenterText("Score:", scorex, scorey, 150);
        this.context.font = "24px Verdana";
        this.drawCenterText(score, scorex, scorey + 30, 150);

        if (showcluster) {
            this.renderCluster(level, cluster, 255, 128, 128);

            for (let i = 0; i < floatingclusters.length; i++) {
                const col = Math.floor(100 + 100 * i / floatingclusters.length);
                this.renderCluster(level, floatingclusters[i], col, col, col);
            }
        }

        this.renderPlayer(level, player, bubbleimage);

        if (gamestate == Constants.GAME_STATES.GAME_OVER) {
            this.context.fillStyle = "rgba(0, 0, 0, 0.8)";
            this.context.fillRect(level.x - 4, level.y - 4, level.width + 8, level.height + 2 * level.tileheight + 8 - yoffset);

            this.context.fillStyle = "#ffffff";
            this.context.font = "24px Verdana";
            this.drawCenterText("Game Over!", level.x, level.y + level.height / 2 + 10, level.width);
            this.drawCenterText("Click to start", level.x, level.y + level.height / 2 + 40, level.width);
        }
    }

    renderTiles(level, bubbleimage) {
        for (let j = 0; j < level.rows; j++) {
            for (let i = 0; i < level.columns; i++) {
                const tile = level.tiles[i][j];
                const shift = tile.shift;
                const coord = level.getTileCoordinate(i, j);

                if (tile.type >= 0) {
                    this.context.save();
                    this.context.globalAlpha = tile.alpha;
                    this.drawBubble(bubbleimage, coord.tilex, coord.tiley + shift, tile.type, level.tilewidth, level.tileheight);
                    this.context.restore();
                }
            }
        }
    }

    renderCluster(level, cluster, r, g, b) {
        for (let i = 0; i < cluster.length; i++) {
            const coord = level.getTileCoordinate(cluster[i].x, cluster[i].y);
            this.context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
            this.context.fillRect(coord.tilex + level.tilewidth / 4, coord.tiley + level.tileheight / 4, level.tilewidth / 2, level.tileheight / 2);
        }
    }

    renderPlayer(level, player, bubbleimage) {
        const centerx = player.x + level.tilewidth / 2;
        const centery = player.y + level.tileheight / 2;

        this.context.fillStyle = "#7a7a7a";
        this.context.beginPath();
        this.context.arc(centerx, centery, level.radius + 12, 0, 2 * Math.PI, false);
        this.context.fill();
        this.context.lineWidth = 2;
        this.context.strokeStyle = "#8c8c8c";
        this.context.stroke();

        this.context.lineWidth = 2;
        this.context.strokeStyle = "#0000ff";
        this.context.beginPath();
        this.context.moveTo(centerx, centery);
        this.context.lineTo(centerx + 1.5 * level.tilewidth * Math.cos(player.angle * Math.PI / 180), centery - 1.5 * level.tileheight * Math.sin(player.angle * Math.PI / 180));
        this.context.stroke();

        this.drawBubble(bubbleimage, player.nextbubble.x, player.nextbubble.y, player.nextbubble.tiletype, level.tilewidth, level.tileheight);

        if (player.bubble.visible) {
            this.drawBubble(bubbleimage, player.bubble.x, player.bubble.y, player.bubble.tiletype, level.tilewidth, level.tileheight);
        }
    }

    drawBubble(bubbleimage, x, y, index, width, height) {
        if (index < 0 || index >= Constants.BUBBLE_COLORS) return;
        this.context.drawImage(bubbleimage, index * 40, 0, 40, 40, x, y, width, height);
    }
}

class BubbleShooter {
    constructor() {
        this.canvas = document.getElementById("viewport");
        this.context = this.canvas.getContext("2d");
        this.ui = new UI(this.context, this.canvas);
        this.lastframe = 0;
        this.fpstime = 0;
        this.framecount = 0;
        this.fps = 0;
        this.initialized = false;
        this.player = new Player();
        this.gamestates = Constants.GAME_STATES;
        this.gamestate = this.gamestates.INIT;
        this.score = 0;
        this.turncounter = 0;
        this.rowoffset = 0;
        this.level = new Level(this.rowoffset);
        this.animationstate = 0;
        this.animationtime = 0;
        this.cluster = [];
        this.floatingclusters = [];
        this.images = [];
        this.bubbleimage = null;
        this.loadcount = 0;
        this.loadtotal = 0;
        this.preloaded = false;
        this.init();
    }

    init() {
        this.images = this.loadImages(["bubble-sprites.png"]);
        this.bubbleimage = this.images[0];
        this.canvas.addEventListener("mousemove", (e) => this.onMouseMove(e));
        this.canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
        this.player.x = this.level.x + this.level.width / 2 - this.level.tilewidth / 2;
        this.player.y = this.level.y + this.level.height;
        this.player.angle = 90;
        this.player.tiletype = 0;
        this.player.nextbubble.x = this.player.x - 2 * this.level.tilewidth;
        this.player.nextbubble.y = this.player.y;
        this.newGame();
        this.main(0);
    }

    loadImages(imagefiles) {
        this.loadcount = 0;
        this.loadtotal = imagefiles.length;
        this.preloaded = false;
        const loadedimages = [];
        for (let i = 0; i < imagefiles.length; i++) {
            const image = new Image();
            image.onload = () => {
                this.loadcount++;
                if (this.loadcount === this.loadtotal) {
                    this.preloaded = true;
                }
            };
            image.src = imagefiles[i];
            loadedimages[i] = image;
        }
        return loadedimages;
    }

    main(tframe) {
        window.requestAnimationFrame((t) => this.main(t));
        if (!this.initialized) {
            this.ui.drawFrame(this.fps);
            const loadpercentage = this.loadcount / this.loadtotal;
            this.context.strokeStyle = "#ff8080";
            this.context.lineWidth = 3;
            this.context.strokeRect(18.5, 0.5 + this.canvas.height - 51, this.canvas.width - 37, 32);
            this.context.fillStyle = "#ff8080";
            this.context.fillRect(18.5, 0.5 + this.canvas.height - 51, loadpercentage * (this.canvas.width - 37), 32);
            const loadtext = "Loaded " + this.loadcount + "/" + this.loadtotal + " images";
            this.context.fillStyle = "#000000";
            this.context.font = "16px Verdana";
            this.context.fillText(loadtext, 18, 0.5 + this.canvas.height - 63);
            if (this.preloaded) {
                setTimeout(() => {
                    this.initialized = true;
                }, 1000);
            }
        } else {
            this.update(tframe);
            this.render();
        }
    }

    update(tframe) {
        const dt = (tframe - this.lastframe) / 1000;
        this.lastframe = tframe;
        this.updateFps(dt);
        if (this.gamestate === this.gamestates.SHOOT_BUBBLE) {
            this.stateShootBubble(dt);
        } else if (this.gamestate === this.gamestates.REMOVE_CLUSTER) {
            this.stateRemoveCluster(dt);
        }
    }

    setGameState(newgamestate) {
        this.gamestate = newgamestate;
        this.animationstate = 0;
        this.animationtime = 0;
    }

    stateShootBubble(dt) {
        this.player.bubble.x += dt * this.player.bubble.speed * Math.cos(this.degToRad(this.player.bubble.angle));
        this.player.bubble.y += dt * this.player.bubble.speed * -1 * Math.sin(this.degToRad(this.player.bubble.angle));
        if (this.player.bubble.x <= this.level.x) {
            this.player.bubble.angle = 180 - this.player.bubble.angle;
            this.player.bubble.x = this.level.x;
        } else if (this.player.bubble.x + this.level.tilewidth >= this.level.x + this.level.width) {
            this.player.bubble.angle = 180 - this.player.bubble.angle;
            this.player.bubble.x = this.level.x + this.level.width - this.level.tilewidth;
        }
        if (this.player.bubble.y <= this.level.y) {
            this.player.bubble.y = this.level.y;
            this.snapBubble();
            return;
        }
        for (let i = 0; i < this.level.columns; i++) {
            for (let j = 0; j < this.level.rows; j++) {
                const tile = this.level.tiles[i][j];
                if (tile.type < 0) continue;
                const coord = this.level.getTileCoordinate(i, j);
                if (this.circleIntersection(this.player.bubble.x + this.level.tilewidth / 2, this.player.bubble.y + this.level.tileheight / 2, this.level.radius, coord.tilex + this.level.tilewidth / 2, coord.tiley + this.level.tileheight / 2, this.level.radius)) {
                    this.snapBubble();
                    return;
                }
            }
        }
    }

    stateRemoveCluster(dt) {
        if (this.animationstate === 0) {
            this.resetRemoved();
            this.cluster.forEach(tile => tile.removed = true);
            this.score += this.cluster.length * 100;
            this.floatingclusters = this.findFloatingClusters();
            if (this.floatingclusters.length > 0) {
                this.floatingclusters.forEach(cluster => {
                    cluster.forEach(tile => {
                        tile.shift = 1;
                        tile.velocity = this.player.bubble.dropspeed;
                        this.score += 100;
                    });
                });
            }
            this.animationstate = 1;
        }
        if (this.animationstate === 1) {
            let tilesleft = false;
            this.cluster.forEach(tile => {
                if (tile.type >= 0) {
                    tilesleft = true;
                    tile.alpha -= dt * 15;
                    if (tile.alpha < 0) tile.alpha = 0;
                    if (tile.alpha === 0) {
                        tile.type = -1;
                        tile.alpha = 1;
                    }
                }
            });
            this.floatingclusters.forEach(cluster => {
                cluster.forEach(tile => {
                    if (tile.type >= 0) {
                        tilesleft = true;
                        tile.velocity += dt * 700;
                        tile.shift += dt * tile.velocity;
                        tile.alpha -= dt * 8;
                        if (tile.alpha < 0) tile.alpha = 0;
                        if (tile.alpha === 0 || (tile.y * this.level.rowheight + tile.shift > (this.level.rows - 1) * this.level.rowheight + this.level.tileheight)) {
                            tile.type = -1;
                            tile.shift = 0;
                            tile.alpha = 1;
                        }
                    }
                });
            });
            if (!tilesleft) {
                this.nextBubble();
                const tilefound = this.level.tiles.some(col => col.some(tile => tile.type !== -1));
                this.setGameState(tilefound ? this.gamestates.READY : this.gamestates.GAME_OVER);
            }
        }
    }

    snapBubble() {
        const centerx = this.player.bubble.x + this.level.tilewidth / 2;
        const centery = this.player.bubble.y + this.level.tileheight / 2;
        let gridpos = this.level.getGridPosition(centerx, centery);
        if (gridpos.x < 0) gridpos.x = 0;
        if (gridpos.x >= this.level.columns) gridpos.x = this.level.columns - 1;
        if (gridpos.y < 0) gridpos.y = 0;
        if (gridpos.y >= this.level.rows) gridpos.y = this.level.rows - 1;
        let addtile = false;
        if (this.level.tiles[gridpos.x][gridpos.y].type !== -1) {
            for (let newrow = gridpos.y + 1; newrow < this.level.rows; newrow++) {
                if (this.level.tiles[gridpos.x][newrow].type === -1) {
                    gridpos.y = newrow;
                    addtile = true;
                    break;
                }
            }
        } else {
            addtile = true;
        }
        if (addtile) {
            this.player.bubble.visible = false;
            this.level.tiles[gridpos.x][gridpos.y].type = this.player.bubble.tiletype;
            if (this.checkGameOver()) return;
            this.cluster = this.findCluster(gridpos.x, gridpos.y, true, true, false);
            if (this.cluster.length >= 3) {
                this.setGameState(this.gamestates.REMOVE_CLUSTER);
                return;
            }
        }
        this.turncounter++;
        if (this.turncounter >= 5) {
            this.level.addBubbles();
            this.turncounter = 0;
            this.rowoffset = (this.rowoffset + 1) % 2;
            this.level.rowoffset = this.rowoffset;
            if (this.checkGameOver()) return;
        }
        this.nextBubble();
        this.setGameState(this.gamestates.READY);
    }

    checkGameOver() {
        for (let i = 0; i < this.level.columns; i++) {
            if (this.level.tiles[i][this.level.rows - 1].type !== -1) {
                this.nextBubble();
                this.setGameState(this.gamestates.GAME_OVER);
                return true;
            }
        }
        return false;
    }

    findCluster(tx, ty, matchtype, reset, skipremoved) {
        if (reset) this.resetProcessed();
        const targettile = this.level.tiles[tx][ty];
        const toprocess = [targettile];
        targettile.processed = true;
        const foundcluster = [];
        while (toprocess.length > 0) {
            const currenttile = toprocess.pop();
            if (currenttile.type === -1) continue;
            if (skipremoved && currenttile.removed) continue;
            if (!matchtype || (currenttile.type === targettile.type)) {
                foundcluster.push(currenttile);
                const neighbors = this.level.getNeighbors(currenttile);
                for (let i = 0; i < neighbors.length; i++) {
                    if (!neighbors[i].processed) {
                        toprocess.push(neighbors[i]);
                        neighbors[i].processed = true;
                    }
                }
            }
        }
        return foundcluster;
    }

    findFloatingClusters() {
        this.resetProcessed();
        const foundclusters = [];
        for (let i = 0; i < this.level.columns; i++) {
            for (let j = 0; j < this.level.rows; j++) {
                const tile = this.level.tiles[i][j];
                if (!tile.processed) {
                    const foundcluster = this.findCluster(i, j, false, false, true);
                    if (foundcluster.length <= 0) continue;
                    let floating = true;
                    for (let k = 0; k < foundcluster.length; k++) {
                        if (foundcluster[k].y === 0) {
                            floating = false;
                            break;
                        }
                    }
                    if (floating) {
                        foundclusters.push(foundcluster);
                    }
                }
            }
        }
        return foundclusters;
    }

    resetProcessed() {
        for (let i = 0; i < this.level.columns; i++) {
            for (let j = 0; j < this.level.rows; j++) {
                this.level.tiles[i][j].processed = false;
            }
        }
    }

    resetRemoved() {
        for (let i = 0; i < this.level.columns; i++) {
            for (let j = 0; j < this.level.rows; j++) {
                this.level.tiles[i][j].removed = false;
            }
        }
    }

    updateFps(dt) {
        if (this.fpstime > 0.25) {
            this.fps = Math.round(this.framecount / this.fpstime);
            this.fpstime = 0;
            this.framecount = 0;
        }
        this.fpstime += dt;
        this.framecount++;
    }

    render() {
        this.ui.drawFrame(this.fps);
        this.ui.render(this.gamestate, this.level, this.player, this.score, this.cluster, this.floatingclusters, this.showcluster, this.bubbleimage);
    }

    newGame() {
        this.score = 0;
        this.turncounter = 0;
        this.rowoffset = 0;
        this.setGameState(this.gamestates.READY);
        this.level.create();
        this.nextBubble();
        this.nextBubble();
    }

    nextBubble() {
        this.player.tiletype = this.player.nextbubble.tiletype;
        this.player.bubble.tiletype = this.player.nextbubble.tiletype;
        this.player.bubble.x = this.player.x;
        this.player.bubble.y = this.player.y;
        this.player.bubble.visible = true;
        const nextcolor = this.level.getExistingColor();
        this.player.nextbubble.tiletype = nextcolor;
    }

    shootBubble() {
        this.player.bubble.x = this.player.x;
        this.player.bubble.y = this.player.y;
        this.player.bubble.angle = this.player.angle;
        this.player.bubble.tiletype = this.player.tiletype;
        this.setGameState(this.gamestates.SHOOT_BUBBLE);
    }

    circleIntersection(x1, y1, r1, x2, y2, r2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        const len = Math.sqrt(dx * dx + dy * dy);
        return len < r1 + r2;
    }

    degToRad(angle) {
        return angle * (Math.PI / 180);
    }

    radToDeg(angle) {
        return angle * (180 / Math.PI);
    }

    onMouseMove(e) {
        const pos = this.getMousePos(this.canvas, e);
        let mouseangle = this.radToDeg(Math.atan2((this.player.y + this.level.tileheight / 2) - pos.y, pos.x - (this.player.x + this.level.tilewidth / 2)));
        if (mouseangle < 0) {
            mouseangle = 180 + (180 + mouseangle);
        }
        const lbound = 8;
        const ubound = 172;
        if (mouseangle > 90 && mouseangle < 270) {
            if (mouseangle > ubound) {
                mouseangle = ubound;
            }
        } else {
            if (mouseangle < lbound || mouseangle >= 270) {
                mouseangle = lbound;
            }
        }
        this.player.angle = mouseangle;
    }

    onMouseDown(e) {
        if (this.gamestate === this.gamestates.READY) {
            this.shootBubble();
        } else if (this.gamestate === this.gamestates.GAME_OVER) {
            this.newGame();
        }
    }

    getMousePos(canvas, e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((e.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
            y: Math.round((e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
        };
    }
}

window.onload = function() {
    new BubbleShooter();
};
