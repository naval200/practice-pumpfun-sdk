# PumpFun Token Buyer - Devnet Edition

A TypeScript program to buy and create tokens using the PumpFun SDK on Solana devnet.

## 🚨 Important Notice

**This software is for development and testing purposes only. It operates on Solana devnet, not mainnet. Never use real funds or production wallets with this software.**

## 🏗️ Project Structure

```
using-pumpfun-sdk/
├── src/
│   ├── config/
│   │   └── devnet.ts          # Devnet configuration
│   ├── utils/
│   │   ├── wallet.ts          # Wallet management utilities
│   │   └── provider.ts        # Solana provider utilities
│   ├── buy-tokens.ts          # Main program for buying existing tokens
│   └── create-and-buy.ts      # Program for creating and buying new tokens
├── wallets/                    # Wallet files (private keys)
├── package.json               # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── env.example               # Environment variables template
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Copy the environment template and configure your devnet RPC endpoint:

```bash
cp env.example .env
```

Edit `.env` and set your devnet RPC URL:

```bash
# Solana Devnet RPC URL (required)
DEVNET_RPC_URL=https://api.devnet.solana.com

# Alternative: Use Helius devnet (faster, requires API key)
# HELIUS_DEVNET_RPC_URL=https://rpc-devnet.helius.xyz/?api-key=YOUR_API_KEY

# Optional: Custom commitment level
COMMITMENT=confirmed

# Optional: Priority fee in lamports
PRIORITY_FEE=1000
```

### 3. Get Devnet SOL

Before running the program, you need devnet SOL in your wallet:

1. Visit the [Solana Devnet Faucet](https://faucet.solana.com/)
2. Enter your wallet's public key
3. Request SOL (recommend 2-5 SOL for testing)

### 4. Run the Programs

#### Buy Existing Tokens

```bash
npm run buy
```

#### Create and Buy New Tokens

```bash
npm run create-buy
```

## 🔧 Configuration

### Devnet Settings

The program is configured for Solana devnet by default:

- **RPC Endpoint**: `https://api.devnet.solana.com`
- **Network**: Devnet (test network)
- **Minimum Balance**: 0.01 SOL for transactions, 0.05 SOL for token creation
- **Default Slippage**: 5% (500 basis points)

### Wallet Management

The program automatically detects and loads wallets from the `wallets/` folder:

- `trading-wallet.json` - Primary trading wallet
- `test-wallet.json` - Test wallet
- `trading-private_key.txt` - Alternative private key format
- `test-private_key.txt` - Alternative private key format

## 📝 Usage Examples

### Example 1: Buy Existing Tokens

```typescript
import { TokenBuyer } from './src/buy-tokens';

const buyer = new TokenBuyer();
await buyer.initializeSDK("trading");

await buyer.buyTokens({
  mintAddress: "YOUR_TOKEN_MINT_ADDRESS",
  buyAmountSol: 0.01,
  slippageBasisPoints: 500, // 5%
  walletType: "trading"
});
```

### Example 2: Create and Buy New Token

```typescript
import { TokenCreator } from './src/create-and-buy';

const creator = new TokenCreator();
await creator.initializeSDK("trading");

await creator.createAndBuyToken({
  tokenName: "My Awesome Token",
  tokenSymbol: "MAT",
  buyAmountSol: 0.01,
  slippageBasisPoints: 500, // 5%
  walletType: "trading"
});
```

## 🛡️ Safety Features

- **Devnet Only**: Configured to use Solana devnet by default
- **Balance Checks**: Warns if wallet balance is too low
- **Transaction Confirmation**: Waits for transaction confirmation
- **Error Handling**: Comprehensive error handling and logging
- **Wallet Validation**: Validates wallet files before use

## ⚠️ Important Warnings

1. **Never use real wallets or mainnet** - This is for devnet testing only
2. **Keep private keys secure** - Don't share or commit wallet files
3. **Test thoroughly** - Always test with small amounts first
4. **Understand the risks** - DeFi protocols can have bugs and risks

## 🔍 Troubleshooting

### Common Issues

1. **"Wallet file not found"**
   - Ensure wallet files exist in the `wallets/` folder
   - Check file permissions

2. **"Low balance" warnings**
   - Use the devnet faucet to get test SOL
   - Ensure you have at least 0.05 SOL for token creation

3. **"Token not found on Pump.fun"**
   - Verify the token mint address is correct
   - Ensure the token exists on devnet

4. **RPC connection issues**
   - Check your internet connection
   - Try using a different RPC endpoint
   - Verify the RPC URL in your `.env` file

### Getting Help

- Check the [PumpFun SDK documentation](https://github.com/rckprtr/pumpdotfun-sdk)
- Review Solana devnet documentation
- Ensure you're using the latest version of dependencies

## 📚 Additional Resources

- [Solana Devnet Documentation](https://docs.solana.com/clusters/devnet)
- [PumpFun Protocol](https://pump.fun)
- [Solana Web3.js Documentation](https://docs.solana.com/developing/clients/javascript-api)
- [Anchor Framework](https://www.anchor-lang.com/)

## 🏗️ Development

### Building the Project

```bash
npm run build
```

### Running in Development Mode

```bash
npm run dev
```

### TypeScript Compilation

```bash
npx tsc
```

## 📄 License

This project is licensed under the MIT License.

## ⚖️ Disclaimer

This software is provided "as is," without warranty of any kind. Use at your own risk. The authors take no responsibility for any harm or damage caused by the use of this software.

**Remember: This is for devnet testing only. Never use real funds or production wallets.**
