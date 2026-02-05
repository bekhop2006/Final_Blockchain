// Minimal ABIs for frontend. Full ABIs are in contracts/artifacts after compile.

export const REWARD_TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function mint(address to, uint256 amount)"
];

export const CASHBACK_NFT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function tokenOfOwnerByIndex(address, uint256) view returns (uint256)",
  "function cashbackPercent(uint256) view returns (uint8)",
  "function mint(address to, uint8 percent) returns (uint256)"
];

export const DELIVERY_CROWDFUND_ABI = [
  "function createCampaign(string title, uint256 goal, uint256 deadline) returns (uint256)",
  "function contribute(uint256 campaignId) payable",
  "function finalize(uint256 campaignId)",
  "function refund(uint256 campaignId)",
  "function getCampaign(uint256) view returns (uint256 id, string title, uint256 goal, uint256 deadline, uint256 totalContributed, uint8 status, address creator)",
  "function getContribution(uint256 campaignId, address user) view returns (uint256)",
  "function getCampaignCount() view returns (uint256)",
  "function rewardToken() view returns (address)",
  "function cashbackNFT() view returns (address)"
];
