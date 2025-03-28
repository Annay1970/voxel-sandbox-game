import * as THREE from 'three';
import { BlockType } from '../blocks';

// Class to manage block textures
export class TextureManager {
  private static instance: TextureManager;
  private loader: THREE.TextureLoader;
  private textures: Map<BlockType, THREE.Texture>;
  private isLoading: boolean = false;
  private loadPromise: Promise<void> = Promise.resolve();

  private constructor() {
    this.loader = new THREE.TextureLoader();
    this.textures = new Map();
  }

  public static getInstance(): TextureManager {
    if (!TextureManager.instance) {
      TextureManager.instance = new TextureManager();
    }
    return TextureManager.instance;
  }

  public async loadTextures(): Promise<void> {
    if (this.isLoading) return this.loadPromise;
    
    this.isLoading = true;
    
    // Create a new promise for loading
    this.loadPromise = new Promise(async (resolve) => {
      console.log('Loading block textures...');
      
      // Try to load textures from files first
      const textureFiles: Record<BlockType, string> = {
        'air': '',  // Air has no texture
        'grass': '/textures/grass.png',
        'dirt': '/textures/dirt.png',
        'stone': '/textures/stone.png',
        'sand': '/textures/sand.png',
        'wood': '/textures/wood.png',
        'leaves': '/textures/leaves.png',
        'water': '/textures/water.png',
        'log': '/textures/log.png',
        'stick': '/textures/stick.png',
        'craftingTable': '/textures/crafting_table.png',
        'woodenPickaxe': '/textures/wooden_pickaxe.png',
        'stonePickaxe': '/textures/stone_pickaxe.png',
        'woodenAxe': '/textures/wooden_axe.png',
        'woodenShovel': '/textures/wooden_shovel.png',
        'coal': '/textures/coal.png',
        'torch': '/textures/torch.png'
      };
      
      // Load all textures (or create fallbacks)
      const blockTypes = Object.keys(textureFiles) as BlockType[];
      
      for (const type of blockTypes) {
        // Skip air (no texture)
        if (type === 'air') continue;
        
        const texturePath = textureFiles[type];
        
        try {
          if (texturePath) {
            // Try to load the texture file
            const texture = await this.loadTexture(texturePath);
            this.textures.set(type, texture);
            console.log(`Loaded texture for ${type}`);
          } else {
            // Create a procedural texture
            const texture = this.createProceduralTexture(type);
            this.textures.set(type, texture);
            console.log(`Created procedural texture for ${type}`);
          }
        } catch (error) {
          console.warn(`Failed to load texture for ${type}, creating procedural texture`);
          // Create a fallback procedural texture
          const texture = this.createProceduralTexture(type);
          this.textures.set(type, texture);
        }
      }
      
      console.log('All block textures loaded!');
      this.isLoading = false;
      resolve();
    });
    
    return this.loadPromise;
  }

