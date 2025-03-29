# Voxel Sandbox Game

A Minecraft-inspired voxel-based sandbox game built with React, TypeScript, and Three.js.

## Features

- Procedurally generated world with diverse biomes
- First-person and third-person camera modes
- Block placement and mining with proper physics
- Realistic weather system (rain, snow, thunderstorms)
- Day/night cycle with appropriate lighting
- Creature AI with flocking behavior
- Inventory and crafting system
- Skill progression system
- Mobile-friendly controls

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/voxel-sandbox-game.git
cd voxel-sandbox-game
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser to `http://localhost:5000`

## Controls

- WASD: Movement
- Space: Jump
- Shift: Sprint
- Left Click: Break blocks
- Right Click: Place blocks
- F: Attack
- V: Toggle camera view (first/third person)
- 1-9: Select inventory slot
- E: Open inventory
- C: Open crafting menu
- F3: Toggle debug mode

## Technologies Used

- React & TypeScript for UI and game logic
- Three.js for 3D rendering
- React Three Fiber as a React wrapper for Three.js
- Zustand for state management
- Express for the backend server

## Project Structure

- `/client`: Frontend code
  - `/public`: Static assets like models and textures
  - `/src`: Source code
    - `/components`: UI and game components
    - `/lib`: Game logic, stores, and utilities
- `/server`: Backend code
- `/shared`: Code shared between frontend and backend

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Minecraft and other voxel-based games
- Built with Replit