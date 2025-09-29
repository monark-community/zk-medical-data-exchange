# Deploying StudyFactory to Sepolia Testnet

This guide walks you through deploying your StudyFactory contract to Sepolia testnet.

## Prerequisites

### 1. Get Sepolia ETH

You need test ETH for deployment. Get it from these faucets:

- **Alchemy Faucet**: https://sepoliafaucet.com/
- **Chainlink Faucet**: https://faucets.chain.link/sepolia
- **QuickNode Faucet**: https://faucet.quicknode.com/ethereum/sepolia

You'll need at least **0.05 ETH** for deployment.

### 2. Set Up Environment Variables

Create a `.env` file in the `packages/smart-contracts` directory:

```bash
# packages/smart-contracts/.env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
SEPOLIA_PRIVATE_KEY=your_private_key_here
```

**Getting RPC URL:**

1. Sign up at [Alchemy](https://www.alchemy.com/) (free)
2. Create a new app on Sepolia network
3. Copy the HTTP URL

**Getting Private Key:**

1. Export from MetaMask: Settings > Security & Privacy > Show Private Key
2. **⚠️ NEVER share or commit this key!**
3. **⚠️ Use a test wallet only!**

## Deployment Steps

### 1. Navigate to smart-contracts directory

```bash
cd packages/smart-contracts
```

### 2. Install dependencies (if not done)

```bash
bun install
```

### 3. Test deployment locally first

```bash
# Test on local network
bun hardhat run scripts/deployStudyFactory.ts
```

### 4. Deploy to Sepolia

```bash
# Deploy to Sepolia testnet
bun hardhat run scripts/deployStudyFactory.ts --network sepolia
```

## Expected Output

```
🚀 Deploying StudyFactory to Sepolia testnet...
============================================================

📋 Deployment Details:
   Network: Sepolia Testnet
   Chain ID: 11155111
   Deployer: 0x1234...5678
   Balance: 0.1234 ETH

🔄 Step 1: Deploying MedicalEligibilityVerifier...
   ✅ Verifier deployed: 0xabcd...ef12

🔄 Step 2: Deploying StudyFactory...
   ✅ StudyFactory deployed: 0x5678...9abc

🔧 Step 3: Initial Configuration...
   StudyFactory deployed with default configuration
   ✅ Ready for study creation

============================================================
🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!

📋 Contract Addresses:
   MedicalEligibilityVerifier: 0xabcd...ef12
   StudyFactory: 0x5678...9abc

🔗 Verification Links:
   Verifier: https://sepolia.etherscan.io/address/0xabcd...ef12
   StudyFactory: https://sepolia.etherscan.io/address/0x5678...9abc
```

## After Deployment

### 1. Update Your App Configuration

Add the deployed addresses to your app config:

```typescript
// apps/web/config/config.ts or similar
export const CONTRACTS = {
  sepolia: {
    StudyFactory: "0x5678...9abc", // Your deployed address
    MedicalEligibilityVerifier: "0xabcd...ef12",
  },
};
```

### 2. Verify Contracts (Optional)

If you want to verify on Etherscan:

```bash
# Install hardhat-verify plugin (if not already)
bun add --dev @nomicfoundation/hardhat-verify

# Verify StudyFactory
bunx hardhat verify --network sepolia YOUR_STUDYFACTORY_ADDRESS

# Verify Verifier
bunx hardhat verify --network sepolia YOUR_VERIFIER_ADDRESS
```

### 3. Test Creating a Study

Use your frontend or write a test script to create a study and make sure everything works.

## Troubleshooting

### "Insufficient funds" error

- Check your wallet balance
- Get more Sepolia ETH from faucets

### "Invalid private key" error

- Make sure private key is correct (starts with 0x)
- Use a test wallet, not your main one

### "Network not found" error

- Check your RPC URL is correct
- Make sure you have internet connection

### "Contract creation failed" error

- Check if contracts compile: `bunx hardhat compile`
- Make sure you have enough gas

## Security Notes

⚠️ **IMPORTANT SECURITY REMINDERS:**

1. **Never use mainnet private keys** for testnet deployment
2. **Never commit private keys** to version control
3. **Use environment variables** for sensitive data
4. **Keep your .env file** in .gitignore
5. **Use a dedicated test wallet** with minimal funds

## Gas Costs

Typical deployment costs on Sepolia:

- **MedicalEligibilityVerifier**: ~2,000,000 gas
- **StudyFactory**: ~3,000,000 gas
- **Total**: ~0.01-0.02 ETH (depending on gas price)

## Next Steps

After successful deployment:

1. ✅ Contracts deployed to Sepolia
2. ✅ Addresses saved and verified
3. 🔄 Update frontend configuration
4. 🔄 Test study creation from UI
5. 🔄 Test ZK proof verification
6. 🚀 Ready for production!
