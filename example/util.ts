import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

/**
 * Get or create a keypair from a file
 */
export const getOrCreateKeypair = (folder: string, name: string): Keypair => {
  const filePath = join(folder, `${name}.json`);
  
  if (!existsSync(folder)) {
    mkdirSync(folder, { recursive: true });
  }
  
  if (existsSync(filePath)) {
    const secretKey = JSON.parse(readFileSync(filePath, "utf-8"));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
  } else {
    const keypair = new Keypair();
    writeFileSync(filePath, JSON.stringify(Array.from(keypair.secretKey)));
    return keypair;
  }
};

/**
 * Get SPL token balance
 */
export const getSPLBalance = async (
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey
): Promise<number> => {
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, {
      mint: mint,
    });
    
    if (tokenAccounts.value.length === 0) {
      return 0;
    }
    
    const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    return balance || 0;
  } catch (error) {
    console.error("Error getting SPL balance:", error);
    return 0;
  }
};

/**
 * Print SOL balance
 */
export const printSOLBalance = async (
  connection: Connection,
  publicKey: PublicKey,
  label: string = "Account"
): Promise<void> => {
  try {
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    console.log(`${label}: ${publicKey.toBase58()}`);
    console.log(`   SOL Balance: ${solBalance.toFixed(4)} SOL`);
  } catch (error) {
    console.error(`Error getting SOL balance for ${label}:`, error);
  }
};

/**
 * Print SPL token balance
 */
export const printSPLBalance = async (
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey,
  label: string = "SPL Token"
): Promise<void> => {
  try {
    const balance = await getSPLBalance(connection, mint, owner);
    console.log(`${label}: ${mint.toBase58()}`);
    console.log(`   Owner: ${owner.toBase58()}`);
    console.log(`   Balance: ${balance}`);
  } catch (error) {
    console.error(`Error getting SPL balance for ${label}:`, error);
  }
};
