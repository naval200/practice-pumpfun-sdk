import { PublicKey } from "@solana/web3.js";

export const DEVNET_CONFIG = {
  // Solana Devnet RPC endpoints
  RPC_ENDPOINTS: {
    DEFAULT: "https://api.devnet.solana.com",
    HELIUS: "https://rpc-devnet.helius.xyz/?api-key=YOUR_API_KEY",
    QUICKNODE: "https://your-endpoint.solana-devnet.quiknode.pro/YOUR_API_KEY/",
  },
  
  // Devnet-specific program IDs (if different from mainnet)
  PROGRAM_IDS: {
    // Add any devnet-specific program IDs here if needed
  },
  
  // Devnet faucet information
  FAUCET: {
    URL: "https://faucet.solana.com/",
    DESCRIPTION: "Use Solana devnet faucet to get test SOL",
  },
  
  // Devnet-specific settings
  SETTINGS: {
    DEFAULT_COMMITMENT: "confirmed" as const,
    DEFAULT_SLIPPAGE: 500, // 5%
    MIN_SOL_BALANCE: 0.01, // Minimum SOL needed for transactions
    MIN_SOL_FOR_CREATION: 0.05, // Minimum SOL needed for token creation
  },
  
  // Useful devnet addresses for testing
  TEST_ADDRESSES: {
    // Add any known devnet token addresses for testing here
    EXAMPLE_TOKEN: "ExampleTokenMintAddressHere",
  }
};

export const getDevnetRpcUrl = (): string => {
  return process.env.DEVNET_RPC_URL || 
         process.env.HELIUS_DEVNET_RPC_URL || 
         DEVNET_CONFIG.RPC_ENDPOINTS.DEFAULT;
};

export const isDevnet = (rpcUrl: string): boolean => {
  return rpcUrl.includes("devnet") || rpcUrl.includes("testnet");
};
