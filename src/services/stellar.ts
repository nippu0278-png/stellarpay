import * as StellarSdk from '@stellar/stellar-sdk';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const RPC_URL = 'https://soroban-testnet.stellar.org';

export const getHorizonServer = (): StellarSdk.Horizon.Server => {
  return new StellarSdk.Horizon.Server(HORIZON_URL);
};

export const getRpcServer = (): StellarSdk.rpc.Server => {
  return new StellarSdk.rpc.Server(RPC_URL);
};

/**
 * Fetches the native XLM balance for a given public key on the Testnet.
 */
export const fetchXlmBalance = async (publicKey: string): Promise<string> => {
  try {
    const server = getHorizonServer();
    const accountInfo = await server.loadAccount(publicKey);
    const nativeBalance = accountInfo.balances.find((b) => b.asset_type === 'native');
    return nativeBalance ? nativeBalance.balance : '0.0000000';
  } catch (err: any) {
    if (err.response && err.response.status === 404) {
      throw new Error('Account does not exist on Testnet. Fund it via Friendbot.');
    }
    throw new Error(err.message || 'Failed to fetch balance');
  }
};

/**
 * Fetches recent payment history from Horizon for a given account.
 */
export const fetchRecentPayments = async (publicKey: string): Promise<any[]> => {
  try {
    const server = getHorizonServer();
    const response = await server.payments()
      .forAccount(publicKey)
      .order('desc')
      .limit(10)
      .call();
    return response.records;
  } catch (err) {
    console.error('Fetch recent payments error:', err);
    return [];
  }
};

/**
 * Fetches live XLM price in USD via CoinGecko or returns a fallback.
 */
export const fetchXlmPriceUsd = async (): Promise<number> => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd');
    const data = await response.json();
    return data.stellar?.usd || 0.12;
  } catch (err) {
    console.warn('Failed to fetch XLM price, using fallback:', err);
    return 0.12;
  }
};

/**
 * Builds a payment transaction, requests the user's Freighter extension to sign it,
 * and submits the signed transaction to the Stellar Testnet.
 */
export const buildAndSubmitPayment = async (
  sender: string,
  destination: string,
  amount: string,
  memo: string | undefined,
  signCallback: (xdr: string) => Promise<string>,
  onStatusChange?: (status: string) => void
): Promise<string> => {
  try {
    const server = getHorizonServer();
    
    // 1. Verify destination account exists
    onStatusChange?.('Verifying destination account...');
    let destExists = true;
    try {
      await server.loadAccount(destination);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        destExists = false;
      } else {
        throw err;
      }
    }

    // 2. Load sender account to get sequence number
    onStatusChange?.('Loading sender account details...');
    const sourceAccount = await server.loadAccount(sender);

    // 3. Build Transaction
    onStatusChange?.('Drafting payment transaction...');
    const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: '100', // standard Base Fee
      networkPassphrase: StellarSdk.Networks.TESTNET,
    });

    if (destExists) {
      txBuilder.addOperation(
        StellarSdk.Operation.payment({
          destination,
          asset: StellarSdk.Asset.native(),
          amount,
        })
      );
    } else {
      txBuilder.addOperation(
        StellarSdk.Operation.createAccount({
          destination,
          startingBalance: amount,
        })
      );
    }

    if (memo && memo.trim() !== '') {
      txBuilder.addMemo(StellarSdk.Memo.text(memo));
    }

    const transaction = txBuilder.setTimeout(30).build();
    const xdr = transaction.toXDR();

    // 4. Request Wallet Signature
    onStatusChange?.('Awaiting wallet signature...');
    const signedXdr = await signCallback(xdr);

    // 5. Submit Transaction
    onStatusChange?.('Submitting transaction to Horizon network...');
    const submittedTx = new StellarSdk.Transaction(signedXdr, StellarSdk.Networks.TESTNET);
    const response = await server.submitTransaction(submittedTx);
    
    if (response.hash) {
      onStatusChange?.('Payment complete!');
      return response.hash;
    }
    throw new Error('Transaction submission failed with no hash');
  } catch (err: any) {
    console.error('Submit transaction error:', err);
    
    const errMsg = (err.message || '').toLowerCase();
    if (errMsg.includes('user denied') || errMsg.includes('rejected') || errMsg.includes('cancel') || errMsg.includes('decline')) {
      throw new Error('Wallet Request Cancelled: The transaction signing was rejected by the user.');
    }
    
    if (err.response && err.response.data && err.response.data.extras && err.response.data.extras.result_codes) {
      const codes = err.response.data.extras.result_codes;
      if (codes.operations && codes.operations.includes('op_underfunded')) {
        throw new Error('Insufficient Balance: Your account does not have enough XLM to fund this transaction.');
      }
    }
    
    if (err.response && err.response.status === 404) {
      throw new Error('Destination Error: The sender account does not exist or needs funding.');
    }
    
    throw new Error(err.message || 'Horizon payment transaction failed.');
  }
};

/**
 * Simulates, assembles resources/fees, signs and submits a Soroban smart contract call.
 */
