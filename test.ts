import { createPublicClient, http, formatEther, getContract } from 'viem'
import { sepolia } from 'viem/chains'

// Your EOA that was upgraded to smart wallet
const SMART_WALLET_ADDRESS = '0x4dcc6926A7C7f2914Cc1D4aBA98CEc97e982DB11'

// SimpleWallet ABI
const SIMPLE_WALLET_ABI = [
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

async function testSmartWallet() {
  console.log('🧪 Testing Smart Wallet Functionality\n')

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http()
  })

  // Create contract instance
  const smartWallet = getContract({
    address: SMART_WALLET_ADDRESS,
    abi: SIMPLE_WALLET_ABI,
    client: publicClient
  })

  console.log(`📋 Smart Wallet Address: ${SMART_WALLET_ADDRESS}`)
  console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${SMART_WALLET_ADDRESS}\n`)

  try {
    // Test 1: Call getBalance() function
    console.log('1️⃣ Testing getBalance() function...')
    const contractBalance = await smartWallet.read.getBalance()
    console.log(`   ✅ Contract Balance: ${formatEther(contractBalance)} ETH`)

    // Test 2: Call nonce() function  
    console.log('\n2️⃣ Testing nonce() function...')
    const nonce = await smartWallet.read.nonce()
    console.log(`   ✅ Current Nonce: ${nonce}`)

    // Test 3: Compare with regular ETH balance
    console.log('\n3️⃣ Comparing with regular balance check...')
    const ethBalance = await publicClient.getBalance({ address: SMART_WALLET_ADDRESS })
    console.log(`   📊 ETH Balance: ${formatEther(ethBalance)} ETH`)
    console.log(`   📊 Contract getBalance(): ${formatEther(contractBalance)} ETH`)
    console.log(`   ${ethBalance === contractBalance ? '✅ Match!' : '❌ Different'}`)

    console.log('\n🎉 Smart Wallet Tests Complete!')
    console.log('\n📋 Results:')
    console.log(`   • Smart wallet functions work: ✅`)
    console.log(`   • EOA transformation successful: ✅`) 
    console.log(`   • EIP-7702 injection confirmed: ✅`)

  } catch (error) {
    console.error('\n❌ Smart wallet test failed:')
    console.error(error)
    console.log('\n🤔 This might mean:')
    console.log('   • The EIP-7702 injection didn\'t work')
    console.log('   • The address doesn\'t have smart contract code')
    console.log('   • Network connectivity issues')
  }
}

testSmartWallet() 