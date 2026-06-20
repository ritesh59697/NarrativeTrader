import * as dotenv from 'dotenv';
import { createPublicClient, http, parseAbi, formatEther, getAddress } from 'viem';
import { bscTestnet } from 'viem/chains';

dotenv.config();

const USDC_TESTNET = '0x64544969eD7ebF5f083679233325356EbE738930';
const WALLET = '0xA273683BE2B645a174164C01c71f2d035c39E7EC';

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) public view returns (uint256)',
  'function decimals() public view returns (uint8)'
]);

async function main() {
  const rpcUrl = process.env.BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545';
  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(rpcUrl)
  });

  const bnbBalance = await publicClient.getBalance({ address: WALLET });
  console.log(`Native BNB Balance: ${formatEther(bnbBalance)} BNB`);

  try {
    const decimals = await publicClient.readContract({
      address: getAddress(USDC_TESTNET),
      abi: ERC20_ABI,
      functionName: 'decimals'
    }) as number;

    const usdcBalance = await publicClient.readContract({
      address: getAddress(USDC_TESTNET),
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [WALLET]
    }) as bigint;

    const usdcFormatted = Number(usdcBalance) / Math.pow(10, decimals);
    console.log(`Mock USDC Balance (${USDC_TESTNET}): ${usdcFormatted} USDC`);
  } catch (err: any) {
    console.error(`Error fetching USDC balance: ${err.message}`);
  }
}

main();