export const simulateAndSubmitSorobanTransaction = async (
  sender: string,
  contractId: string,
  methodName: string,
  args: any[],
  signCallback: (xdr: string) => Promise<string>,
  onStatusChange?: (status: string) => void
): Promise<string> => {
  try {
    const rpcServer = getRpcServer();
    
    // 1. Get sender account details from the RPC node
    onStatusChange?.('Connecting to Soroban RPC...');
    let account;
    try {
      account = await rpcServer.getAccount(sender);
    } catch (accErr: any) {
      throw new Error('Stellar Account Error: Public key not found on testnet. Please fund your developer public key using a Testnet Friendbot first.');
    }
    
    // 2. Build the contract operation
    const contract = new StellarSdk.Contract(contractId);
    const op = contract.call(methodName, ...args);
    
    // 3. Build base transaction
    onStatusChange?.('Drafting smart contract transaction...');
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: '100', // starting base fee for simulation
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
    .addOperation(op)
    .setTimeout(30)
    .build();
    
    // 4. Simulate the transaction
    onStatusChange?.('Simulating contract call on-chain...');
    const simulation = await rpcServer.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
      const simError = simulation.error || '';
      if (simError.includes('panicked') || simError.includes('panic')) {
        if (simError.includes('Student is not registered')) {
          throw new Error('Smart Contract Error: Student is not registered in the student registry.');
        }
        if (simError.includes('Insufficient points balance')) {
          throw new Error('Smart Contract Error: Insufficient reward points balance.');
        }
        if (simError.includes('Contract already initialized')) {
          throw new Error('Smart Contract Error: This contract has already been initialized.');
        }
        throw new Error(`Smart Contract Panic: ${simError}`);
      }
      
      let customMsg = simError || 'Check contract arguments';
      if (methodName === 'reward_student' || methodName === 'claim_reward') {
        customMsg = 'Student is not registered. Please click "Register as Student" to register your wallet on-chain first.';
      }
      throw new Error(`Simulation failed: ${customMsg}`);
    }
    
    // 5. Assemble transaction with footprints and resource fee
    onStatusChange?.('Preparing contract transaction fee footprint...');
    const assembledTx = StellarSdk.rpc.assembleTransaction(tx, simulation).build();
    
    // 6. Request Wallet Signature
    onStatusChange?.('Awaiting wallet signature...');
    const signedXdr = await signCallback(assembledTx.toXDR());
    
    // 7. Submit Transaction to RPC
    onStatusChange?.('Broadcasting transaction to Soroban network...');
    const signedTx = new StellarSdk.Transaction(signedXdr, StellarSdk.Networks.TESTNET);
    const response = (await rpcServer.sendTransaction(signedTx)) as any;
    
    if (response.status === 'ERROR') {
      throw new Error(`Transaction rejected by RPC node: ${JSON.stringify(response.errorResultXdr || response.errorResult)}`);
    }
    
    // 8. Poll for transaction result
    let status: any = response.status;
    const txHash = response.hash;
    let attempts = 15;
    onStatusChange?.('Waiting for ledger confirmation...');
    while ((status === 'PENDING' || status === 'NOT_FOUND') && attempts > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const txStatus = (await rpcServer.getTransaction(txHash)) as any;
      status = txStatus.status;
      if (status === 'SUCCESS') {
        onStatusChange?.('Transaction complete!');
        return txHash;
      } else if (status === 'FAILED') {
        throw new Error(`Transaction execution failed in ledger: ${txStatus.resultXdr}`);
      }
      attempts--;
    }
    if (status !== 'SUCCESS') {
      throw new Error(`Transaction polling timed out. Hash: ${txHash}`);
    }
    return txHash;
  } catch (err: any) {
    console.error('Soroban transaction failed:', err);
    
    const errMsg = (err.message || '').toLowerCase();
    if (errMsg.includes('user denied') || errMsg.includes('rejected') || errMsg.includes('cancel') || errMsg.includes('decline')) {
      throw new Error('Wallet Request Cancelled: The transaction signing was rejected by the user.');
    }
    
    if (errMsg.includes('student is not registered')) {
      throw new Error('Smart Contract Error: Student is not registered in the student registry.');
    }
    if (errMsg.includes('insufficient points balance')) {
      throw new Error('Smart Contract Error: Insufficient reward points balance.');
    }
    if (errMsg.includes('contract already initialized')) {
      throw new Error('Smart Contract Error: This contract has already been initialized.');
    }
    if (errMsg.includes('account not found') || errMsg.includes('stellar account not found')) {
      throw new Error('Stellar Account Error: Account not found on testnet. Please fund your developer public key using a Testnet Friendbot first.');
    }
    
    throw new Error(err.message || 'Soroban smart contract execution failed.');
  }
};

/**
 * Fetches contract event logs from Testnet RPC for our pre-deployed contract.
 */
export const fetchContractEvents = async (contractId: string): Promise<any[]> => {
  try {
    const rpcServer = getRpcServer();
    const ledgerInfo = await rpcServer.getLatestLedger();
    const latestLedger = ledgerInfo.sequence;
    
    const response = await rpcServer.getEvents({
      startLedger: latestLedger - 3000, // query last ~4 hours of ledgers
      filters: [
        {
          type: 'contract',
          contractIds: [contractId],
        }
      ],
      limit: 10
    });
    
    return (response.events || []).map((e: any) => {
      let parsedTopics: any[] = [];
      try {
        parsedTopics = (e.topic || []).map((t: any) => {
          const scVal = typeof t === 'string' ? StellarSdk.xdr.ScVal.fromXDR(t, 'base64') : t;
          return StellarSdk.scValToNative(scVal);
        });
      } catch (err) {
        console.warn('Failed to parse event topic:', err);
      }
      
      let parsedValue: any = null;
      try {
        if (e.value) {
          const scVal = typeof e.value === 'string' ? StellarSdk.xdr.ScVal.fromXDR(e.value, 'base64') : e.value;
          parsedValue = StellarSdk.scValToNative(scVal);
        }
      } catch (err) {
        console.warn('Failed to parse event value:', err);
      }
      
      return {
        id: e.id,
        type: e.type,
        ledger: e.ledger,
        ledgerClosedAt: e.ledgerClosedAt,
        contractId: e.contractId,
        topics: parsedTopics,
        value: parsedValue
      };
    });
  } catch (err) {
    console.error('Fetch contract events error:', err);
    return [];
  }
};
