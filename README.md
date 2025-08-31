# Cura

A collaborative Web3 project that empowers patients to control their medical data and enable ethical, secure research.

---

## How to install

If not done yet, instal bun
https://bun.sh/

To install dependencies:

```bash
bun install
```

## 📦 Project Structure

zk-medical-data-exchange/
├── apps/
│ ├── demo/ # Base website design
│ ├── web/ # Next.js frontend (shadcn-ui, TailwindCSS)
│ └── api/ # Express backend
├── packages/
│ ├── smart-contracts/ # Solidity contracts + deployment scripts
│ └── subgraph/ # TheGraph
├── infra/ # Dockerized infra (Postgres, ClickHouse, Adminer)
└── README.md # You are here

---

## 🚀 Scripts

These scripts are available from the **root** of the repository.

### Development

```bash
bun run dev:web          # Start Next.js frontend
bun run dev:api          # Start backend API
bun run infra            # Start local infrastructure (DB, clickhouse, adminer)

bun run deploy:contracts:local     # Deploy contracts to local chain
bun run deploy:contracts:sepolia   # Deploy contracts to Sepolia testnet

bun run lint           # Lint entire monorepo
bun run lint:web       # Lint frontend only
bun run lint:api       # Lint api only

bun run test:contracts             # Run all contract tests
bun run test:contracts:solidity    # Run Solidity tests only
bun run test:contracts:nodejs      # Run Node.js integration tests only

bun run infra # Start postgres, clickhouse, adminer
```

