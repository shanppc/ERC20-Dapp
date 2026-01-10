// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");  
require("dotenv").config();                  

const { ALCHEMY_API_KEY, PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.20",   

  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],   
    },
    
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};