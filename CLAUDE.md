# Claude Code Instructions for Golem Runner

## Project Overview

**Golem Runner** is a Web3 endless runner game built for the Starknet Hackathon: Re{ignite}. It's a mobile-first PWA where players control elemental golems racing through mystical realms, featuring on-chain infrastructure powered by Starknet and Dojo Engine.

### Key Features
- Mobile-optimized endless runner with tap/swipe mechanics
- Unlockable elemental golems (Stone, Crystal, Lava, Ice, Mossy)
- Multiple elemental environments (Forest, Ice, Volcano)
- On-chain leaderboards and achievements
- In-game shop with coin economy
- AI Agent integration for dynamic missions
- PWA support for mobile installation
- Cartridge Controller for wallet integration

## Tech Stack

### Frontend (`/client`)
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.14
- **Styling**: Tailwind CSS 3.4.17 with custom design system
- **State Management**: Zustand 4.5.6 with persistence
- **Router**: React Router DOM 7.6.0
- **Animation**: Framer Motion 12.10.5, React Spring 9.7.3
- **Web3**: Starknet 6.11.0, Starknet React 3.5.0
- **PWA**: Vite PWA plugin with custom manifest
- **Database**: Dexie 4.0.11 (IndexedDB)
- **Analytics**: PostHog for user tracking

### Smart Contracts (`/contract`)
- **Language**: Cairo 2.9.2
- **Framework**: Dojo Engine 1.2.1
- **Network**: Starknet Sepolia testnet
- **Achievements**: Cartridge Arcade integration

### Development Tools
- **Linting**: ESLint 9.20.0 with TypeScript ESLint
- **Formatting**: Prettier + Biome.js
- **Package Manager**: pnpm (evidenced by pnpm-lock.yaml)

## Architecture

### Project Structure
```
GolemRunner/
├── client/                    # React frontend
│   ├── src/
│   │   ├── app/              # Main app component and layout
│   │   ├── components/       # React components
│   │   │   ├── layout/       # Navigation components
│   │   │   ├── screens/      # Main screen components
│   │   │   ├── shared/       # Reusable components
│   │   │   └── types/        # TypeScript type definitions
│   │   ├── assets/           # Game assets (WebP optimized)
│   │   ├── config/           # Configuration files
│   │   ├── constants/        # Game constants and data
│   │   ├── context/          # React contexts
│   │   ├── dojo/             # Dojo/Starknet integration
│   │   ├── services/         # External services (AI, DB)
│   │   ├── utils/            # Utility functions
│   │   └── zustand/          # Global state management
│   └── public/               # Static assets
└── contract/                 # Cairo smart contracts
    └── src/
        ├── achievements/     # Achievement system
        ├── helpers/          # Utility functions
        ├── models/           # Data models
        ├── systems/          # Game logic
        ├── tests/            # Contract tests
        └── types/            # Type definitions
```

### Key Architectural Patterns

1. **Screen-Based Navigation**: Single-page app with screen components for different game states
2. **Global State Management**: Zustand store with persistence for game state
3. **Dojo Integration**: Custom hooks for blockchain interactions
4. **Component Composition**: Modular, reusable React components
5. **Asset Optimization**: WebP images with conversion scripts
6. **PWA Architecture**: Service worker and manifest for mobile installation

### State Management
- **Global Store**: Zustand with persistence (`/client/src/zustand/store.ts`)
- **Persisted Data**: Player data, golems, worlds, current selections
- **Runtime State**: UI state, loading states, errors
- **Mission System**: Dynamic missions with AI integration

### Web3 Integration
- **Cartridge Controller**: Wallet connection and authentication
- **Dojo SDK**: Blockchain state synchronization
- **Custom Hooks**: Abstracted contract interactions in `/client/src/dojo/hooks/`
- **GraphQL**: Torii client for blockchain data querying

## Available Scripts

### Development
```bash
cd client
pnpm dev              # Start dev server (HTTP)
pnpm dev:https        # Start dev server (HTTPS with certs)
pnpm dev:http         # Force HTTP mode
```

### Building & Deployment
```bash
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm preview:https    # Preview with HTTPS
```

### Code Quality
```bash
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier
pnpm format:check     # Check formatting
```

### Smart Contracts
```bash
cd contract
scarb build           # Build contracts
scarb test            # Run tests
sozo --profile sepolia migrate  # Deploy to Sepolia
```

