import { TrustWalletAgentKit, PancakeSwapPrimitive } from '@bnb-chain/bnbagent-sdk';
import { parseAbi, getAddress, type Hex } from 'viem';

// BSC USDC Contract Addresses
const USDC_TESTNET = '0x64544969eD7ebF5f083679233325356EbE738930'; // Standard Mock USDC on BSC Testnet
const USDC_MAINNET = '0x8AC76a51cc950d9822D68b83fE1Ad97B32CD580d'; // Binance-Peg USD on BSC

// PancakeSwap V2 Router addresses (mirrors the values in the SDK)
const PANCAKE_ROUTER_TESTNET = '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3';
const PANCAKE_ROUTER_MAINNET = '0x10ED43C718714eb63d5aA57B78B54704E256024E';

const ERC20_ABI = parseAbi([
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function approve(address spender, uint256 amount) public returns (bool)'
]);

export interface ExecutionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Ensure the PancakeSwap router has sufficient USDC allowance.
 * Checks the current allowance and issues an approve() tx if needed.
 */
async function ensureUSDCApproval(
  kit: TrustWalletAgentKit,
  usdcAddress: string,
  routerAddress: string,
  requiredRaw: bigint
): Promise<void> {
  // In simulation mode just log and skip on-chain calls
  if (kit.isSimulated()) {
    console.log('[Execution] (Simulation) Skipping USDC approval — simulation mode active.');
    return;
  }

  const publicClient = kit.getPublicClient();
  const walletClient = kit.getWalletClient();
  const agentAddress = kit.getAddress() as Hex;

  // 1. Read current allowance
  const allowance = await publicClient.readContract({
    address: getAddress(usdcAddress) as Hex,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [agentAddress, getAddress(routerAddress) as Hex]
  }) as bigint;

  console.log(`[Execution] USDC allowance for router: ${allowance.toString()} (need ${requiredRaw.toString()})`);

  if (allowance >= requiredRaw) {
    console.log('[Execution] Allowance sufficient — skipping approval.');
    return;
  }

  // 2. Approve max uint256 so future cycles don't need repeated approvals
  console.log('[Execution] Approving USDC for PancakeSwap router...');
  const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

  const approveTxHash = await walletClient.writeContract({
    address: getAddress(usdcAddress) as Hex,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [getAddress(routerAddress) as Hex, MAX_UINT256],
    account: agentAddress
  });

  console.log(`[Execution] Approval tx submitted: ${approveTxHash}. Waiting for confirmation...`);
  await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
  console.log('[Execution] USDC approval confirmed.');
}

/**
 * Execute a swap from USDC to the target narrative token on BSC Testnet/Mainnet.
 * 
 * @param tokenSymbol Symbol of the target token
 * @param tokenAddress Address of the target token
 * @param positionSizeUSDC Amount in USDC to swap
 */
export async function executeTrade(
  tokenSymbol: string,
  tokenAddress: string,
  positionSizeUSDC: number
): Promise<ExecutionResult> {
  const privateKey = process.env.AGENT_PRIVATE_KEY || '';
  const rpcUrl = process.env.BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545';
  const network = process.env.NETWORK === 'mainnet' ? 'mainnet' : 'testnet';

  const inputTokenAddress = network === 'mainnet' ? USDC_MAINNET : USDC_TESTNET;
  const routerAddress = network === 'mainnet' ? PANCAKE_ROUTER_MAINNET : PANCAKE_ROUTER_TESTNET;

  console.log(`\uD83C\uDFAC [Execution] Initiating trade execution cycle:`);
  console.log(`   - Target: Buy ${tokenSymbol} (${tokenAddress})`);
  console.log(`   - Sizing: $${positionSizeUSDC.toFixed(2)} USDC`);
  console.log(`   - Network: ${network.toUpperCase()}`);

  try {
    // 1. Initialize Trust Wallet Agent Kit (TWAK)
    const kit = new TrustWalletAgentKit({
      privateKey,
      rpcUrl,
      network
    });

    const agentAddress = kit.getAddress();
    console.log(`   - Agent Wallet: ${agentAddress}`);

    // USDC decimals is typically 18 on BSC Testnet Mock USDC, and 18 on BSC Mainnet (Binance-Peg USDC).
    // Let's format the USDC amount in raw units (1e18).
    const decimals = 18;
    const rawAmount = BigInt(Math.floor(positionSizeUSDC * Math.pow(10, decimals)));

    // 2. Ensure USDC is approved for PancakeSwap router (BUG 2 fix)
    await ensureUSDCApproval(kit, inputTokenAddress, routerAddress, rawAmount);

    // 3. Build swap transaction via BNB Agent SDK PancakeSwap primitive
    const pancakeSwap = new PancakeSwapPrimitive(kit);
    
    // Map mainnet target tokens to WBNB on Testnet to allow on-chain trades to execute successfully
    const targetTokenAddress = network === 'testnet' 
      ? '0xae13d989daC2f0dEbFf460aC112a837c89BAa7cd' // WBNB
      : tokenAddress;

    console.log(`\u2699\uFE0F [Execution] Building swap transaction (Target Token: ${targetTokenAddress})...`);
    const tx = await pancakeSwap.buildSwapTransaction({
      inputToken: inputTokenAddress,
      outputToken: targetTokenAddress,
      amount: rawAmount.toString(),
      recipient: agentAddress
    });

    // 4. Sign the transaction using TWAK
    console.log(`\u270D\uFE0F [Execution] Signing transaction with TWAK...`);
    const signedTx = await kit.signTransaction(tx);

    // 5. Broadcast to the network
    console.log(`\uD83D\uDE80 [Execution] Broadcasting transaction...`);
    const txHash = await kit.broadcastTransaction(signedTx);

    console.log(`\u2705 [Execution] Trade executed successfully! Tx Hash: ${txHash}`);
    return {
      success: true,
      txHash
    };
  } catch (error: any) {
    console.error(`\u274C [Execution] Trade execution failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

