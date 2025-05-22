import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { getTransactionReceipt, getCode } from 'viem/actions'

// The correct EOA from your successful demo
const CORRECT_EOA = '0xfb44eD8B62867a7aa4A28F0116B71A22E61dc509'
const UPGRADE_TX = '0x5186fc19dc2206ecdef5e982b1c80e6327584c68ebed1843b544af5fe2480292'

async function checkTransaction() {
  console.log('🔍 Checking EIP-7702 Transaction Details\n')

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http()
  })

  // Check the transaction receipt
  console.log('1️⃣ Checking upgrade transaction...')
  try {
    const receipt = await getTransactionReceipt(publicClient, { hash: UPGRADE_TX })
    console.log(`   Transaction Hash: ${UPGRADE_TX}`)
    console.log(`   Status: ${receipt.status === 'success' ? '✅ SUCCESS' : '❌ FAILED'}`)
    console.log(`   Gas Used: ${receipt.gasUsed}`)
    console.log(`   Block Number: ${receipt.blockNumber}`)
    console.log(`   🔗 Etherscan: https://sepolia.etherscan.io/tx/${UPGRADE_TX}\n`)
    
    if (receipt.status === 'reverted') {
      console.log('   ❌ Transaction was reverted - EIP-7702 failed')
      return
    }
  } catch (error) {
    console.log(`   ❌ Could not fetch transaction: ${error}`)
    return
  }

  // Check if the correct EOA has code
  console.log('2️⃣ Checking the correct EOA address...')
  const code = await getCode(publicClient, { address: CORRECT_EOA })
  console.log(`   EOA Address: ${CORRECT_EOA}`)
  console.log(`   Has Code: ${code ? 'YES ✅' : 'NO ❌'}`)
  console.log(`   Code Length: ${code ? code.length : 0} chars`)
  console.log(`   🔗 Etherscan: https://sepolia.etherscan.io/address/${CORRECT_EOA}\n`)

  if (code && code !== '0x') {
    console.log('🎉 SUCCESS! EIP-7702 injection worked!')
    console.log('   The EOA now has smart contract code injected')
    console.log('   Your test was using the wrong address!')
  } else {
    console.log('❌ EIP-7702 injection failed')
    console.log('   Need to investigate why the transaction succeeded but no code was set')
  }
}

checkTransaction()