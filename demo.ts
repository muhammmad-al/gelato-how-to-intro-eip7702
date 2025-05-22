import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { createPublicClient, createWalletClient, http, formatEther, parseEther } from 'viem'
import { sepolia } from 'viem/chains'
import { getBalance, writeContract, waitForTransactionReceipt, sendTransaction, getCode } from 'viem/actions'
import { signAuthorization } from 'viem/experimental'
import dotenv from 'dotenv'

dotenv.config()

if (!process.env.DEPLOYER_PRIVATE_KEY) {
  throw new Error('Please set DEPLOYER_PRIVATE_KEY in your .env file')
}

// Your deployed SimpleWallet contract address
const SIMPLE_WALLET_ADDRESS = '0xBc4092c3E7e5fD1c916eA69a6FF0D71c1A4f4B1c'

// SimpleWallet ABI
const SIMPLE_WALLET_ABI = [
  {
    "type": "function",
    "name": "execute",
    "inputs": [
      { "name": "target", "type": "address" },
      { "name": "value", "type": "uint256" },
      { "name": "data", "type": "bytes" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "getBalance",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nonce",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  }
] as const

async function main() {
  console.log('🚀 Fixed EIP-7702 Demo\n')

  // Setup clients
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http()
  })

  // Generate new EOA for testing
  const privateKey = generatePrivateKey()
  const account = privateKeyToAccount(privateKey)
  
  console.log('1️⃣ Generated Test EOA:')
  console.log(`   Address: ${account.address}`)
  console.log(`   🔗 Etherscan: https://sepolia.etherscan.io/address/${account.address}\n`)

  // Setup dev wallet client for funding
  const devPrivateKey = process.env.DEPLOYER_PRIVATE_KEY?.startsWith('0x') 
    ? process.env.DEPLOYER_PRIVATE_KEY 
    : `0x${process.env.DEPLOYER_PRIVATE_KEY}`
  const devAccount = privateKeyToAccount(devPrivateKey as `0x${string}`)
  const devWalletClient = createWalletClient({
    account: devAccount,
    chain: sepolia,
    transport: http()
  })

  // Fund the new EOA
  console.log('2️⃣ Funding new EOA...')
  const fundingHash = await sendTransaction(devWalletClient, {
    to: account.address,
    value: parseEther('0.01')
  })
  console.log(`   ⏳ Waiting for funding transaction...`)
  await waitForTransactionReceipt(publicClient, { hash: fundingHash })
  console.log(`   ✅ Funded with 0.01 ETH`)
  console.log(`   🔗 Transaction: https://sepolia.etherscan.io/tx/${fundingHash}\n`)

  // Create wallet client for the new EOA
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http()
  })

  // Sign EIP-7702 authorization with proper parameters
  console.log('3️⃣ Signing EIP-7702 authorization...')
  const authorization = await signAuthorization(walletClient, {
    account,
    contractAddress: SIMPLE_WALLET_ADDRESS as `0x${string}`,
    executor: 'self' // Required when EOA executes its own transaction
  })
  console.log('   ✅ Authorization signed with explicit parameters')
  console.log(`   📋 Contract address: ${SIMPLE_WALLET_ADDRESS}`)
  console.log(`   📋 Authorization address: ${authorization.contractAddress}\n`)

  // Check EOA has no code before upgrade
  console.log('4️⃣ Checking EOA before upgrade...')
  const codeBefore = await getCode(publicClient, { address: account.address })
  console.log(`   Code before: ${codeBefore ? 'HAS CODE' : 'NO CODE'} (${codeBefore ? codeBefore.length : 0} chars)`)

  // Inject contract into EOA using EIP-7702
  console.log('\n5️⃣ Injecting SimpleWallet into EOA...')
  const upgradeHash = await writeContract(walletClient, {
    abi: SIMPLE_WALLET_ABI,
    address: account.address, // Calling EOA address!
    functionName: 'getBalance', // Use a simple read function
    authorizationList: [authorization] // EIP-7702 magic!
  })

  console.log(`   ⏳ Waiting for injection transaction...`)
  const receipt = await waitForTransactionReceipt(publicClient, { hash: upgradeHash })
  console.log(`   Transaction Status: ${receipt.status}`)
  console.log(`   Gas Used: ${receipt.gasUsed}`)
  console.log(`   🔗 Upgrade Tx: https://sepolia.etherscan.io/tx/${upgradeHash}\n`)

  // Check EOA has code after upgrade
  console.log('6️⃣ Checking EOA after upgrade...')
  const codeAfter = await getCode(publicClient, { address: account.address })
  console.log(`   Code after: ${codeAfter ? 'HAS CODE ✅' : 'NO CODE ❌'} (${codeAfter ? codeAfter.length : 0} chars)`)
  
  if (codeAfter && codeAfter !== '0x') {
    console.log('   🎉 EIP-7702 injection successful!')
    
    // Test smart wallet functionality
    console.log('\n7️⃣ Testing smart wallet functionality...')
    try {
      // Try calling a smart contract function
      const testHash = await writeContract(walletClient, {
        abi: SIMPLE_WALLET_ABI,
        address: account.address,
        functionName: 'execute',
        args: [account.address, 0n, '0x'], // Simple self-call
      })
      
      await waitForTransactionReceipt(publicClient, { hash: testHash })
      console.log('   ✅ Smart wallet function call successful!')
      console.log(`   🔗 Test Tx: https://sepolia.etherscan.io/tx/${testHash}`)
      
    } catch (error) {
      console.log('   ❌ Smart wallet function call failed:', error.message)
    }
  } else {
    console.log('   ❌ EIP-7702 injection failed - investigating...')
    
    console.log('\n🔍 Debugging information:')
    console.log(`   • Authorization chain ID: ${authorization.chainId}`)
    console.log(`   • Authorization nonce: ${authorization.nonce}`)
    console.log(`   • Authorization address: ${authorization.contractAddress}`)
    console.log(`   • Current chain ID: ${sepolia.id}`)
    console.log(`   • Account nonce: ${await publicClient.getTransactionCount({ address: account.address })}`)
  }

  // Summary
  console.log('\n📋 Summary:')
  console.log(`   • EOA Address: ${account.address}`)
  console.log(`   • Smart Wallet Contract: ${SIMPLE_WALLET_ADDRESS}`)
  console.log(`   • Funding Transaction: https://sepolia.etherscan.io/tx/${fundingHash}`)
  console.log(`   • Upgrade Transaction: https://sepolia.etherscan.io/tx/${upgradeHash}`)
  console.log(`   • EIP-7702 Success: ${codeAfter && codeAfter !== '0x' ? '✅' : '❌'}`)
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message)
  console.error(error)
  process.exit(1)
})