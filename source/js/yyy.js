// 樱花飘落特效
(function() {
    // 配置参数
    const config = {
        // 樱花数量
        sakuraCount: 42,
        // 樱花下落速度
        fallSpeed: 0.1,
        // 樱花摆动幅度
        swingMagnitude: 50,
        // 樱花颜色 (可以设置为粉色系的不同颜色)
        colors: [
            'rgba(255, 183, 197, 0.7)',  // 浅粉色
            'rgba(255, 192, 203, 0.7)',  // 粉色
            'rgba(255, 182, 193, 0.7)',  // 浅玫瑰粉
            'rgba(255, 209, 220, 0.7)',  // 淡粉色
            'rgba(255, 160, 122, 0.7)'   // 浅珊瑚色
        ],
        // 樱花大小范围 (最小和最大半径)
        minRadius: 5,
        maxRadius: 15,
        // 是否启用点击生成更多樱花
        enableClick: true
    };

    // 创建画布
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    // 设置画布尺寸
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 樱花类
    class Sakura {
        constructor() {
            this.reset();
        }

        reset() {
            // 随机位置
            this.x = Math.random() * canvas.width;
            this.y = -20 - Math.random() * 20;
            
            // 随机大小
            this.radius = config.minRadius + Math.random() * (config.maxRadius - config.minRadius);
            
            // 随机颜色
            this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
            
            // 下落速度
            this.speed = config.fallSpeed + Math.random() * 3;
            
            // 摆动参数
            this.swingSpeed = 0.1 + Math.random() * 0.1;
            this.swingPhase = Math.random() * Math.PI;
            this.swingMagnitude = config.swingMagnitude + Math.random() * 10;
            
            // 旋转参数
            this.rotation = Math.random() * Math.PI * 0.2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.1;
            
            // 花瓣形状参数
            this.petalCount = 5;
            this.petalIndent = 0.3 + Math.random() * 0.2;
        }

        update() {
            // 更新位置
            this.y += this.speed;
            
            // 摆动效果
            this.swingPhase += this.swingSpeed;
            this.x += Math.sin(this.swingPhase) * 0.5;
            
            // 旋转
            this.rotation += this.rotationSpeed;
            
            // 如果樱花落到底部，重置到顶部
            if (this.y > canvas.height + this.radius) {
                this.reset();
                this.y = -this.radius;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
            // 绘制花瓣
            ctx.beginPath();
            for (let i = 0; i < this.petalCount; i++) {
                const angle = (i * 2 * Math.PI) / this.petalCount;
                const nextAngle = ((i + 1) * 2 * Math.PI) / this.petalCount;
                
                // 花瓣外缘点
                const x1 = Math.cos(angle) * this.radius;
                const y1 = Math.sin(angle) * this.radius;
                
                // 花瓣内凹点
                const x2 = Math.cos(angle + (nextAngle - angle) * 0.5) * this.radius * this.petalIndent;
                const y2 = Math.sin(angle + (nextAngle - angle) * 0.5) * this.radius * this.petalIndent;
                
                if (i === 0) {
                    ctx.moveTo(x1, y1);
                } else {
                    ctx.lineTo(x1, y1);
                }
                
                ctx.quadraticCurveTo(x2, y2, x1, y1);
            }
            
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
            
            // 绘制花蕊
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fill();
            
            ctx.restore();
        }
    }

    // 创建樱花数组
    const sakuras = [];
    for (let i = 0; i < config.sakuraCount; i++) {
        sakuras.push(new Sakura());
    }

    // 点击添加更多樱花
    if (config.enableClick) {
        canvas.addEventListener('click', (e) => {
            for (let i = 0; i < 5; i++) {
                const sakura = new Sakura();
                sakura.x = e.clientX + (Math.random() - 0.5) * 50;
                sakura.y = e.clientY + (Math.random() - 0.5) * 50;
                sakuras.push(sakura);
            }
        });
    }

    // 动画循环
    function animate() {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 更新和绘制所有樱花
        sakuras.forEach(sakura => {
            sakura.update();
            sakura.draw(ctx);
        });
        
        requestAnimationFrame(animate);
    }

    // 开始动画
    animate();
})();