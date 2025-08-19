import dotenv from "dotenv";
import { Connection, Keypair } from "@solana/web3.js";
import { PumpFunSDK } from "pumpdotfun-sdk";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet.js";
import { AnchorProvider } from "@coral-xyz/anchor";

dotenv.config();

const getProvider = () => {
  if (!process.env.DEVNET_RPC_URL && !process.env.HELIUS_RPC_URL) {
    throw new Error("Please set DEVNET_RPC_URL or HELIUS_RPC_URL in .env file");
  }

  const rpcUrl = process.env.DEVNET_RPC_URL || process.env.HELIUS_RPC_URL || "";
  const connection = new Connection(rpcUrl);
  const wallet = new NodeWallet(new Keypair());
  return new AnchorProvider(connection, wallet, { commitment: "confirmed" });
};

const setupEventListeners = async (sdk: PumpFunSDK) => {
  console.log("🎧 Setting up event listeners...");
  
  try {
    const createEventId = sdk.addEventListener("createEvent", (event, slot, signature) => {
      console.log("🎯 Create Event:");
      console.log("   Event:", event);
      console.log("   Slot:", slot);
      console.log("   Signature:", signature);
      console.log("   ---");
    });
    console.log("✅ Subscribed to createEvent with ID:", createEventId);

    const tradeEventId = sdk.addEventListener("tradeEvent", (event, slot, signature) => {
      console.log("💰 Trade Event:");
      console.log("   Event:", event);
      console.log("   Slot:", slot);
      console.log("   Signature:", signature);
      console.log("   ---");
    });
    console.log("✅ Subscribed to tradeEvent with ID:", tradeEventId);

    const completeEventId = sdk.addEventListener("completeEvent", (event, slot, signature) => {
      console.log("✅ Complete Event:");
      console.log("   Event:", event);
      console.log("   Slot:", slot);
      console.log("   Signature:", signature);
      console.log("   ---");
    });
    console.log("✅ Subscribed to completeEvent with ID:", completeEventId);
    
  } catch (error) {
    console.error("❌ Error setting up event listeners:", error);
  }
};

const main = async () => {
  try {
    console.log("🚀 PumpFun SDK Events Example - Devnet");
    console.log("=" .repeat(50));
    
    const provider = getProvider();
    const sdk = new PumpFunSDK(provider);
    const connection = provider.connection;

    console.log("🔧 Provider created successfully");
    console.log(`RPC URL: ${connection.rpcEndpoint}`);
    console.log(`Network: ${connection.rpcEndpoint.includes('devnet') ? '🟢 Devnet' : '🔴 Unknown'}`);

    // Set up event listeners
    await setupEventListeners(sdk);
    
    console.log("\n🎧 Event listeners are now active!");
    console.log("   The program will listen for PumpFun events on the network.");
    console.log("   Events will be displayed in real-time as they occur.");
    console.log("\n💡 To see events, you need to:");
    console.log("   1. Have another instance running that creates/buys/sells tokens");
    console.log("   2. Or wait for other users to interact with the protocol");
    console.log("\n⏳ Listening for events... (Press Ctrl+C to stop)");
    
    // Keep the program running to listen for events
    // In a real application, you might want to implement proper shutdown handling
    process.on('SIGINT', () => {
      console.log("\n🛑 Shutting down event listeners...");
      process.exit(0);
    });
    
  } catch (error) {
    console.error("❌ An error occurred:", error);
  }
};

// Run the main function if this file is executed directly
if (require.main === module) {
  main();
}

export { main, setupEventListeners };
