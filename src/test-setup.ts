import { WalletManager } from "./utils/wallet";
import { ProviderManager } from "./utils/provider";
import { DEVNET_CONFIG } from "./config/devnet";

async function testSetup() {
  console.log("🧪 Testing PumpFun SDK Setup (Devnet)");
  console.log("=" .repeat(50));
  
  try {
    // Test wallet manager
    console.log("\n📁 Testing Wallet Manager...");
    const walletManager = new WalletManager();
    
    // List available wallets
    const wallets = walletManager.listAvailableWallets();
    console.log(`   Available wallets: ${wallets.length}`);
    wallets.forEach(wallet => console.log(`   - ${wallet}`));
    
    // Try to load trading wallet
    try {
      const tradingWallet = walletManager.loadTradingWallet();
      const walletInfo = walletManager.getWalletInfo(tradingWallet);
      console.log(`   ✅ Trading wallet loaded: ${walletInfo.publicKey}`);
    } catch (error) {
      console.log(`   ❌ Failed to load trading wallet: ${error}`);
    }
    
    // Test provider manager
    console.log("\n🔧 Testing Provider Manager...");
    const providerManager = new ProviderManager();
    
    // Print configuration
    providerManager.printConfig();
    
    // Test connection
    try {
      const connection = providerManager.createConnection();
      console.log("   ✅ Solana connection created successfully");
      
      // Test RPC call
      const slot = await connection.getSlot();
      console.log(`   ✅ Current slot: ${slot}`);
      
    } catch (error) {
      console.log(`   ❌ Connection failed: ${error}`);
    }
    
    // Print devnet info
    console.log("\n🟢 Devnet Configuration:");
    console.log(`   Default RPC: ${DEVNET_CONFIG.RPC_ENDPOINTS.DEFAULT}`);
    console.log(`   Faucet URL: ${DEVNET_CONFIG.FAUCET.URL}`);
    console.log(`   Min Balance: ${DEVNET_CONFIG.SETTINGS.MIN_SOL_BALANCE} SOL`);
    console.log(`   Min Creation Balance: ${DEVNET_CONFIG.SETTINGS.MIN_SOL_FOR_CREATION} SOL`);
    
    console.log("\n✅ Setup test completed!");
    console.log("\n💡 Next steps:");
    console.log("   1. Copy env.example to .env");
    console.log("   2. Get devnet SOL from the faucet");
    console.log("   3. Run: npm run buy");
    console.log("   4. Or run: npm run create-buy");
    
  } catch (error) {
    console.error("❌ Setup test failed:", error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSetup();
}

export { testSetup };
