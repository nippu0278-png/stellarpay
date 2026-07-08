import type { WalletProvider } from '../types';
import * as StellarSdk from '@stellar/stellar-sdk';
// @ts-ignore
import StellarHDWallet from 'stellar-hd-wallet';

export class MnemonicWalletProvider implements WalletProvider {
  id = 'mnemonic';
  name = 'Recovery Phrase';
  logo = 'password'; // Material icon name

  private mnemonic: string | null = null;
  private publicKey: string | null = null;
  private secretKey: string | null = null;

  constructor() {
    this.mnemonic = sessionStorage.getItem('stellarpay_mnemonic');
    if (this.mnemonic) {
      try {
        const wallet = StellarHDWallet.fromMnemonic(this.mnemonic);
        this.publicKey = wallet.getPublicKey(0);
        this.secretKey = wallet.getSecret(0);
      } catch (e) {
        this.mnemonic = null;
      }
    }
  }

  setMnemonic(mnemonic: string): string {
    try {
      const wallet = StellarHDWallet.fromMnemonic(mnemonic);
      this.mnemonic = mnemonic;
      this.publicKey = wallet.getPublicKey(0);
      this.secretKey = wallet.getSecret(0);
      sessionStorage.setItem('stellarpay_mnemonic', mnemonic);
      return this.publicKey;
    } catch (e: any) {
      throw new Error('Invalid recovery phrase: ' + e.message);
    }
  }

  async isInstalled(): Promise<boolean> {
    return true;
  }

  async connect(): Promise<string> {
    if (!this.publicKey) {
      throw new Error('Please set your recovery phrase in the connection modal.');
    }
    return this.publicKey;
  }

  async disconnect(): Promise<void> {
    this.mnemonic = null;
    this.publicKey = null;
    this.secretKey = null;
    sessionStorage.removeItem('stellarpay_mnemonic');
  }

  async getNetwork(): Promise<string> {
    return 'TESTNET';
  }

  async signTransaction(xdr: string, opts?: { networkPassphrase?: string }): Promise<string> {
    if (!this.secretKey) {
      throw new Error('No recovery phrase configured.');
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
      throw new Error('Recovery phrase signing failed: ' + err.message);
    }
  }
}
