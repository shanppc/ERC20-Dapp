// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");   // or whatever you have
require("dotenv").config();                  

const { ALCHEMY_API_KEY, PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.20",   // or your version

  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],   // avoids crash if missing
    },
    // add localhost / hardhat network if needed
  },

  // optional: for contract verification
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};