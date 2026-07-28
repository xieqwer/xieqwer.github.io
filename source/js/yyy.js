// 樱花飘落特效 v5 — 拖拽散落 + 跟随上限 + 定时生成
(function() {
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    var W, H;
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    var mouseX = -999, mouseY = -999;
    var prevMouseX = -999, prevMouseY = -999;
    var mouseSpeedX = 0, mouseSpeedY = 0, mouseSpeed = 0;
    var smoothSpeedX = 0, smoothSpeedY = 0, smoothSpeed = 0;
    var CORE_RADIUS = 1;
    var ORBIT_RADIUS = 150;
    var SUCK_RADIUS = 240;
    var FOLLOW_LIMIT = 30;

    var prevSpeedX = 0, prevSpeedY = 0;
    var orbitDir = 1;

    document.addEventListener('mousemove', function(e) {
        prevMouseX = mouseX;
        prevMouseY = mouseY;
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (prevMouseX > -999) {
            mouseSpeedX = mouseX - prevMouseX;
            mouseSpeedY = mouseY - prevMouseY;
            mouseSpeed = Math.sqrt(mouseSpeedX * mouseSpeedX + mouseSpeedY * mouseSpeedY);
            var a2 = 0.25;
            smoothSpeedX = smoothSpeedX * (1 - a2) + mouseSpeedX * a2;
            smoothSpeedY = smoothSpeedY * (1 - a2) + mouseSpeedY * a2;
            smoothSpeed = Math.sqrt(smoothSpeedX * smoothSpeedX + smoothSpeedY * smoothSpeedY);
            var cross = prevSpeedX * smoothSpeedY - prevSpeedY * smoothSpeedX;
            if (Math.abs(cross) > 2 && smoothSpeed > 3) {
                orbitDir = orbitDir * 0.88 + (cross > 0 ? -1 : 1) * 0.12;
            }
            prevSpeedX = smoothSpeedX;
            prevSpeedY = smoothSpeedY;
        }
    });
    document.addEventListener('mouseleave', function() {
        mouseX = -999;
        mouseY = -999;
        mouseSpeed = 0;
        smoothSpeed = 0;
    });

    function edgeBiasedX() {
        var r = Math.random();
        if (r < 0.40) return Math.random() * W * 0.32;
        if (r < 0.80) return W * (0.68 + Math.random() * 0.32);
        return W * (0.32 + Math.random() * 0.36);
    }

    function entryPos() {
        if (Math.random() < 0.35) {
            return { x: -20 - Math.random() * 40, y: Math.random() * H };
        } else {
            return { x: edgeBiasedX(), y: -20 - Math.random() * H * 0.3 };
        }
    }

    function drawPetal(ctx, size) {
        var s = size;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.55);
        ctx.bezierCurveTo(s * 0.25, -s * 0.38, s * 0.42, -s * 0.02, s * 0.36, s * 0.28);
        ctx.bezierCurveTo(s * 0.24, s * 0.40, s * 0.06, s * 0.44, 0, s * 0.38);
        ctx.bezierCurveTo(-s * 0.14, s * 0.28, -s * 0.24, s * 0.02, -s * 0.10, -s * 0.28);
        ctx.bezierCurveTo(-s * 0.04, -s * 0.46, -s * 0.02, -s * 0.52, 0, -s * 0.55);
        ctx.closePath();
    }

    var palettes = [
        { body: 'rgba(255,192,203,OPACITY)', vein: 'rgba(255,140,160,OPACITY)', base: 'rgba(255,220,230,OPACITY)' },
        { body: 'rgba(255,183,197,OPACITY)', vein: 'rgba(255,130,150,OPACITY)', base: 'rgba(255,210,225,OPACITY)' },
        { body: 'rgba(255,209,220,OPACITY)', vein: 'rgba(255,150,170,OPACITY)', base: 'rgba(255,230,240,OPACITY)' },
        { body: 'rgba(255,175,190,OPACITY)', vein: 'rgba(255,125,145,OPACITY)', base: 'rgba(255,205,220,OPACITY)' },
        { body: 'rgba(255,218,200,OPACITY)', vein: 'rgba(255,160,130,OPACITY)', base: 'rgba(255,235,225,OPACITY)' },
    ];
    var MAX_PETALS = 220;

    var Petal = function(depth, startX, startY) {
        depth = depth !== undefined ? depth : Math.random();
        this.depth = depth;
        if (startX !== undefined) {
            this.x = startX;
            this.y = startY;
        } else {
            var pos = entryPos();
            this.x = pos.x;
            this.y = pos.y;
        }
        this.mouseVx = 0;
        this.mouseVy = 0;
        this.palette = palettes[Math.floor(Math.random() * palettes.length)];
        this.alpha = 0.45 + depth * 0.4;
        this.resetMotion();
    };

    Petal.prototype.resetMotion = function() {
        var d = this.depth;
        this.size = 6 + d * 12;
        this.fallSpeed = 0.15 + d * 0.35;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.015 * (1 + d);
        this.floatPhase = Math.random() * Math.PI * 2;
        this.floatSpeed = 0.004 + Math.random() * 0.010;
        this.floatAmp = 0.05 + d * 0.18;
        this.driftBase = (Math.random() - 0.5) * 0.08;
        this.windOffset = Math.random() * Math.PI * 2;
        this.windSpeed = 0.006 + Math.random() * 0.015;
        this.windResponse = 0.5 + d * 0.8;
        this.swayPhase = Math.random() * Math.PI * 2;
        this.swaySpeed = 0.006 + Math.random() * 0.018;
        this.swayAmp = 0.04 + Math.random() * 0.16;
    };

    Petal.prototype.update = function(dt, followerRank, followerCount) {
        var d = this.depth;
        this._lastDt = dt;

        var floatMod = Math.sin(this.floatPhase) * this.floatAmp;
        var baseVy = this.fallSpeed + floatMod;
        this.floatPhase += this.floatSpeed;

        var breeze = Math.sin(Date.now() * this.windSpeed + this.windOffset) * 0.03;
        var wind = windForce * this.windResponse;
        var sway = Math.sin(this.swayPhase) * this.swayAmp;
        var baseVx = this.driftBase + breeze + wind + sway;
        this.swayPhase += this.swaySpeed;

        var dx = mouseX - this.x;
        var dy = mouseY - this.y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < SUCK_RADIUS && dist > 1 && mouseX > -999) {
            var nx = dx / dist;
            var ny = dy / dist;
            var tx = -ny;
            var ty = nx;
            var isFollower = followerRank >= 0 && followerRank < FOLLOW_LIMIT;

            if (isFollower) {
                if (dist < CORE_RADIUS) {
                    var repel = (1 - dist / CORE_RADIUS) * 1.5;
                    this.x -= nx * repel;
                    this.y -= ny * repel;
                } else {
                    var it2 = (dist - CORE_RADIUS) / (SUCK_RADIUS - CORE_RADIUS);

                    if (smoothSpeed < 30) {
                        var followF = (1 - dist / SUCK_RADIUS) * 0.05;
                        this.mouseVx += smoothSpeedX * followF;
                        this.mouseVy += smoothSpeedY * followF;

                        if (dist < ORBIT_RADIUS) {
                            var dir = Math.abs(orbitDir) > 0.15 ? (orbitDir > 0 ? 1 : -1) : 1;
                            this.x += tx * dir;
                            this.y += ty * dir;
                        }
                        var inward = 0.12 + Math.pow(it2, 1.5) * 0.3;
                        this.mouseVx += nx * inward;
                        this.mouseVy += ny * inward;
                    } else {
                        var dragForce = (1 - dist / SUCK_RADIUS) * smoothSpeed * 0.04;
                        this.mouseVx -= nx * dragForce;
                        this.mouseVy -= ny * dragForce;
                        this.mouseVx += tx * (Math.random() - 0.5) * dragForce * 4;
                        this.mouseVy += (Math.random() - 0.5) * dragForce * 3;
                    }

                    this.mouseVx *= 0.95;
                    this.mouseVy *= 0.96;
                }
            } else {
                var it2 = (dist - CORE_RADIUS) / (SUCK_RADIUS - CORE_RADIUS);
                this.mouseVx += nx * it2 * 0.01;
                this.mouseVy += ny * it2 * 0.01;
                this.mouseVx *= 0.95;
                this.mouseVy *= 0.96;
            }
        } else {
            if (Math.abs(this.mouseVx) > 0.005 || Math.abs(this.mouseVy) > 0.005) {
                var decay = Math.pow(0.005, this._lastDt ? this._lastDt / 3000 : 16 / 3000);
                this.mouseVx *= decay;
                this.mouseVy *= decay;
            } else {
                this.mouseVx = 0;
                this.mouseVy = 0;
            }
        }

        this.x += baseVx + this.mouseVx;
        this.y += baseVy + this.mouseVy;
        this.rotation += this.rotSpeed;

        if (this.y > H + 30 || this.x < -50 || this.x > W + 50) {
            if (petals.length > 140) {
                this.dead = true;
            } else {
                var pos = entryPos();
                this.x = pos.x;
                this.y = pos.y;
                this.mouseVx = 0;
                this.mouseVy = 0;
                this.resetMotion();
            }
        }
    };

    Petal.prototype.draw = function(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        var size = this.size;
        var a = this.alpha;
        drawPetal(ctx, size);
        var bodyGrad = ctx.createLinearGradient(0, -size, 0, size * 0.38);
        bodyGrad.addColorStop(0, this.palette.body.replace('OPACITY', a));
        bodyGrad.addColorStop(0.7, this.palette.vein.replace('OPACITY', a * 0.55));
        bodyGrad.addColorStop(1, this.palette.base.replace('OPACITY', a * 0.25));
        ctx.fillStyle = bodyGrad;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.48);
        ctx.quadraticCurveTo(size * 0.04, size * 0.02, size * 0.02, size * 0.26);
        ctx.strokeStyle = this.palette.vein.replace('OPACITY', a * 0.25);
        ctx.lineWidth = size * 0.04;
        ctx.stroke();
        ctx.restore();
    };

    var petals = [];
    var LAYERS = [
        { count: 40, dr: [0, 0.3] },
        { count: 46, dr: [0.3, 0.65] },
        { count: 28, dr: [0.65, 1.0] },
    ];
    LAYERS.forEach(function(layer) {
        for (var i = 0; i < layer.count; i++) {
            var d = layer.dr[0] + Math.random() * (layer.dr[1] - layer.dr[0]);
            petals.push(new Petal(d));
        }
    });

    var windForce = 0;
    var windTimer = 0;
    function updateWind(dt) {
        windTimer += dt * 0.0004;
        windForce = 0.22 + Math.sin(windTimer) * 0.10 + Math.sin(windTimer * 2.7) * 0.05;
    }

    var spawnTimer = 0;
    var SPAWN_INTERVAL = 3000;

    canvas.addEventListener('click', function(e) {
        for (var i = 0; i < 5; i++) {
            var petal = new Petal(
                Math.random(),
                e.clientX + (Math.random() - 0.5) * 30,
                e.clientY + (Math.random() - 0.5) * 30
            );
            petal.fallSpeed = 0.35 + Math.random() * 0.4;
            petal.rotSpeed = (Math.random() - 0.5) * 0.03;
            petals.push(petal);
        }
        while (petals.length > MAX_PETALS) petals.shift();
    });

    var lastTime = 0;
    function animate(timestamp) {
        var dt = lastTime ? Math.min(timestamp - lastTime, 50) : 16;
        lastTime = timestamp;
        ctx.clearRect(0, 0, W, H);
        updateWind(dt);

        spawnTimer += dt;
        if (spawnTimer > SPAWN_INTERVAL && petals.length < MAX_PETALS) {
            spawnTimer = 0;
            var n = 1 + Math.floor(Math.random() * 2);
            for (var j = 0; j < n; j++) {
                if (petals.length < MAX_PETALS) {
                    petals.push(new Petal(Math.random()));
                }
            }
        }

        if (Math.floor(timestamp / 160) !== Math.floor((timestamp - dt) / 160)) {
            petals.sort(function(a, b) { return a.depth - b.depth; });
        }

        var followerCount = 0;
        var ranks = [];
        for (var i = 0; i < petals.length; i++) {
            var p = petals[i];
            var pdx = mouseX - p.x;
            var pdy = mouseY - p.y;
            var pdist = Math.sqrt(pdx * pdx + pdy * pdy);
            if (pdist < SUCK_RADIUS && mouseX > -999) {
                ranks.push({ idx: i, dist: pdist });
            }
        }
        ranks.sort(function(a, b) { return a.dist - b.dist; });
        var rankMap = {};
        for (var k = 0; k < ranks.length; k++) {
            rankMap[ranks[k].idx] = k;
        }

        for (var i = 0; i < petals.length; i++) {
            var rank = rankMap.hasOwnProperty(i) ? rankMap[i] : -1;
            petals[i].update(dt, rank, ranks.length);
        }

        var alive = [];
        for (var i = 0; i < petals.length; i++) {
            if (!petals[i].dead) {
                alive.push(petals[i]);
                petals[i].draw(ctx);
            }
        }
        petals = alive;

        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
})();
