import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const RewardToken = await ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardToken.deploy();
  await rewardToken.waitForDeployment();
  const rewardTokenAddress = await rewardToken.getAddress();
  console.log("RewardToken deployed to:", rewardTokenAddress);

  const CashbackNFT = await ethers.getContractFactory("CashbackNFT");
  const cashbackNFT = await CashbackNFT.deploy();
  await cashbackNFT.waitForDeployment();
  const cashbackNFTAddress = await cashbackNFT.getAddress();
  console.log("CashbackNFT deployed to:", cashbackNFTAddress);

  const DeliveryCrowdfund = await ethers.getContractFactory("DeliveryCrowdfund");
  const delivery = await DeliveryCrowdfund.deploy(rewardTokenAddress, cashbackNFTAddress);
  await delivery.waitForDeployment();
  const deliveryAddress = await delivery.getAddress();
  console.log("DeliveryCrowdfund deployed to:", deliveryAddress);

  // Передаём владение токенов контракту DeliveryCrowdfund (только он может минтить)
  let tx = await rewardToken.transferOwnership(deliveryAddress);
  await tx.wait();
  console.log("RewardToken ownership transferred.");
  await new Promise((r) => setTimeout(r, 5000)); // пауза, чтобы не было "replacement transaction underpriced"
  tx = await cashbackNFT.transferOwnership(deliveryAddress);
  await tx.wait();
  console.log("CashbackNFT ownership transferred.");
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
