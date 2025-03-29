import * as THREE from 'three';
import { BlockType } from '../blocks';

class TextureManager {
  private textures: Map<string, THREE.Texture> = new Map();
  private atlasTexture: THREE.Texture | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  // Array of block types that need textures
  private textureTypes: BlockType[] = [
    'grass', 'dirt', 'stone', 'sand', 'wood', 'leaves', 'water',
    'log', 'craftingTable', 'coal', 'torch', 'ice', 'lava', 'snow',
    'cactus', 'glass'
  ];
  
  // Colors for procedural texture generation
  private blockColors: Record<BlockType, string> = {
    'air': 'transparent',
    'grass': '#4CAF50',
    'dirt': '#795548',
    'stone': '#9E9E9E',
    'sand': '#FDD835',
    'wood': '#8D6E63',
    'leaves': '#81C784',
    'water': '#2196F3',
    'log': '#5D4037',
    'stick': '#A1887F',
    'craftingTable': '#6D4C41',
    'woodenPickaxe': '#A1887F',
    'stonePickaxe': '#78909C',
    'woodenAxe': '#A1887F',
    'woodenShovel': '#A1887F',
    'coal': '#263238',
    'torch': '#FFB300',
    'ice': '#A5D6F6',
    'lava': '#FF5722',
    'snow': '#FAFAFA',
    'cactus': '#2E7D32',
    'glass': '#E0F7FA'
  };
  
  constructor() {
    // Create canvas for procedural texture generation
    this.canvas = document.createElement('canvas');
    this.canvas.width = 64;
    this.canvas.height = 64;
    this.ctx = this.canvas.getContext('2d');
    
    if (!this.ctx) {
      console.error('Failed to get 2D context for texture generation');
    }
  }
  
  // Load actual textures from server
  async loadTextures(): Promise<void> {
    const textureLoader = new THREE.TextureLoader();
    
    const loadPromises = this.textureTypes.map(async (blockType) => {
      try {
        // Try to load actual texture
        const texture = await this.loadTexture(textureLoader, blockType);
        this.textures.set(blockType, texture);
        console.log(`Loaded texture for ${blockType}`);
      } catch (error) {
        // If actual texture fails, generate procedural one
        console.warn(`Failed to load texture for ${blockType}, using procedural texture`);
        const proceduralTexture = this.generateProceduralTexture(blockType);
        this.textures.set(blockType, proceduralTexture);
      }
    });
    
    // Wait for all textures to load
    await Promise.all(loadPromises);
    console.log('All textures loaded');
  }
  
