import * as dotenv from 'dotenv';
import { createWalletClient, createPublicClient, http, Hex, parseAbi, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bscTestnet } from 'viem/chains';

dotenv.config();

const USDC_TESTNET = '0x64544969eD7ebF5f083679233325356EbE738930';

const FAUCET_ABI = parseAbi([
  'function mint(address to, uint256 amount) public',
  'function mint(uint256 amount) public',
  'function faucet() public',
  'function allocateTo(address owner, uint256 value) public'
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

  console.log(`Wallet: ${account.address}`);

  // Try calling allocation/mint/faucet methods to get free test USDC
  const methods = [
    { name: 'mint(address,uint256)', func: 'mint', args: [account.address, 1000n * 10n**18n] },
    { name: 'mint(uint256)', func: 'mint', args: [1000n * 10n**18n] },
    { name: 'allocateTo(address,uint256)', func: 'allocateTo', args: [account.address, 1000n * 10n**18n] },
    { name: 'faucet()', func: 'faucet', args: [] }
  ];

  for (const method of methods) {
    try {
      console.log(`Trying method: ${method.name}...`);
      const hash = await walletClient.writeContract({
        address: getAddress(USDC_TESTNET),
        abi: FAUCET_ABI,
        functionName: method.func as any,
        args: method.args as any
      });
      console.log(`Success! Transaction Hash: ${hash}`);
      console.log('Waiting for confirmation...');
      await publicClient.waitForTransactionReceipt({ hash });
      console.log('Confirmed!');
      return;
    } catch (err: any) {
      console.log(`Method ${method.name} failed: ${err.message.split('\n')[0]}`);
    }
  }
  
  console.log('All mint/faucet methods failed.');
}

main();
