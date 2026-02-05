// Set these after deploying contracts (or use .env)
const SEPOLIA_CHAIN_ID = 11155111;
const HOLESKY_CHAIN_ID = 17000;

export const SUPPORTED_CHAIN_IDS = [SEPOLIA_CHAIN_ID, HOLESKY_CHAIN_ID];

export const CHAIN_NAMES = {
  [SEPOLIA_CHAIN_ID]: "Sepolia",
  [HOLESKY_CHAIN_ID]: "Holesky",
};

// Replace with your deployed addresses after running: npm run deploy (in contracts/)
const env = (key) => import.meta.env[key] || "";

export const CONTRACT_ADDRESSES = {
  [SEPOLIA_CHAIN_ID]: {
    deliveryCrowdfund: env("VITE_DELIVERY_ADDRESS"),
    rewardToken: env("VITE_REWARD_TOKEN_ADDRESS"),
    cashbackNFT: env("VITE_CASHBACK_NFT_ADDRESS"),
  },
  [HOLESKY_CHAIN_ID]: {
    deliveryCrowdfund: env("VITE_DELIVERY_ADDRESS"),
    rewardToken: env("VITE_REWARD_TOKEN_ADDRESS"),
    cashbackNFT: env("VITE_CASHBACK_NFT_ADDRESS"),
  },
};

export function getContracts(chainId) {
  return CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID];
}