  private loadTexture(loader: THREE.TextureLoader, blockType: BlockType): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      loader.load(
        `/textures/${blockType}.png`, // Try to load from expected path
        (texture) => {
          // Configure the texture properly
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.magFilter = THREE.NearestFilter; // Pixelated look
          texture.minFilter = THREE.NearestFilter;
          resolve(texture);
        },
        undefined, // onProgress is optional
        (error) => {
          console.warn(`Error loading texture for ${blockType}:`, error);
          reject(error);
        }
      );
    });
  }
  
  // Generate a procedural texture for a block type
  private generateProceduralTexture(blockType: BlockType): THREE.Texture {
    if (!this.ctx || !this.canvas) {
      throw new Error('Canvas context not available for texture generation');
    }
    
    const color = this.blockColors[blockType] || '#FFFFFF';
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Fill with base color
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add some texture details based on block type
    switch (blockType) {
      case 'grass':
        // Add some darker green dots for texture
        this.ctx.fillStyle = '#388E3C';
        for (let i = 0; i < 100; i++) {
          const x = Math.random() * this.canvas.width;
          const y = Math.random() * this.canvas.height;
          const size = 1 + Math.random() * 3;
          this.ctx.fillRect(x, y, size, size);
        }
        break;
        
      case 'stone':
        // Add some lighter and darker spots for stone texture
        for (let i = 0; i < 200; i++) {
          const x = Math.random() * this.canvas.width;
          const y = Math.random() * this.canvas.height;
          const size = 1 + Math.random() * 2;
          this.ctx.fillStyle = Math.random() > 0.5 ? '#757575' : '#BDBDBD';
          this.ctx.fillRect(x, y, size, size);
        }
        break;
        
      case 'dirt':
        // Add some darker spots
        this.ctx.fillStyle = '#5D4037';
        for (let i = 0; i < 150; i++) {
          const x = Math.random() * this.canvas.width;
          const y = Math.random() * this.canvas.height;
          const size = 1 + Math.random() * 3;
          this.ctx.fillRect(x, y, size, size);
        }
        break;
        
      case 'sand':
        // Add some darker spots for sand texture
        this.ctx.fillStyle = '#F9A825';
        for (let i = 0; i < 100; i++) {
          const x = Math.random() * this.canvas.width;
          const y = Math.random() * this.canvas.height;
          const size = 1 + Math.random() * 2;
          this.ctx.fillRect(x, y, size, size);
        }
        break;
        
      case 'wood':
      case 'log':
        // Add wood grain
        this.ctx.fillStyle = '#6D4C41';
        for (let i = 0; i < 10; i++) {
          this.ctx.fillRect(5 + i * 6, 0, 2, this.canvas.height);
        }
        break;
        
      case 'leaves':
        // Add some texture to leaves
        this.ctx.fillStyle = '#558B2F';
        for (let i = 0; i < 100; i++) {
          const x = Math.random() * this.canvas.width;
          const y = Math.random() * this.canvas.height;
          const size = 1 + Math.random() * 3;
          this.ctx.fillRect(x, y, size, size);
        }
        break;
        
      case 'water':
        // Add ripple effect to water
        this.ctx.fillStyle = '#1976D2';
        for (let i = 0; i < 5; i++) {
          this.ctx.fillRect(0, 10 + i * 12, this.canvas.width, 4);
        }
        break;
        
      case 'ice':
        // Create cracked ice effect
        this.ctx.fillStyle = '#76B8E0';
        // Draw crack lines
        for (let i = 0; i < 8; i++) {
          this.ctx.beginPath();
          this.ctx.moveTo(Math.random() * this.canvas.width, Math.random() * this.canvas.height);
          this.ctx.lineTo(Math.random() * this.canvas.width, Math.random() * this.canvas.height);
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
        }
        break;
        
      case 'lava':
        // Create bubbling lava effect
        const gradientLava = this.ctx.createRadialGradient(
          this.canvas.width/2, this.canvas.height/2, 5,
          this.canvas.width/2, this.canvas.height/2, this.canvas.width/2
        );
        gradientLava.addColorStop(0, '#FFEB3B');
        gradientLava.addColorStop(1, '#E65100');
        this.ctx.fillStyle = gradientLava;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add bubbles
        this.ctx.fillStyle = '#FFC107';
        for (let i = 0; i < 15; i++) {
          const x = Math.random() * this.canvas.width;
          const y = Math.random() * this.canvas.height;
          const size = 2 + Math.random() * 5;
          this.ctx.beginPath();
          this.ctx.arc(x, y, size, 0, Math.PI * 2);
          this.ctx.fill();
        }
        break;
        
      case 'snow':
        // Create snow texture with small flakes
        for (let i = 0; i < 100; i++) {
          const x = Math.random() * this.canvas.width;
          const y = Math.random() * this.canvas.height;
          const size = 1 + Math.random() * 2;
          this.ctx.fillStyle = Math.random() > 0.7 ? '#E0E0E0' : '#FFFFFF';
          this.ctx.beginPath();
          this.ctx.arc(x, y, size, 0, Math.PI * 2);
          this.ctx.fill();
        }
        break;
        
      case 'cactus':
        // Create cactus texture
        // Dark green background
        this.ctx.fillStyle = '#1B5E20';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add vertical lines for cactus ribbing
        this.ctx.fillStyle = '#2E7D32';
        for (let i = 0; i < 8; i++) {
          this.ctx.fillRect(i * 8, 0, 3, this.canvas.height);
        }
        
        // Add thorns
        this.ctx.fillStyle = '#BDBDBD';
        for (let i = 0; i < 15; i++) {
          const x = Math.random() * this.canvas.width;
          const y = Math.random() * this.canvas.height;
          this.ctx.fillRect(x, y, 2, 2);
        }
        break;
        
      case 'glass':
        // Create glass texture - mostly transparent with subtle highlights
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set a very light blue tint
        this.ctx.fillStyle = 'rgba(224, 247, 250, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add some highlight lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1;
        
        // Horizontal and vertical highlights
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height / 3);
        this.ctx.lineTo(this.canvas.width, this.canvas.height / 3);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 3, 0);
        this.ctx.lineTo(this.canvas.width / 3, this.canvas.height);
        this.ctx.stroke();
        break;
        
      default:
        // Add some simple noise texture for all other blocks
        const darkColor = this.adjustColor(color, -20);
        this.ctx.fillStyle = darkColor;
        for (let i = 0; i < 100; i++) {
          const x = Math.random() * this.canvas.width;
          const y = Math.random() * this.canvas.height;
          const size = 1 + Math.random() * 2;
          this.ctx.fillRect(x, y, size, size);
        }
        break;
    }
    
    // Add a border to make blocks more visible
    this.ctx.strokeStyle = this.adjustColor(color, -30);
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Create a THREE.js texture from the canvas
    const texture = new THREE.CanvasTexture(this.canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter; // Pixelated look
    texture.minFilter = THREE.NearestFilter;
    
    return texture;
  }
  
  // Helper to adjust color brightness
  private adjustColor(color: string, amount: number): string {
    // Convert hex to RGB
    let r = parseInt(color.substring(1, 3), 16);
    let g = parseInt(color.substring(3, 5), 16);
    let b = parseInt(color.substring(5, 7), 16);
    
    // Adjust brightness
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  // Get a texture for a block type
  getTexture(blockType: BlockType): THREE.Texture | null {
    // Return stored texture if available
    if (this.textures.has(blockType)) {
      return this.textures.get(blockType)!;
    }
    
    // If not available, generate a procedural texture and store it
    console.warn(`No cached texture for ${blockType}, generating procedural texture`);
    try {
      const proceduralTexture = this.generateProceduralTexture(blockType);
      this.textures.set(blockType, proceduralTexture);
      return proceduralTexture;
    } catch (error) {
      console.error(`Failed to generate procedural texture for ${blockType}:`, error);
      return null;
    }
  }
}

// Create a singleton instance
export const textureManager = new TextureManager();