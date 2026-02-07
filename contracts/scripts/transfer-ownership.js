/**
 * Одноразовый скрипт: передать владение RewardToken и CashbackNFT
 * контракту DeliveryCrowdfund (адреса из твоего последнего деплоя).
 */
import { network } from "hardhat";

const REWARD_TOKEN = "0x2E0AE5a5e25F3BD123fE4B9f9BB2985a75c2eBca";
const CASHBACK_NFT = "0xb8464627D7c9C3F1945020D072cc885a63BCfb8c";
const DELIVERY_CROWDFUND = "0x29E196181bCe4Edf46BcbF46098DA781865abD6b";

async function main() {
  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);

  const rewardToken = await ethers.getContractAt("RewardToken", REWARD_TOKEN);
  const cashbackNFT = await ethers.getContractAt("CashbackNFT", CASHBACK_NFT);

  const rewardOwner = await rewardToken.owner();
  const nftOwner = await cashbackNFT.owner();

  if (rewardOwner.toLowerCase() !== DELIVERY_CROWDFUND.toLowerCase()) {
    console.log("Transferring RewardToken ownership...");
    const tx1 = await rewardToken.transferOwnership(DELIVERY_CROWDFUND);
    await tx1.wait();
    console.log("RewardToken done.");
    await new Promise((r) => setTimeout(r, 8000));
  } else {
    console.log("RewardToken already owned by DeliveryCrowdfund, skip.");
  }

  if (nftOwner.toLowerCase() !== DELIVERY_CROWDFUND.toLowerCase()) {
    console.log("Transferring CashbackNFT ownership...");
    const tx2 = await cashbackNFT.transferOwnership(DELIVERY_CROWDFUND);
    await tx2.wait();
    console.log("CashbackNFT done.");
  } else {
    console.log("CashbackNFT already owned by DeliveryCrowdfund, skip.");
  }

  console.log("Ownership transfer complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
