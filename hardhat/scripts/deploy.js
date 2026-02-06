const hre = require("hardhat");

async function main() {
  // 1. Get the deployer's account 
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying using account:", deployer.address);

  // Check balance before deploy 
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");


  const contract = await hre.ethers.getContractFactory("Staking");


 const stakingToken = "0xE44a188329Dd840c6c4aBe5646376FF2e67c091D"; 
const rewardToken = "0x8934005bE3435eEA79c79F49071fe0bBFB0e1c89"; 
  // 4. Deploy the contract
  console.log("Deploying... (please wait for confirmation)");
  const stakingContract= await contract.deploy(stakingToken,rewardToken);

  // 5. Wait for the transaction to be mined
  await stakingContract.waitForDeployment();

  // 6. Log useful info
  const deployedAddress = await stakingContract.getAddress();
  console.log("Contract deployed to:", deployedAddress);

  // Optional: Log initial balance of deployer

  /*const deployerBalance = await token.balanceOf(deployer.address);
  console.log("Initial supply minted to deployer:", hre.ethers.formatUnits(deployerBalance, 18), "tokens"); */
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting 30 seconds before verifying (give the block explorers time to index)...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log("Verifying contract on explorer...");
    await hre.run("verify:verify", {
      address: deployedAddress,
      constructorArguments: [stakingToken,rewardToken],
    });
  }
}

// Standard error handling + exit
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });