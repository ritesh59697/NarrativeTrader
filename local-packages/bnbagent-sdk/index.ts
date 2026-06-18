import { 
  createWalletClient, 
  createPublicClient, 
  http, 
  Hex, 
  encodeFunctionData, 
  parseAbi,
  getAddress
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bscTestnet, bsc } from 'viem/chains';

// Common Router Addresses
// PancakeSwap V2 Router on BSC Testnet (UniswapV2 compatible)
const PANCAKE_ROUTER_V2_TESTNET = '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3'; 
const PANCAKE_ROUTER_V2_MAINNET = '0x10ED43C718714eb63d5aA57B78B54704E256024E';

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function balanceOf(address owner) public view returns (uint256)',
  'function decimals() public view returns (uint8)'
]);

const ROUTER_ABI = parseAbi([
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint[] calldata deadline) external returns (uint[] memory amounts)'
]);

export interface WalletConfig {
  privateKey: string;
  rpcUrl?: string;
  network?: 'testnet' | 'mainnet';
}

export class TrustWalletAgentKit {
  private privateKey: string;
  private rpcUrl: string;
  private network: 'testnet' | 'mainnet';
  private isSimulation = false;
  private account: any = null;
  private walletClient: any = null;
  private publicClient: any = null;

  constructor(config: WalletConfig) {
    this.privateKey = config.privateKey || '';
    this.network = config.network || 'testnet';
    this.rpcUrl = config.rpcUrl || (this.network === 'mainnet' 
      ? 'https://bsc-dataseed.binance.org' 
      : 'https://data-seed-prebsc-1-s1.binance.org:8545');

    // Detect dummy or invalid keys to toggle simulation mode automatically
    if (!this.privateKey || this.privateKey.startsWith('your_') || this.privateKey.length !== 66 && this.privateKey.length !== 64) {
      this.isSimulation = true;
      console.log('📊 [TWAK] Using TWAK Wallet in SIMULATION mode (invalid or dummy AGENT_PRIVATE_KEY provided).');
    } else {
      try {
        const formattedKey = this.privateKey.startsWith('0x') ? this.privateKey : `0x${this.privateKey}`;
        this.account = privateKeyToAccount(formattedKey as Hex);
        const chain = this.network === 'mainnet' ? bsc : bscTestnet;
        
        this.publicClient = createPublicClient({
          chain,
          transport: http(this.rpcUrl)
        });

        this.walletClient = createWalletClient({
          account: this.account,
          chain,
          transport: http(this.rpcUrl)
        });
        console.log(`✅ [TWAK] Initialized autonomous wallet: ${this.account.address}`);
      } catch (error: any) {
        console.error(`❌ [TWAK] Initialization failed: ${error.message}. Falling back to SIMULATION mode.`);
        this.isSimulation = true;
      }
    }
  }

  public getAddress(): string {
    if (this.isSimulation) {
      return '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Standard mock address
    }
    return this.account.address;
  }

  public getPublicClient() {
    return this.publicClient;
  }

  public getWalletClient() {
    return this.walletClient;
  }

  public isSimulated(): boolean {
    return this.isSimulation;
  }

  public async signTransaction(tx: { to: string; data: string; value: bigint }): Promise<string> {
    if (this.isSimulation) {
      console.log('✍️ [TWAK] (Simulation) Signed transaction details:', {
        to: tx.to,
        data: tx.data ? tx.data.substring(0, 66) + '...' : 'none',
        value: tx.value.toString()
      });
      return '0xsimulated_signature_' + Math.random().toString(36).substring(2);
    }

    try {
      // For on-chain execution, we prepare the request to send directly, or estimate gas
      console.log('✍️ [TWAK] Preparing transaction parameters for signing...');
      return JSON.stringify(tx, (key, value) => typeof value === 'bigint' ? value.toString() : value);
    } catch (error: any) {
      throw new Error(`[TWAK] Failed to sign transaction: ${error.message}`);
    }
  }

  public async broadcastTransaction(signedTx: string): Promise<string> {
    if (this.isSimulation) {
      const mockHash = '0xsimulated_tx_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      console.log(`🚀 [TWAK] (Simulation) Broadcasted transaction. Simulated hash: ${mockHash}`);
      return mockHash;
    }

    try {
      const txParams = JSON.parse(signedTx);
      const hash = await this.walletClient.sendTransaction({
        to: getAddress(txParams.to) as Hex,
        data: txParams.data as Hex,
        value: BigInt(txParams.value),
        account: this.account
      });
      console.log(`🚀 [TWAK] Transaction broadcasted. Tx Hash: ${hash}`);
      
      // Wait for transaction receipt
      if (this.publicClient) {
        console.log('⏳ Waiting for transaction receipt...');
        await this.publicClient.waitForTransactionReceipt({ hash });
        console.log('✅ Transaction confirmed!');
      }

      return hash;
    } catch (error: any) {
      throw new Error(`[TWAK] Failed to broadcast transaction: ${error.message}`);
    }
  }
}

export class PancakeSwapPrimitive {
  private kit: TrustWalletAgentKit;

  constructor(kit: TrustWalletAgentKit) {
    this.kit = kit;
  }

  public async buildSwapTransaction(params: {
    inputToken: string;
    outputToken: string;
    amount: string;     // Amount in raw format (or USDC units)
    recipient: string;
  }): Promise<{ to: string; data: string; value: bigint }> {
    const rawRouterAddress = this.kit.getAddress() === '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
      ? PANCAKE_ROUTER_V2_TESTNET
      : (this.kit.getWalletClient()?.chain?.id === 56 ? PANCAKE_ROUTER_V2_MAINNET : PANCAKE_ROUTER_V2_TESTNET);

    const routerAddress = getAddress(rawRouterAddress);
    const inputToken = params.inputToken.toLowerCase() === 'native' ? 'native' : getAddress(params.inputToken);
    const outputToken = getAddress(params.outputToken);
    const recipient = getAddress(params.recipient);

    console.log(`📊 [PancakeSwap] Building swap path: ${inputToken} -> ${outputToken}`);

    // If input token is native tBNB / BNB, we use swapExactETHForTokens
    const isNativeInput = inputToken === 'native' || inputToken.toLowerCase() === '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c' || inputToken.toLowerCase() === '0xae13d989dac2f0debff460ac112a837c89baa7cd'; 
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minute deadline

    let data = '';
    let value = 0n;

    if (isNativeInput) {
      const amountIn = BigInt(params.amount);
      value = amountIn;
      data = encodeFunctionData({
        abi: ROUTER_ABI,
        functionName: 'swapExactETHForTokens',
        args: [
          0n, // amountOutMin (slippage not computed for simple demo, set to 0)
          [inputToken as Hex, outputToken as Hex],
          recipient as Hex,
          deadline
        ]
      });
    } else {
      const amountIn = BigInt(params.amount);
      data = encodeFunctionData({
        abi: ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [
          amountIn,
          0n, // amountOutMin
          [inputToken as Hex, outputToken as Hex],
          recipient as Hex,
          deadline
        ]
      });
    }

    return {
      to: routerAddress,
      data,
      value
    };
  }
}
