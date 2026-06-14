import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  Account,
  rpc,
  nativeToScVal,
  scValToNative,
  Address,
  Operation,
} from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE, USDC } from './stellar';

// For production, this should be an env var.
export const GIG_CONTRACT_ID = process.env.NEXT_PUBLIC_GIG_CONTRACT_ID ?? '';

export enum EscrowStatus {
  Initialized = 0,
  Funded = 1,
  Released = 2,
  Refunded = 3,
}

export async function getEscrowStatus(): Promise<EscrowStatus> {
  if (!GIG_CONTRACT_ID) return EscrowStatus.Initialized;
  
  const contract = new Contract(GIG_CONTRACT_ID);
  const source = new Account('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', '0');

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call('get_status'))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result) {
    return EscrowStatus.Initialized;
  }

  return scValToNative(sim.result.retval) as EscrowStatus;
}

export async function buildInitEscrowXDR(
  sender: string,
  freelancer: string,
  amount: number,
): Promise<string> {
  if (!USDC) throw new Error('USDC not configured');
  
  const contract = new Contract(GIG_CONTRACT_ID);
  const account = await server.getAccount(sender);

  // USDC on Stellar needs to be "wrapped" as a Soroban token to be used in contracts.
  // The contract ID for a Stellar asset is predictable.
  const usdcTokenAddress = USDC.contractId(NETWORK_PASSPHRASE);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'init',
        new Address(sender).toScVal(),
        new Address(freelancer).toScVal(),
        new Address(usdcTokenAddress).toScVal(),
        nativeToScVal(BigInt(Math.trunc(amount)), { type: 'i128' }),
      ),
    )
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error('Simulation failed — could not initialize escrow.');
  }

  return rpc.assembleTransaction(tx, sim).build().toXDR();
}

export async function buildDepositXDR(sender: string): Promise<string> {
  const contract = new Contract(GIG_CONTRACT_ID);
  const account = await server.getAccount(sender);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call('deposit'))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error('Simulation failed — ensure you have enough USDC and the escrow is initialized.');
  }

  return rpc.assembleTransaction(tx, sim).build().toXDR();
}

export async function buildReleaseXDR(sender: string): Promise<string> {
  const contract = new Contract(GIG_CONTRACT_ID);
  const account = await server.getAccount(sender);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call('release'))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error('Simulation failed — only the client can release funds after they are deposited.');
  }

  return rpc.assembleTransaction(tx, sim).build().toXDR();
}

/** Build XDR to add a USDC trustline. */
export async function buildUSDCStoreTrustlineXDR(sender: string): Promise<string> {
  if (!USDC) throw new Error('USDC not configured');
  
  const account = await server.getAccount(sender);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.changeTrust({
        asset: USDC,
      }),
    )
    .setTimeout(30)
    .build();

  return tx.toXDR();
}
