
const hre = require("hardhat");

async function main() {

  const Token = await hre.ethers.getContractFactory("PollyaDev");
  const token = await Token.deploy();
  await token.deployed();
  console.log("ERC20 Token contract deployed address: ", token.address);

  const Market = await hre.ethers.getContractFactory("PollyaDev");
  const market = await Market.deploy(token.address);
  await market.deployed();
  console.log("Marketplace contract deployed address: ", market.address);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
