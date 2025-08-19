import { Connection, Commitment } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import * as dotenv from "dotenv";
import { getDevnetRpcUrl, isDevnet, DEVNET_CONFIG } from "../config/devnet";

dotenv.config();

export interface ProviderConfig {
  rpcUrl: string;
  commitment: Commitment;
  priorityFee?: number;
}

export class ProviderManager {
  private config: ProviderConfig;

  constructor(config?: Partial<ProviderConfig>) {
    this.config = {
      rpcUrl: getDevnetRpcUrl(),
      commitment: (process.env.COMMITMENT as Commitment) || DEVNET_CONFIG.SETTINGS.DEFAULT_COMMITMENT,
      priorityFee: process.env.PRIORITY_FEE ? parseInt(process.env.PRIORITY_FEE) : undefined,
      ...config
    };
  }

  /**
   * Get the RPC URL being used
   */
  getRpcUrl(): string {
    return this.config.rpcUrl;
  }

  /**
   * Get the commitment level
   */
  getCommitment(): Commitment {
    return this.config.commitment;
  }

  /**
   * Get priority fee if configured
   */
  getPriorityFee(): number | undefined {
    return this.config.priorityFee;
  }

  /**
   * Create a Solana connection
   */
  createConnection(): Connection {
    return new Connection(this.config.rpcUrl, {
      commitment: this.config.commitment
    });
  }

  /**
   * Create an Anchor provider with a given wallet
   */
  createProvider(wallet: NodeWallet): AnchorProvider {
    const connection = this.createConnection();
    
    return new AnchorProvider(connection, wallet, {
      commitment: this.config.commitment,
      preflightCommitment: this.config.commitment
    });
  }

  /**
   * Validate the current configuration
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.rpcUrl) {
      errors.push("No RPC URL configured");
    }

    if (!this.config.rpcUrl.startsWith("http")) {
      errors.push("Invalid RPC URL format");
    }

    if (!["processed", "confirmed", "finalized"].includes(this.config.commitment)) {
      errors.push("Invalid commitment level");
    }

    if (this.config.priorityFee !== undefined && this.config.priorityFee < 0) {
      errors.push("Priority fee must be non-negative");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Print current configuration
   */
  printConfig(): void {
    console.log("🔧 Provider Configuration:");
    console.log(`   RPC URL: ${this.config.rpcUrl}`);
    console.log(`   Network: ${isDevnet(this.config.rpcUrl) ? "🟢 Devnet" : "🔴 Unknown Network"}`);
    console.log(`   Commitment: ${this.config.commitment}`);
    console.log(`   Priority Fee: ${this.config.priorityFee || "Not set"}`);
    
    if (isDevnet(this.config.rpcUrl)) {
      console.log(`   💡 Devnet Faucet: ${DEVNET_CONFIG.FAUCET.URL}`);
    }
    
    const validation = this.validateConfig();
    if (!validation.isValid) {
      console.log("   ⚠️  Configuration issues:");
      validation.errors.forEach(error => console.log(`      - ${error}`));
    } else {
      console.log("   ✅ Configuration is valid");
    }
  }
}
