// Simplex Noise Implementation
// Based on the algorithm by Ken Perlin

// Gradient vectors for 2D/3D (pointing to mid points of edges of a unit cube)
const grad3 = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
];

// Helper function to generate seeded random numbers
function seedRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Helper function for dot product
function dot(g: number[], x: number, y: number, z?: number): number {
  return z !== undefined ? g[0] * x + g[1] * y + g[2] * z : g[0] * x + g[1] * y;
}

export class SimplexNoise {
  private perm: Uint8Array;
  private permMod12: Uint8Array;

  constructor(seed = Math.random()) {
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    
    const p = new Uint8Array(256);
    
    // Fill p with values from 0 to 255
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    
    // Shuffle using seed
    let n: number;
    let q: number;
    for (let i = 255; i > 0; i--) {
      n = Math.floor((i + 1) * seedRandom(seed + i));
      q = p[i];
      p[i] = p[n];
      p[n] = q;
    }
    
    // Extend permutation arrays
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }
  
  // 2D simplex noise
  noise2D(x: number, y: number): number {
    // Noise contributions from the three corners
    let n0 = 0, n1 = 0, n2 = 0;
    
    // Skew the input space to determine which simplex cell we're in
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    
    const G2 = (3 - Math.sqrt(3)) / 6;
    const t = (i + j) * G2;
    
    // Unskew the cell origin back to (x,y) space
    const X0 = i - t;
    const Y0 = j - t;
    
    // The x,y distances from the cell origin
    const x0 = x - X0;
    const y0 = y - Y0;
    
    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    
    if (x0 > y0) {
      // Lower triangle, XY order: (0,0)->(1,0)->(1,1)
      i1 = 1;
      j1 = 0;
    } else {
      // Upper triangle, YX order: (0,0)->(0,1)->(1,1)
      i1 = 0;
      j1 = 1;
    }
    
    // Offsets for middle corner in (x,y) unskewed coords
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    
    // Offsets for last corner in (x,y) unskewed coords
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    
    // Work out the hashed gradient indices of the three simplex corners
    const ii = i & 255;
    const jj = j & 255;
    
    // Calculate the contribution from the three corners
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      const gi0 = this.permMod12[ii + this.perm[jj]];
      t0 *= t0;
      n0 = t0 * t0 * dot(grad3[gi0], x0, y0);
    }
    
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
      t1 *= t1;
      n1 = t1 * t1 * dot(grad3[gi1], x1, y1);
    }
    
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];
      t2 *= t2;
      n2 = t2 * t2 * dot(grad3[gi2], x2, y2);
    }
    
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1, 1].
    return 70 * (n0 + n1 + n2);
  }
  
  // 3D simplex noise
  noise3D(x: number, y: number, z: number): number {
    // Noise contributions from the four corners
    let n0 = 0, n1 = 0, n2 = 0, n3 = 0;
    
    // Skew the input space to determine which simplex cell we're in
    const F3 = 1/3;
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);
    
    const G3 = 1/6;
    const t = (i + j + k) * G3;
    
    // Unskew the cell origin back to (x,y,z) space
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;
    
    // The x,y,z distances from the cell origin
    const x0 = x - X0;
    const y0 = y - Y0;
    const z0 = z - Z0;
    
    // Determine which simplex we are in
    let i1, j1, k1; // Offsets for second corner
    let i2, j2, k2; // Offsets for third corner
    
    if (x0 >= y0) {
      if (y0 >= z0) {
        i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; // XYZ order
      } else if (x0 >= z0) {
        i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; // XZY order
      } else {
        i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; // ZXY order
      }
    } else { // x0<y0
      if (y0 < z0) {
        i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; // ZYX order
      } else if (x0 < z0) {
        i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; // YZX order
      } else {
        i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; // YXZ order
      }
    }
    
    // Offsets for remaining corners
    const x1 = x0 - i1 + G3; 
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    
    const x2 = x0 - i2 + 2*G3; 
    const y2 = y0 - j2 + 2*G3;
    const z2 = z0 - k2 + 2*G3;
    
    const x3 = x0 - 1 + 3*G3; 
    const y3 = y0 - 1 + 3*G3;
    const z3 = z0 - 1 + 3*G3;
    
    // Work out the hashed gradient indices
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    
    // Calculate the contributions from the four corners
    let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if (t0 > 0) {
      t0 *= t0;
      const gi0 = this.permMod12[ii + this.perm[jj + this.perm[kk]]];
      n0 = t0 * t0 * dot(grad3[gi0], x0, y0, z0);
    }
    
    let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if (t1 > 0) {
      t1 *= t1;
      const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]];
      n1 = t1 * t1 * dot(grad3[gi1], x1, y1, z1);
    }
    
    let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if (t2 > 0) {
      t2 *= t2;
      const gi2 = this.permMod12[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]];
      n2 = t2 * t2 * dot(grad3[gi2], x2, y2, z2);
    }
    
    let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if (t3 > 0) {
      t3 *= t3;
      const gi3 = this.permMod12[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]];
      n3 = t3 * t3 * dot(grad3[gi3], x3, y3, z3);
    }
    
    // Add contributions from each corner
    return 32 * (n0 + n1 + n2 + n3);
  }
}
