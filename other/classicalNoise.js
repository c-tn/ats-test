let ClassicalNoise = function(seed = 'seed') {
	let rng = new RNG(seed);

	this.grad3 = [
		[1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0], 
		[1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1], 
		[0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1]
	]; 

	this.p = [];

	for (let i = 0; i < 256; i++) {
		this.p[i] = Math.floor(rng.unit() * 256);
	}
	this.perm = []; 

	for(let i = 0; i < 512; i++) {
		this.perm[i] = this.p[i & 255];
	}
};

ClassicalNoise.prototype.dot = function(g, x, y, z) { 
	return g[0]*x + g[1]*y + g[2]*z; 
};

ClassicalNoise.prototype.mix = function(a, b, t) { 
	return (1.0-t)*a + t*b; 
};

ClassicalNoise.prototype.fade = function(t) { 
	return t*t*t*(t*(t*6.0-15.0)+10.0); 
};

ClassicalNoise.prototype.noise = function(x, y, z) {
	let X = Math.floor(x); 
	let Y = Math.floor(y); 
	let Z = Math.floor(z); 
	
	x = x - X; 
	y = y - Y; 
	z = z - Z; 
	
	X = X & 255; 
	Y = Y & 255; 
	Z = Z & 255;
	
	let gi000 = this.perm[X+this.perm[Y+this.perm[Z]]] % 12; 
	let gi001 = this.perm[X+this.perm[Y+this.perm[Z+1]]] % 12; 
	let gi010 = this.perm[X+this.perm[Y+1+this.perm[Z]]] % 12; 
	let gi011 = this.perm[X+this.perm[Y+1+this.perm[Z+1]]] % 12; 
	let gi100 = this.perm[X+1+this.perm[Y+this.perm[Z]]] % 12; 
	let gi101 = this.perm[X+1+this.perm[Y+this.perm[Z+1]]] % 12; 
	let gi110 = this.perm[X+1+this.perm[Y+1+this.perm[Z]]] % 12; 
	let gi111 = this.perm[X+1+this.perm[Y+1+this.perm[Z+1]]] % 12; 
	
	let n000= this.dot(this.grad3[gi000], x, y, z); 
	let n100= this.dot(this.grad3[gi100], x-1, y, z); 
	let n010= this.dot(this.grad3[gi010], x, y-1, z); 
	let n110= this.dot(this.grad3[gi110], x-1, y-1, z); 
	let n001= this.dot(this.grad3[gi001], x, y, z-1); 
	let n101= this.dot(this.grad3[gi101], x-1, y, z-1); 
	let n011= this.dot(this.grad3[gi011], x, y-1, z-1); 
	let n111= this.dot(this.grad3[gi111], x-1, y-1, z-1); 

	let u = this.fade(x); 
	let v = this.fade(y); 
	let w = this.fade(z); 

	let nx00 = this.mix(n000, n100, u); 
	let nx01 = this.mix(n001, n101, u); 
	let nx10 = this.mix(n010, n110, u); 
	let nx11 = this.mix(n011, n111, u); 

	let nxy0 = this.mix(nx00, nx10, v); 
	let nxy1 = this.mix(nx01, nx11, v); 

	let nxyz = this.mix(nxy0, nxy1, w); 

	return nxyz;
};

function RNG(seed){
	this.seed = this.getSeed(seed) * 394875498754986;
	this.a = 16807;
	this.c = 0;
	this.m = Math.pow(2, 31) - 1;
}

RNG.prototype.getSeed = function(seed){
	let s = 34737;

	for(let i = 0; i < seed.length; i++){
		s += (i + 1) * seed.charCodeAt(i);
	}
	
	return s;
}

RNG.prototype.unit = function(){
	this.seed = (this.a * this.seed + this.c) % this.m;

	return this.seed / (this.m - 1);
}

RNG.prototype.unitString = function(){
	this.seed = (this.a * this.seed + this.c) % this.m;

	return (this.seed / (this.m - 1)).toString(36).substr(2);
}