import * as dotenv from 'dotenv';
import { createWalletClient, createPublicClient, http, Hex, parseAbi, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bscTestnet } from 'viem/chains';

dotenv.config();

const WBNB_TESTNET = '0xae13d989daC2f0dEbFf460aC112a837c89BAa7cd';
const USDC_TESTNET = '0x64544969eD7ebF5f083679233325356EbE738930';
const PANCAKE_ROUTER_V2_TESTNET = '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3';

const ROUTER_ABI = parseAbi([
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)'
]);

async function main() {
  const privateKey = process.env.AGENT_PRIVATE_KEY;
  if (!privateKey) {
    console.error('No private key found');
    return;
  }
  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(formattedKey as Hex);
  
  const rpcUrl = process.env.BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545';
  
  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(rpcUrl)
  });

  const walletClient = createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(rpcUrl)
  });

  console.log(`Wallet Address: ${account.address}`);
  console.log('Swapping 0.05 BNB for USDC...');

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 mins
  
  try {
    const hash = await walletClient.writeContract({
      address: getAddress(PANCAKE_ROUTER_V2_TESTNET),
      abi: ROUTER_ABI,
      functionName: 'swapExactETHForTokens',
      args: [
        0n, // amountOutMin
        [getAddress(WBNB_TESTNET), getAddress(USDC_TESTNET)],
        account.address,
        deadline
      ],
      value: 50n * 10n**15n // 0.05 BNB
    });

    console.log(`Swap successful! Transaction Hash: ${hash}`);
    console.log('Waiting for confirmation...');
    await publicClient.waitForTransactionReceipt({ hash });
    console.log('Swap confirmed!');
  } catch (err: any) {
    console.error('Swap failed:', err.message);
  }
}

main();
