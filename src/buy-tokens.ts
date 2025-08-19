import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { PumpFunSDK } from "pumpdotfun-sdk";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { WalletManager } from "./utils/wallet";
import { ProviderManager } from "./utils/provider";
import { DEVNET_CONFIG } from "./config/devnet";

interface BuyTokensConfig {
  mintAddress: string;
  buyAmountSol: number;
  slippageBasisPoints?: number;
  walletType?: "trading";
}

class TokenBuyer {
  private walletManager: WalletManager;
  private providerManager: ProviderManager;
  private sdk: PumpFunSDK | null = null;

  constructor() {
    this.walletManager = new WalletManager();
    this.providerManager = new ProviderManager();
  }

  /**
   * Initialize the PumpFun SDK
   */
  async initializeSDK(walletType: "trading" | "test" = "trading"): Promise<void> {
    try {
      console.log("🚀 Initializing PumpFun SDK...");
      
      // Load wallet
      const wallet = walletType === "trading" 
        ? this.walletManager.loadTradingWallet()
        : this.walletManager.loadTestWallet();
      
      const walletInfo = this.walletManager.getWalletInfo(wallet);
      console.log(`   Wallet: ${walletInfo.publicKey}`);
      
      // Create provider
      const nodeWallet = new NodeWallet(wallet);
      const provider = this.providerManager.createProvider(nodeWallet);
      
      // Print configuration
      this.providerManager.printConfig();
      
      // Initialize SDK
      this.sdk = new PumpFunSDK(provider);
      console.log("✅ PumpFun SDK initialized successfully");
      
      // Check wallet balance
      await this.checkWalletBalance(wallet);
      
    } catch (error) {
      console.error("❌ Failed to initialize SDK:", error);
      throw error;
    }
  }