## Configuration Files

### Key Config Files
- **`vite.config.ts`**: Vite configuration with PWA, WASM, and HTTPS setup
- **`tailwind.config.js`**: Custom design system with game-specific colors
- **`tsconfig.json`**: TypeScript configuration with project references
- **`eslint.config.js`**: ESLint rules for React and TypeScript
- **`biome.json`**: Biome formatter and linter configuration
- **`Scarb.toml`**: Cairo project configuration with Dojo dependencies

### Environment Variables
Located in client `.env` files (not in repo):
- `VITE_PUBLIC_NODE_URL`: Starknet RPC endpoint
- `VITE_PUBLIC_TORII`: Torii indexer URL
- `VITE_PUBLIC_MASTER_ADDRESS`: Contract master address
- `VITE_PUBLIC_MASTER_PRIVATE_KEY`: Master private key
- `VITE_ELIZA_URL`: AI agent service endpoint
- `VITE_LOCAL_HTTPS`: Enable HTTPS in development

## Testing Strategy

### Current Setup
- **Smart Contracts**: Cairo tests in `/contract/src/tests/`
- **Frontend**: No test files currently configured
- **Manual Testing**: Game functionality testing through UI

### Test Coverage Areas
- Player management and progression
- Golem unlocking and selection
- World/map functionality
- Ranking system
- Mission system with AI integration

## Coding Standards

### TypeScript Guidelines
- Strict TypeScript configuration
- Explicit type definitions in `/components/types/`
- Interface-first design for data models
- Proper error handling with try/catch blocks

### React Patterns
- Functional components with hooks
- Custom hooks for business logic
- Context providers for cross-cutting concerns
- Component composition over inheritance

### Styling Conventions
- Tailwind CSS utility classes
- Custom design tokens in `tailwind.config.js`
- Responsive-first design
- Mobile-optimized layouts

### Code Formatting
- 4-space indentation
- Double quotes for strings
- Semicolons required
- Line width: 80 characters
- LF line endings

## Key Dependencies & Integrations

### Blockchain
- **Dojo Engine**: Full-stack framework for autonomous worlds
- **Starknet React**: React hooks for Starknet integration
- **Cartridge Controller**: Gaming-focused wallet solution

### Game Development
- **Canvas API**: Custom game engine for endless runner mechanics
- **Web Audio API**: Sound management through AudioManager
- **RequestAnimationFrame**: Game loop and animations

### UI/UX
- **React Slick**: Carousel components for golems and maps
- **Lucide React**: Icon library
- **React Hot Toast**: Notification system
- **React Use Gesture**: Touch/gesture handling

### Performance
- **WebP Images**: Optimized asset format
- **Service Worker**: Caching and offline support
- **Dynamic Imports**: Code splitting for better loading

## Development Guidelines

### When Working on This Codebase

1. **File Paths**: Always use absolute paths when referencing files
2. **State Updates**: Use Zustand actions for global state changes
3. **Blockchain Interactions**: Use existing hooks in `/dojo/hooks/`
4. **Asset Management**: Use WebP format, place in appropriate `/assets/` subdirectories
5. **Component Structure**: Follow existing patterns in `/components/screens/`
6. **Error Handling**: Implement proper error boundaries and user feedback

### Common Tasks

1. **Adding New Screens**: Create in `/components/screens/`, update navigation in `App.tsx`
2. **New Game Features**: Update game types in `/components/types/game.ts`
3. **Blockchain Models**: Add to `/contract/src/models/` and regenerate bindings
4. **UI Components**: Place in appropriate subdirectory of `/components/`
5. **Asset Addition**: Convert to WebP, organize by category in `/assets/`

### Performance Considerations

1. **Mobile-First**: Always test on mobile devices
2. **Bundle Size**: Monitor build output, use dynamic imports for large features
3. **Image Optimization**: Use WebP conversion scripts in `/scripts/`
4. **State Persistence**: Be mindful of localStorage usage in Zustand store

## Deployment

### Current Deployment
- **Platform**: Railway (evidenced by live URL)
- **Domain**: https://golemrunner.live/
- **Network**: Starknet Sepolia testnet

### Build Process
1. TypeScript compilation
2. Vite bundling with optimizations
3. PWA manifest and service worker generation
4. Asset optimization and caching headers

This codebase represents a sophisticated Web3 gaming application with careful attention to mobile UX, blockchain integration, and modern React development practices.