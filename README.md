# Cura

A collaborative Web3 project that empowers patients to control their medical data and enable ethical, secure research.

---

## Requirements

If not done yet, instal bun
https://bun.sh/

To install dependencies:

```bash
bun install
```

#### Node version
#### v22.7.1

## 🚀 Scripts

These scripts are available from the **root** of the repository.

### Development

```bash
bun run dev:web          # Start Next.js frontend
bun run dev:api          # Start backend API
# Requires env variables set (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB)
bun run infra            # Start local infrastructure (DB, clickhouse, adminer)

# Deploy a contract to local chain
bun run deploy:contracts:local -- <contract>
# Example use : bun run deploy:contracts:local -- ignition/modules/Counter.ts

# Deploy a contract to Sepolia testnet
bun run deploy:contracts:sepolia -- <contract>
# Example use : bun run deploy:contracts:sepolia -- ignition/modules/Counter.ts

bun run lint           # Lint entire monorepo
bun run lint:web       # Lint frontend only
bun run lint:api       # Lint api only

bun run test:contracts             # Run all contract tests
bun run test:contracts:solidity    # Run Solidity tests only
bun run test:contracts:nodejs      # Run Node.js integration tests only
```