  /**
   * Check wallet balance
   */
  async checkWalletBalance(wallet: Keypair): Promise<void> {
    if (!this.sdk) {
      throw new Error("SDK not initialized");
    }

    const connection = this.sdk.connection;
    const balance = await connection.getBalance(wallet.publicKey);
    const balanceSol = balance / LAMPORTS_PER_SOL;
    
    console.log(`💰 Wallet Balance: ${balanceSol.toFixed(4)} SOL`);
    
    if (balanceSol < DEVNET_CONFIG.SETTINGS.MIN_SOL_BALANCE) {
      console.log(`⚠️  Warning: Low balance. You need at least ${DEVNET_CONFIG.SETTINGS.MIN_SOL_BALANCE} SOL for transactions.`);
      console.log(`💡 Use the devnet faucet: ${DEVNET_CONFIG.FAUCET.URL}`);
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(mintAddress: string): Promise<void> {
    if (!this.sdk) {
      throw new Error("SDK not initialized");
    }

    try {
      const mint = new PublicKey(mintAddress);
      console.log(`🔍 Getting token information for: ${mintAddress}`);
      
      // Get bonding curve account
      const bondingCurveAccount = await this.sdk.getBondingCurveAccount(mint);
      
      if (bondingCurveAccount) {
        console.log("✅ Token found on Pump.fun");
        console.log(`   Supply: ${bondingCurveAccount.virtualTokenReserves.toString()}`);
        console.log(`   Reserve: ${bondingCurveAccount.virtualSolReserves.toString()} SOL`);
        console.log(`   Buy Price: ${bondingCurveAccount.getBuyPrice(BigInt(1000)).toString()} SOL`);
        console.log(`   Sell Price: ${bondingCurveAccount.getSellPrice(BigInt(1000), BigInt(100)).toString()} SOL`);
      } else {
        console.log("❌ Token not found on Pump.fun");
        console.log("   This token may not exist or may not be listed on Pump.fun");
      }
      
    } catch (error) {
      console.error("❌ Error getting token info:", error);
      throw error;
    }
  }

  /**
   * Buy tokens
   */
  async buyTokens(config: BuyTokensConfig): Promise<void> {
    if (!this.sdk) {
      throw new Error("SDK not initialized");
    }

    try {
      const { mintAddress, buyAmountSol, slippageBasisPoints = 500, walletType = "trading" } = config;
      
      // Load wallet
      const wallet = walletType === "trading" 
        ? this.walletManager.loadTradingWallet()
        : this.walletManager.loadTestWallet();
      
      const mint = new PublicKey(mintAddress);
      const buyAmountLamports = BigInt(Math.floor(buyAmountSol * LAMPORTS_PER_SOL));
      
      console.log(`🛒 Buying tokens...`);
      console.log(`   Token: ${mintAddress}`);
      console.log(`   Amount: ${buyAmountSol} SOL`);
      console.log(`   Slippage: ${slippageBasisPoints / 100}%`);
      console.log(`   Wallet: ${wallet.publicKey.toBase58()}`);
      
      // Get token info first
      await this.getTokenInfo(mintAddress);
      
      // Check if token exists
      const bondingCurveAccount = await this.sdk.getBondingCurveAccount(mint);
      if (!bondingCurveAccount) {
        throw new Error("Token not found on Pump.fun. Cannot buy.");
      }

      // Execute buy transaction with priority fees
      console.log("📝 Executing buy transaction with priority fees...");
      const priorityFees = {
        unitLimit: 250000,
        unitPrice: 250000,
      };
      
      const result = await this.sdk.buy(
        wallet,
        mint,
        buyAmountLamports,
        BigInt(slippageBasisPoints),
        priorityFees
      );
      
      if (!result.success) {
        throw new Error(`Buy failed: ${result.error || 'Unknown error'}`);
      }
      
      console.log("✅ Buy transaction successful!");
      console.log(`   Transaction: ${result.signature || 'Unknown signature'}`);
      console.log(`   Slot: ${result.results?.slot || 'Unknown slot'}`);
      
      // Wait for confirmation
      console.log("⏳ Waiting for confirmation...");
      const connection = this.sdk.connection;
      const confirmation = await connection.confirmTransaction(result.signature || '', "confirmed");
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
      
      console.log("🎉 Transaction confirmed successfully!");
      
      // Get updated token info
      await this.getTokenInfo(mintAddress);
      
    } catch (error) {
      console.error("❌ Error buying tokens:", error);
      throw error;
    }
  }

  /**
   * Sell tokens
   */
  async sellTokens(mintAddress: string, sellAmount: bigint, walletType: "trading" | "test" = "trading"): Promise<void> {
    if (!this.sdk) {
      throw new Error("SDK not initialized");
    }

    try {
      // Load wallet
      const wallet = walletType === "trading" 
        ? this.walletManager.loadTradingWallet()
        : this.walletManager.loadTestWallet();
      
      const mint = new PublicKey(mintAddress);
      
      console.log(`💸 Selling tokens...`);
      console.log(`   Token: ${mintAddress}`);
      console.log(`   Amount: ${sellAmount.toString()}`);
      console.log(`   Wallet: ${wallet.publicKey.toBase58()}`);
      
      // Execute sell transaction
      console.log("📝 Executing sell transaction...");
      const result = await this.sdk.sell(
        wallet,
        mint,
        sellAmount,
        BigInt(500) // 5% slippage
      );
      
      if (!result.success) {
        throw new Error(`Sell failed: ${result.error || 'Unknown error'}`);
      }
      
      console.log("✅ Sell transaction successful!");
      console.log(`   Transaction: ${result.signature || 'Unknown signature'}`);
      console.log(`   Slot: ${result.results?.slot || 'Unknown slot'}`);
      
      // Wait for confirmation
      console.log("⏳ Waiting for confirmation...");
      const connection = this.sdk.connection;
      const confirmation = await connection.confirmTransaction(result.signature || '', "confirmed");
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
      
      console.log("🎉 Sell transaction confirmed successfully!");
      
    } catch (error) {
      console.error("❌ Error selling tokens:", error);
      throw error;
    }
  }

  /**
   * List available wallets
   */
  listWallets(): void {
    console.log("📁 Available wallets:");
    const wallets = this.walletManager.listAvailableWallets();
    
    if (wallets.length === 0) {
      console.log("   No wallet files found");
    } else {
      wallets.forEach(wallet => {
        console.log(`   - ${wallet}`);
      });
    }
  }
}

// Main execution function
async function main() {
  try {
    const buyer = new TokenBuyer();
    
    // List available wallets
    buyer.listWallets();
    console.log();
    
    // Initialize SDK
    await buyer.initializeSDK("trading");
    console.log();
    
    // Example: Buy tokens (you can modify these parameters)
    const buyConfig: BuyTokensConfig = {
      mintAddress: "7vS7ViHrrMSx19kG95k1KKDFDdq3YTBZNJrDwhPTTj9v", // Your created token
      buyAmountSol: 0.0001, // 0.0001 SOL (very small amount)
      slippageBasisPoints: 500, // 5%
      walletType: "trading"
    };
    
    console.log("📋 Buy Configuration:");
    console.log(`   Token: ${buyConfig.mintAddress}`);
    console.log(`   Amount: ${buyConfig.buyAmountSol} SOL`);
    console.log(`   Slippage: ${buyConfig.slippageBasisPoints! / 100}%`);
    console.log();
    
    // Test the buy method
    console.log("🔧 Testing buy function...");
    await buyer.buyTokens(buyConfig);
    
    console.log("✅ Buy operation completed successfully!");
    
  } catch (error) {
    console.error("❌ Program failed:", error);
    process.exit(1);
  }
}

// Run the program if this file is executed directly
if (require.main === module) {
  main();
}

export { TokenBuyer, BuyTokensConfig };
