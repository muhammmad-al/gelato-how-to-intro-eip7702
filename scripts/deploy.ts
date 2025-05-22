import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying SimpleWallet to Sepolia...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  
  console.log("📋 Deployment Details:");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Deploy SimpleWallet
  console.log("🔄 Deploying SimpleWallet...");
  const SimpleWallet = await ethers.getContractFactory("SimpleWallet");
  const simpleWallet = await SimpleWallet.deploy();
  
  // Wait for deployment
  await simpleWallet.waitForDeployment();
  const address = await simpleWallet.getAddress();
  
  console.log("✅ SimpleWallet deployed successfully!\n");
  
  // Display results
  console.log("📋 Contract Information:");
  console.log(`   Contract Address: ${address}`);
  console.log(`   Transaction Hash: ${simpleWallet.deploymentTransaction()?.hash}`);
  console.log(`   Block Number: ${simpleWallet.deploymentTransaction()?.blockNumber}`);
  console.log(`   Etherscan: https://sepolia.etherscan.io/address/${address}\n`);
  
  // Verify initial state
  console.log("🔍 Verifying deployment...");
  const nonce = await simpleWallet.nonce();
  const balance = await simpleWallet.getBalance();
  
  console.log(`   Initial nonce: ${nonce}`);
  console.log(`   Initial balance: ${ethers.formatEther(balance)} ETH`);
  
  console.log("\n✨ Deployment complete!");
  console.log(`\n📝 Update demo.ts with this address:`);
  console.log(`const SIMPLE_WALLET_ADDRESS = '${address}'`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }); 