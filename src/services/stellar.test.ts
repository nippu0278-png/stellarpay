import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHorizonServer, getRpcServer, fetchXlmPriceUsd } from './stellar';

describe('Stellar Service Helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize Horizon server instance with the correct testnet URL', () => {
    const server = getHorizonServer();
    expect(server).toBeDefined();
    expect(server.serverURL.toString()).toContain('horizon-testnet.stellar.org');
  });

  it('should initialize RPC server instance with the correct testnet URL', () => {
    const server = getRpcServer();
    expect(server).toBeDefined();
    expect(server.serverURL.toString()).toContain('soroban-testnet.stellar.org');
  });

  it('should fetch the XLM price in USD from API and return it', async () => {
    const mockResponse = {
      stellar: {
        usd: 0.145,
      },
    };

    // Mock global fetch
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      } as Response)
    );
    vi.stubGlobal('fetch', mockFetch);

    const price = await fetchXlmPriceUsd();
    expect(mockFetch).toHaveBeenCalledWith('https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd');
    expect(price).toBe(0.145);
  });

  it('should return fallback XLM price of 0.12 if the API call fails', async () => {
    // Mock global fetch to reject
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.reject(new Error('Network error'))
    );
    vi.stubGlobal('fetch', mockFetch);

    const price = await fetchXlmPriceUsd();
    expect(price).toBe(0.12);
  });
});
