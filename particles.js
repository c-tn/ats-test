let particlesStorage = [];

class Particle {
	constructor(data = {}) {
		this.x = data.x;
		this.y = data.y;
		this.force = data.force || 10;
		this.initSize = data.size || 10;
		this.size = data.size || 10;
		this.angle = data.angle || Math.PI * 2 * Math.random();
		
		this.vx = this.force * Math.random() * Math.cos(this.angle);
		this.vy = this.force * Math.random() * Math.sin(this.angle);
		
		this.color = '#000';
	}
	
	update() {
		this.x += this.vx;
		this.y += this.vy;
		
		this.vx *= 0.9;
		this.vy *= 0.9;
		this.size -= Math.random();
	}
	
	render() {
        ctx.fillStyle = this.color;

        ctx.save();
            ctx.translate(
                this.x - camera.x + camera.width / 2,
                this.y - camera.y + camera.height / 2
            );

            ctx.fillRect(0, 0, this.size, this.size);
        ctx.restore();
	}
}

function createParticles({ x, y, cb, size = 20, force = 15, count = 400 }) {	
	let data = {
		particles: []
	}
	
	data.cb = cb;
	
	for (let i = 0; i < count; i++) {
        const angle = Math.PI * 2 * Math.random();

		data.particles.push(new Particle({
			x: x,
			y: y,
			size,
			force,
			angle,
		}));
	}
	
	particlesStorage.push(data);
}