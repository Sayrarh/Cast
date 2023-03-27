import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require("dotenv").config();


// const config: HardhatUserConfig = {
//   solidity: "0.8.4",
//   networks: {
//     hardhat: {
//       forking: {
//       url: process.env.MUMBAI_API,
//    }
//   },
//   mumbai: {
//     url: process.env.MUMBAI_API,
//       // @ts-ignore
//     accounts: [process.env.SECRET],
//     gas: 2100000,
//     gasPrice: 8000000000,
//     blockGasLimit: 200000000000,
//   },
//   etherscan: {
//     apiKey: {
//       polygonMumbai: "1PUJPJGSC1I7S7CPZVBQE8N5BB1A3ZK5RN"
//     }
//   }
// };

// export default config;

module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: {
      forking: {
        url: process.env.MAINNET_API,
      }
    },
    mumbai: {
      url: process.env.MUMBAI_API,
            // @ts-ignore
          accounts: [process.env.SECRET],
          gas: 2100000,
          gasPrice: 8000000000,
          blockGasLimit: 200000000000,
    },
  },

  etherscan: {
    apiKey: {
            polygonMumbai: [process.env.ETHERSCAN_API_KEY]
          }
  },
};