  private loadTexture(path: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        texture => {
          texture.magFilter = THREE.NearestFilter;  // Pixelated look (Minecraft-style)
          texture.minFilter = THREE.NearestFilter;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          resolve(texture);
        },
        undefined,
        error => reject(error)
      );
    });
  }

  private createProceduralTexture(type: BlockType): THREE.Texture {
    // Create a canvas to draw the texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas 2D context');
    }
    
    // Define colors for each block type
    const colors: Record<BlockType, string> = {
      'air': 'rgba(255, 255, 255, 0)',
      'grass': '#2b7a22',
      'dirt': '#8B4513',
      'stone': '#888888',
      'sand': '#e0c080',
      'wood': '#966F33',
      'leaves': '#2e5e20',
      'water': '#2080e0',
      'log': '#6e4b28',
      'stick': '#8B6914',
      'craftingTable': '#7A5230',
      'woodenPickaxe': '#A47449',
      'stonePickaxe': '#707070',
      'woodenAxe': '#A47449',
      'woodenShovel': '#A47449',
      'coal': '#222222',
      'torch': '#FFA500'
    };
    
    // Set base color
    ctx.fillStyle = colors[type] || '#FF00FF';
    ctx.fillRect(0, 0, 64, 64);
    
    // Add texture details based on block type
    switch (type) {
      case 'grass':
        // Add grass blades
        ctx.fillStyle = '#3c8c30';
        for (let i = 0; i < 20; i++) {
          const x = Math.random() * 64;
          const y = Math.random() * 20;
          ctx.fillRect(x, y, 2, 4);
        }
        // Dirt edge on bottom
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 48, 64, 16);
        break;
        
      case 'dirt':
        // Add texture spots
        ctx.fillStyle = '#6B3305';
        for (let i = 0; i < 40; i++) {
          const x = Math.random() * 64;
          const y = Math.random() * 64;
          const size = 2 + Math.random() * 4;
          ctx.fillRect(x, y, size, size);
        }
        break;
        
      case 'stone':
        // Add cracks and variations
        ctx.fillStyle = '#777777';
        for (let i = 0; i < 20; i++) {
          const x = Math.random() * 64;
          const y = Math.random() * 64;
          const size = 3 + Math.random() * 6;
          ctx.fillRect(x, y, size, size);
        }
        ctx.fillStyle = '#999999';
        for (let i = 0; i < 10; i++) {
          const x = Math.random() * 64;
          const y = Math.random() * 64;
          const size = 2 + Math.random() * 3;
          ctx.fillRect(x, y, size, size);
        }
        break;
        
      case 'sand':
        // Add small grains
        ctx.fillStyle = '#d6b978';
        for (let i = 0; i < 80; i++) {
          const x = Math.random() * 64;
          const y = Math.random() * 64;
          const size = 1 + Math.random() * 2;
          ctx.fillRect(x, y, size, size);
        }
        break;
        
      case 'wood':
        // Add wood grain
        ctx.fillStyle = '#7A5230';
        for (let i = 0; i < 10; i++) {
          ctx.fillRect(0, i * 7, 64, 3);
        }
        break;
        
      case 'leaves':
        // Add leaf details
        ctx.fillStyle = '#1e4010';
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * 64;
          const y = Math.random() * 64;
          const size = 2 + Math.random() * 6;
          ctx.fillRect(x, y, size, size);
        }
        // Add some berries/flowers
        ctx.fillStyle = '#cc0000';
        for (let i = 0; i < 5; i++) {
          const x = Math.random() * 64;
          const y = Math.random() * 64;
          const size = 2 + Math.random() * 2;
          ctx.fillRect(x, y, size, size);
        }
        break;
        
      case 'water':
        // Add water ripples
        ctx.fillStyle = '#1070c0';
        for (let i = 0; i < 5; i++) {
          const y = 10 + i * 10;
          ctx.fillRect(0, y, 64, 3);
        }
        break;
        
      case 'log':
        // Create tree rings
        ctx.fillStyle = '#5D3920';
        ctx.fillRect(0, 0, 64, 64);
        
        ctx.fillStyle = '#8B6914';
        ctx.beginPath();
        ctx.arc(32, 32, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#6e4b28';
        ctx.beginPath();
        ctx.arc(32, 32, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#8B6914';
        ctx.beginPath();
        ctx.arc(32, 32, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#6e4b28';
        ctx.beginPath();
        ctx.arc(32, 32, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'craftingTable':
        // Create crafting table with grid
        ctx.fillStyle = '#7A5230';
        ctx.fillRect(0, 0, 64, 64);
        
        // Draw grid lines
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, 21);
        ctx.lineTo(64, 21);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, 42);
        ctx.lineTo(64, 42);
        ctx.stroke();
        
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(21, 0);
        ctx.lineTo(21, 64);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(42, 0);
        ctx.lineTo(42, 64);
        ctx.stroke();
        break;
        
      case 'coal':
        // Add shiny spots
        ctx.fillStyle = '#333333';
        for (let i = 0; i < 20; i++) {
          const x = Math.random() * 64;
          const y = Math.random() * 64;
          const size = 2 + Math.random() * 4;
          ctx.fillRect(x, y, size, size);
        }
        break;
        
      case 'torch':
        // Create torch with flame
        // Stick
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(24, 16, 16, 48);
        
        // Flame
        ctx.fillStyle = '#FFA500'; // Orange
        ctx.beginPath();
        ctx.arc(32, 12, 16, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFF00'; // Yellow core
        ctx.beginPath();
        ctx.arc(32, 12, 8, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      // Add more cases for other block types
      
      default:
        // Create a grid pattern for unknown blocks
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        
        // Draw grid
        for (let i = 0; i < 64; i += 16) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(64, i);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 64);
          ctx.stroke();
        }
        
        // Draw question mark
        ctx.fillStyle = '#000000';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 32, 32);
        break;
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;  // Pixelated look (Minecraft-style)
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }

  public getTexture(type: BlockType): THREE.Texture | undefined {
    return this.textures.get(type);
  }

  public areTexturesLoaded(): boolean {
    return !this.isLoading;
  }

  public getLoadPromise(): Promise<void> {
    return this.loadPromise;
  }
}

// Singleton instance
export const textureManager = TextureManager.getInstance();