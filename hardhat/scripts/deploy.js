const hre = require("hardhat");

async function main() {
  // 1. Get the deployer's account 
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying ERC20 token using account:", deployer.address);

  // Check balance before deploy (helps catch low-funds issues early)
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");


  const Token = await hre.ethers.getContractFactory("ZToken");


 const initialSupply = hre.ethers.parseUnits("25000", 18); 
  // 4. Deploy the contract
  console.log("Deploying... (please wait for confirmation)");
  const token = await Token.deploy(initialSupply);

  // 5. Wait for the transaction to be mined
  await token.waitForDeployment();

  // 6. Log useful info
  const deployedAddress = await token.getAddress();
  console.log("✅myToken deployed to:", deployedAddress);

  // Optional: Log initial balance of deployer
  const deployerBalance = await token.balanceOf(deployer.address);
  console.log("Initial supply minted to deployer:", hre.ethers.formatUnits(deployerBalance, 18), "tokens");

  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting 30 seconds before verifying (give the block explorers time to index)...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log("Verifying contract on explorer...");
    await hre.run("verify:verify", {
      address: deployedAddress,
      constructorArguments: [initialSupply],
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