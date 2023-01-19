require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */

// ---------------------- for Testing ------------------------

module.exports = {
  solidity: "0.8.17",
};


// ---------------------- for Deployment ------------------------
// require("dotenv").config();
// require("@nomiclabs/hardhat-etherscan");
// const { API_URL, PRIVATE_KEY, POLYGONSCAN_API_KEY } = process.env;
// module.exports = {
//   solidity: {
//     compilers: [
//       {
//         version: "0.8.17"
//       }
//     ]
//   },
//   defaultNetwork: "mumbai",
//   networks: {
//     hardhat: {},
//     mumbai: {
//       url: API_URL,
//       accounts: [`0x${PRIVATE_KEY}`],
//     },
//   },
//   etherscan: {
//     apiKey: POLYGONSCAN_API_KEY,
//   }
// };