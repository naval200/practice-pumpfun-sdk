import { Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

export interface WalletConfig {
  name: string;
  keypair: Keypair;
  publicKey: string;
}

export class WalletManager {
  private walletsDir: string;

  constructor(walletsDir: string = "./wallets") {
    this.walletsDir = walletsDir;
  }

  /**
   * Load a wallet from a JSON file
   */
  loadWalletFromFile(filename: string): Keypair {
    const filePath = path.join(this.walletsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Wallet file not found: ${filePath}`);
    }

    try {
      const walletData = fs.readFileSync(filePath, "utf-8");
      const privateKeyArray = JSON.parse(walletData);
      
      if (!Array.isArray(privateKeyArray) || privateKeyArray.length !== 64) {
        throw new Error(`Invalid wallet format in ${filename}`);
      }

      return Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
    } catch (error) {
      throw new Error(`Failed to load wallet from ${filename}: ${error}`);
    }
  }

  /**
   * Load a wallet from a private key text file
   */
  loadWalletFromPrivateKey(filename: string): Keypair {
    const filePath = path.join(this.walletsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Private key file not found: ${filePath}`);
    }

    try {
      const privateKeyString = fs.readFileSync(filePath, "utf-8").trim();
      const privateKeyArray = privateKeyString.split(",").map(num => parseInt(num.trim()));
      
      if (privateKeyArray.length !== 64) {
        throw new Error(`Invalid private key format in ${filename}`);
      }

      return Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
    } catch (error) {
      throw new Error(`Failed to load wallet from private key file ${filename}: ${error}`);
    }
  }

  /**
   * Get wallet info including public key
   */
  getWalletInfo(keypair: Keypair): WalletConfig {
    return {
      name: "Loaded Wallet",
      keypair,
      publicKey: keypair.publicKey.toBase58()
    };
  }

  /**
   * List available wallet files
   */
  listAvailableWallets(): string[] {
    if (!fs.existsSync(this.walletsDir)) {
      return [];
    }

    return fs.readdirSync(this.walletsDir)
      .filter(file => file.endsWith('.json') || file.endsWith('_private_key.txt'))
      .map(file => file);
  }

  /**
   * Load trading wallet (default)
   */
  loadTradingWallet(): Keypair {
    try {
      // Try to load from trading-wallet.json first
      return this.loadWalletFromFile("trading-wallet.json");
    } catch (error) {
      try {
        // Fallback to private key file
        return this.loadWalletFromPrivateKey("trading-private_key.txt");
      } catch (fallbackError) {
        throw new Error(`Failed to load trading wallet: ${error}. Fallback also failed: ${fallbackError}`);
      }
    }
  }

  /**
   * Load test wallet
   */
  loadTestWallet(): Keypair {
    try {
      // Try to load from test-wallet.json first
      return this.loadWalletFromFile("test-wallet.json");
    } catch (error) {
      try {
        // Fallback to private key file
        return this.loadWalletFromPrivateKey("test-private_key.txt");
      } catch (fallbackError) {
        throw new Error(`Failed to load test wallet: ${error}. Fallback also failed: ${fallbackError}`);
      }
    }
  }
}
