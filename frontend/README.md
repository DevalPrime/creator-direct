# CreatorDirect Frontend

A professional React + TypeScript frontend for the CreatorDirect decentralized subscription platform.

## Features

- 🎨 Modern, responsive UI built with React 18
- 🔐 Polkadot.js wallet integration
- 📦 TypeScript for type safety
- 🎯 ESLint + Prettier for code quality
- ⚡ Vite for fast development and optimized builds
- 🧩 Component-based architecture
- 🪝 Custom React hooks for business logic
- 🎭 Toast notifications for user feedback
- 📱 Mobile-responsive design

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Next-generation frontend tooling
- **Polkadot.js** - Blockchain interaction
- **ESLint + Prettier** - Code quality and formatting

## Development

### Prerequisites

- Node.js 20.19.5 or higher (see `.nvmrc`)
- npm 10.8.2 or higher

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## Project Structure

```
src/
├── components/       # Reusable UI components
├── hooks/           # Custom React hooks
├── types.ts         # TypeScript type definitions
├── constants.ts     # Application constants
├── utils.ts         # Utility functions
├── App.tsx          # Main application component
├── main.tsx         # Application entry point
└── styles.css       # Global styles
```

## Environment Variables

Copy `.env.example` to `.env.local` and adjust values:

```env
VITE_SHIBUYA_WS=wss://rpc.shibuya.astar.network
VITE_APP_NAME=CreatorDirect
VITE_BLOCK_TIME_MS=12000
```

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory, ready for deployment to any static hosting service.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Polkadot.js browser extension required for wallet functionality

## License

MIT
