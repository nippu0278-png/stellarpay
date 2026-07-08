import type { WalletProvider } from '../types';
import {
  isConnected,
  getAddress,
  getNetwork,
  signTransaction,
} from '@stellar/freighter-api';

export class FreighterWalletProvider implements WalletProvider {
  id = 'freighter';
  name = 'Freighter';
  logo = 'rocket_launch'; // Material symbol icon name

  async isInstalled(): Promise<boolean> {
    try {
      const res = await isConnected();
      return !!(res && res.isConnected);
    } catch (e) {
      return false;
    }
  }

  async connect(): Promise<string> {
    const connectionResult = await isConnected();
    if (!connectionResult || !connectionResult.isConnected) {
      throw new Error('Freighter Wallet not detected. Please install the browser extension.');
    }

    const keyResult = await getAddress();
    if (keyResult.error) {
      throw new Error(keyResult.error || 'User denied wallet authorization.');
    }
    
    const key = keyResult.address;
    if (!key) {
      throw new Error('Could not retrieve public key. Please unlock Freighter and authorize connection.');
    }

    return key;
  }

  async disconnect(): Promise<void> {
    // Freighter extension manages its own session, no API call is available to disconnect from the client side.
  }

  async getNetwork(): Promise<string> {
    try {
      const netResult = await getNetwork();
      if (netResult.error) {
        return 'TESTNET';
      }
      return netResult.network || 'TESTNET';
    } catch (e) {
      return 'TESTNET';
    }
  }

  async signTransaction(xdr: string, opts?: { networkPassphrase?: string }): Promise<string> {
    try {
      const passphrase = opts?.networkPassphrase || 'Test SDF Network ; September 2015';
      const signResult = await signTransaction(xdr, {
        networkPassphrase: passphrase,
      });
      
      if (signResult.error) {
        throw new Error(signResult.error);
      }

      return signResult.signedTxXdr;
    } catch (err: any) {
      throw new Error(err.message || 'Transaction signing rejected.');
    }
  }
}
