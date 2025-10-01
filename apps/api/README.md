# ZK Medical Data Exchange - Backend API

Node.js/Express backend API for the privacy-preserving medical research platform.

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# API available at http://localhost:3001
```

## 🏗️ Architecture

### Core Features

- **RESTful API Design** - Clean, conventional endpoints
- **Study Management** - CRUD operations for medical studies
- **FHIR Integration** - Medical data processing
- **Blockchain Integration** - Smart contract deployment
- **Database Layer** - PostgreSQL + ClickHouse

### API Endpoints

```
POST   /studies                    # Create study
GET    /studies                    # List studies
GET    /studies/:id                # Get study details
POST   /studies/:id/deployment     # Deploy to blockchain
POST   /studies/:id/participants   # Add participant
```

### Project Structure

```
src/
├── controllers/
│   ├── studyController.ts      # Study business logic
│   └── medicalDataController.ts
├── routes/
│   ├── index.ts               # Route configuration
│   └── medicalData.ts
├── middleware/
│   ├── apiKeyMiddleware.ts    # Authentication
│   └── tokenValidationMiddleware.ts
├── config/
│   └── config.ts              # Environment configuration
└── utils/
    └── ...                    # Utility functions
```

## 🛠️ Development

```bash
# Start with database
bun run infra                  # Start PostgreSQL + ClickHouse
bun run dev                    # Start API server

# Testing
bun run test                   # Run API tests

# Type checking
npx tsc --noEmit
```

## 🔗 Dependencies

- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **ClickHouse** - Analytics database
- **Ethers.js** - Blockchain integration
- **TypeScript** - Type safety

## 📚 Recent Updates

- ✅ RESTful endpoint design
- ✅ Improved error handling
- ✅ TypeScript type safety
- ✅ Consolidated service architecture
