const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const RewardToken = await hre.ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardToken.deploy();
  await rewardToken.waitForDeployment();
  const rewardTokenAddress = await rewardToken.getAddress();
  console.log("RewardToken deployed to:", rewardTokenAddress);

  const CashbackNFT = await hre.ethers.getContractFactory("CashbackNFT");
  const cashbackNFT = await CashbackNFT.deploy();
  await cashbackNFT.waitForDeployment();
  const cashbackNFTAddress = await cashbackNFT.getAddress();
  console.log("CashbackNFT deployed to:", cashbackNFTAddress);

  const DeliveryCrowdfund = await hre.ethers.getContractFactory("DeliveryCrowdfund");
  const delivery = await DeliveryCrowdfund.deploy(rewardTokenAddress, cashbackNFTAddress);
  await delivery.waitForDeployment();
  const deliveryAddress = await delivery.getAddress();
  console.log("DeliveryCrowdfund deployed to:", deliveryAddress);

  // Передаём владение токенов контракту DeliveryCrowdfund (только он может минтить)
  await rewardToken.transferOwnership(deliveryAddress);
  await cashbackNFT.transferOwnership(deliveryAddress);
  console.log("Ownership of RewardToken and CashbackNFT transferred to DeliveryCrowdfund");

  console.log("\n--- Summary ---");
  console.log("REWARD_TOKEN=", rewardTokenAddress);
  console.log("CASHBACK_NFT=", cashbackNFTAddress);
  console.log("DELIVERY_CROWDFUND=", deliveryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
