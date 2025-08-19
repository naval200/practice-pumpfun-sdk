import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { PumpFunSDK, CreateTokenMetadata } from "pumpdotfun-sdk";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { WalletManager } from "./utils/wallet";
import { ProviderManager } from "./utils/provider";
import { DEVNET_CONFIG } from "./config/devnet";

interface CreateAndBuyConfig {
  tokenName: string;
  tokenSymbol: string;
  tokenUri?: string;
  buyAmountSol: number;
  slippageBasisPoints?: number;
  walletType?: "trading" | "test";
}

class TokenCreator {
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
    
    if (balanceSol < DEVNET_CONFIG.SETTINGS.MIN_SOL_FOR_CREATION) {
      console.log(`⚠️  Warning: Low balance. You need at least ${DEVNET_CONFIG.SETTINGS.MIN_SOL_FOR_CREATION} SOL for token creation and buying.`);
      console.log(`💡 Use the devnet faucet: ${DEVNET_CONFIG.FAUCET.URL}`);
    }
  }

  /**
   * Create and buy a new token
   */
  async createAndBuyToken(config: CreateAndBuyConfig): Promise<void> {
    if (!this.sdk) {
      throw new Error("SDK not initialized");
    }

    try {
      const { 
        tokenName, 
        tokenSymbol, 
        tokenUri, 
        buyAmountSol, 
        slippageBasisPoints = 500, 
        walletType = "trading" 
      } = config;
      
      // Load wallet
      const wallet = walletType === "trading" 
        ? this.walletManager.loadTradingWallet()
        : this.walletManager.loadTestWallet();
      
      // Generate new mint keypair
      const mint = Keypair.generate();
      const buyAmountLamports = BigInt(Math.floor(buyAmountSol * LAMPORTS_PER_SOL));
      
      console.log(`🎯 Creating and buying new token...`);
      console.log(`   Name: ${tokenName}`);
      console.log(`   Symbol: ${tokenSymbol}`);
      console.log(`   Mint: ${mint.publicKey.toBase58()}`);
      console.log(`   Buy Amount: ${buyAmountSol} SOL`);
      console.log(`   Slippage: ${slippageBasisPoints / 100}%`);
      console.log(`   Creator Wallet: ${wallet.publicKey.toBase58()}`);
      
      // Prepare token metadata
      const tokenMetadata: CreateTokenMetadata = {
        name: tokenName,
        symbol: tokenSymbol,
        description: "Test token",
        file: new Blob(["Test token image"], { type: "image/png" }),
      };
      
      // Execute create and buy transaction
      console.log("📝 Executing create and buy transaction...");
      const result = await this.sdk.createAndBuy(
        wallet,
        mint,
        tokenMetadata,
        buyAmountLamports,
        BigInt(slippageBasisPoints)
      );
      
      console.log("✅ Create and buy transaction successful!");
      console.log(`   Transaction: ${result.signature}`);
      console.log(`   Slot: ${result.results?.slot}`);
      console.log(`   New Token Mint: ${mint.publicKey.toBase58()}`);
      
      // Wait for confirmation
      console.log("⏳ Waiting for confirmation...");
      const connection = this.sdk.connection;
      const confirmation = await connection.confirmTransaction(result.signature!, "confirmed");
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
      
      console.log("🎉 Token created and bought successfully!");
      
      // Get token info
      await this.getTokenInfo(mint.publicKey.toBase58());
      
      // Save mint info to file
      await this.saveMintInfo(mint, tokenName, tokenSymbol);
      
    } catch (error) {
      console.error("❌ Error creating and buying token:", error);
      throw error;
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
        console.log(`   Supply: ${bondingCurveAccount.tokenTotalSupply.toString()}`);
        console.log(`   Reserve: ${bondingCurveAccount.realTokenReserves.toString()}`);
      } else {
        console.log("❌ Token not found on Pump.fun");
      }
      
    } catch (error) {
      console.error("❌ Error getting token info:", error);
    }
  }

  /**
   * Save mint information to a file
   */
  async saveMintInfo(mint: Keypair, tokenName: string, tokenSymbol: string): Promise<void> {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const mintInfo = {
        tokenName,
        tokenSymbol,
        mintAddress: mint.publicKey.toBase58(),
        privateKey: Array.from(mint.secretKey),
        createdAt: new Date().toISOString()
      };
      
      const filename = `mint-${tokenSymbol.toLowerCase()}-${Date.now()}.json`;
      const filepath = path.join('./wallets', filename);
      
      fs.writeFileSync(filepath, JSON.stringify(mintInfo, null, 2));
      console.log(`💾 Mint information saved to: ${filepath}`);
      
    } catch (error) {
      console.error("⚠️  Warning: Failed to save mint info:", error);
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
    const creator = new TokenCreator();
    
    // List available wallets
    creator.listWallets();
    console.log();
    
    // Initialize SDK
    await creator.initializeSDK("trading");
    console.log();
    
    // Example: Create and buy a new token (you can modify these parameters)
    const createConfig: CreateAndBuyConfig = {
      tokenName: "My Awesome Token",
      tokenSymbol: "MAT",
      tokenUri: "", // Optional: metadata URI
      buyAmountSol: 0.01, // 0.01 SOL
      slippageBasisPoints: 500, // 5%
      walletType: "trading"
    };
    
    console.log("📋 Create and Buy Configuration:");
    console.log(`   Name: ${createConfig.tokenName}`);
    console.log(`   Symbol: ${createConfig.tokenSymbol}`);
    console.log(`   Buy Amount: ${createConfig.buyAmountSol} SOL`);
    console.log(`   Slippage: ${createConfig.slippageBasisPoints! / 100}%`);
    console.log();
    
    // Uncomment the line below to actually execute the create and buy
    // await creator.createAndBuyToken(createConfig);
    
    console.log("💡 To execute the create and buy, uncomment the createAndBuyToken call in the code");
    console.log("💡 Make sure you have enough SOL in your wallet");
    
  } catch (error) {
    console.error("❌ Program failed:", error);
    process.exit(1);
  }
}

// Run the program if this file is executed directly
if (require.main === module) {
  main();
}

export { TokenCreator, CreateAndBuyConfig };
