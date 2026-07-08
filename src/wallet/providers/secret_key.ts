import type { WalletProvider } from '../types';
import * as StellarSdk from '@stellar/stellar-sdk';

export class SecretKeyWalletProvider implements WalletProvider {
  id = 'secret_key';
  name = 'Secret Key (Developer Mode)';
  logo = 'vpn_key'; // Material icon name

  private secretKey: string | null = null;
  private publicKey: string | null = null;

  constructor() {
    this.secretKey = sessionStorage.getItem('stellarpay_secret_key');
    if (this.secretKey) {
      try {
        const kp = StellarSdk.Keypair.fromSecret(this.secretKey);
        this.publicKey = kp.publicKey();
      } catch (e) {
        this.secretKey = null;
      }
    }
  }

  setSecret(secret: string): string {
    try {
      const kp = StellarSdk.Keypair.fromSecret(secret);
      this.secretKey = secret;
      this.publicKey = kp.publicKey();
      sessionStorage.setItem('stellarpay_secret_key', secret);
      return this.publicKey;
    } catch (e: any) {
      throw new Error('Invalid secret key format: ' + e.message);
    }
  }

  async isInstalled(): Promise<boolean> {
    return true;
  }

  async connect(): Promise<string> {
    if (!this.publicKey) {
      throw new Error('Please set your Secret Key in the connection modal or settings first.');
    }
    return this.publicKey;
  }

  async disconnect(): Promise<void> {
    this.secretKey = null;
    this.publicKey = null;
    sessionStorage.removeItem('stellarpay_secret_key');
  }

  async getNetwork(): Promise<string> {
    return 'TESTNET';
  }

  async signTransaction(xdr: string, opts?: { networkPassphrase?: string }): Promise<string> {
    if (!this.secretKey) {
      throw new Error('No secret key configured.');
    }
    try {
      const passphrase = opts?.networkPassphrase || StellarSdk.Networks.TESTNET;
      let tx: any;
      try {
        tx = StellarSdk.TransactionBuilder.fromXDR(xdr, passphrase);
      } catch (e) {
        tx = new StellarSdk.Transaction(xdr, passphrase);
      }

      const kp = StellarSdk.Keypair.fromSecret(this.secretKey);
      tx.sign(kp);
      return tx.toXDR();
    } catch (err: any) {
      throw new Error('Secret key signing failed: ' + err.message);
    }
  }
}
