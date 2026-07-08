import type { WalletProvider } from '../types';
import albedo from '@albedo-link/intent';

export class AlbedoWalletProvider implements WalletProvider {
  id = 'albedo';
  name = 'Albedo';
  logo = 'language'; // Material icon name

  async isInstalled(): Promise<boolean> {
    // Albedo is web-based and doesn't require a browser extension, so it is always available.
    return true;
  }

  async connect(): Promise<string> {
    try {
      const res = await albedo.publicKey({});
      if (!res.pubkey) {
        throw new Error('Albedo did not return a public key.');
      }
      return res.pubkey;
    } catch (err: any) {
      throw new Error(err.message || 'Albedo connection failed.');
    }
  }

  async disconnect(): Promise<void> {
    // No-op, Albedo manages sessions in its own popup window.
  }

  async getNetwork(): Promise<string> {
    return 'TESTNET';
  }

  async signTransaction(xdr: string, opts?: { networkPassphrase?: string }): Promise<string> {
    try {
      const network = opts?.networkPassphrase?.includes('Public') ? 'public' : 'testnet';
      const signResult = await albedo.tx({
        xdr: xdr,
        network: network,
      });

      if (!signResult.signed_envelope_xdr) {
        throw new Error('Albedo transaction signing failed.');
      }

      return signResult.signed_envelope_xdr;
    } catch (err: any) {
      throw new Error(err.message || 'Albedo transaction signing rejected.');
    }
  }
}
