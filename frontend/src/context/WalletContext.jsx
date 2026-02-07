import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BrowserProvider } from "ethers";
import { DELIVERY_CROWDFUND_ABI, REWARD_TOKEN_ABI, CASHBACK_NFT_ABI } from "../contracts/abis";
import { SUPPORTED_CHAIN_IDS, CHAIN_NAMES, getContracts } from "../config";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balanceEth, setBalanceEth] = useState("0");
  const [balanceToken, setBalanceToken] = useState("0");
  const [nftCount, setNftCount] = useState(0);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [deliveryContract, setDeliveryContract] = useState(null);
  const [rewardTokenContract, setRewardTokenContract] = useState(null);
  const [cashbackNFTContract, setCashbackNFTContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const contracts = chainId ? getContracts(chainId) : null;
  const isCorrectNetwork = chainId && SUPPORTED_CHAIN_IDS.includes(Number(chainId));

  const updateBalances = useCallback(async () => {
    if (!signer || !account || !contracts?.rewardToken || !contracts?.cashbackNFT) return;
    try {
      const [ethBal, tokenContract, nftContract] = await Promise.all([
        provider.getBalance(account),
        new (await import("ethers")).Contract(contracts.rewardToken, REWARD_TOKEN_ABI, provider),
        new (await import("ethers")).Contract(contracts.cashbackNFT, CASHBACK_NFT_ABI, provider),
      ]);
      setBalanceEth(ethBal.toString());
      const tokenBal = await tokenContract.balanceOf(account);
      setBalanceToken(tokenBal.toString());
      const nftBal = await nftContract.balanceOf(account);
      setNftCount(Number(nftBal));
    } catch (e) {
      console.warn("Update balances:", e.message);
    }
  }, [account, provider, signer, contracts]);

  const connect = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (!window.ethereum) throw new Error("Установите MetaMask");
      const prov = new BrowserProvider(window.ethereum);
      const accounts = await prov.send("eth_requestAccounts", []);
      const network = await prov.getNetwork();
      setProvider(prov);
      setSigner(await prov.getSigner());
      setAccount(accounts[0]);
      setChainId(String(network.chainId));

      const c = getContracts(Number(network.chainId));
      if (c?.deliveryCrowdfund) {
        const { Contract } = await import("ethers");
        setDeliveryContract(new Contract(c.deliveryCrowdfund, DELIVERY_CROWDFUND_ABI, await prov.getSigner()));
      }
    } catch (e) {
      setError(e.message || "Ошибка подключения");
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setBalanceEth("0");
    setBalanceToken("0");
    setNftCount(0);
    setProvider(null);
    setSigner(null);
    setDeliveryContract(null);
    setRewardTokenContract(null);
    setCashbackNFTContract(null);
    setError(null);
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum || !SUPPORTED_CHAIN_IDS[0]) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + SUPPORTED_CHAIN_IDS[0].toString(16) }],
      });
    } catch (e) {
      console.warn(e);
    }
  }, []);

  useEffect(() => {
    if (!account || !provider) return;
    updateBalances();
    const interval = setInterval(updateBalances, 15000);
    return () => clearInterval(interval);
  }, [account, provider, updateBalances]);

  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.on("accountsChanged", (accounts) => {
      setAccount(accounts[0] || null);
      if (!accounts[0]) setSigner(null);
    });
    window.ethereum.on("chainChanged", () => window.location.reload());
  }, []);

  useEffect(() => {
    if (!signer || !contracts?.deliveryCrowdfund) return;
    (async () => {
      const { Contract } = await import("ethers");
      setDeliveryContract(new Contract(contracts.deliveryCrowdfund, DELIVERY_CROWDFUND_ABI, signer));
      setRewardTokenContract(new Contract(contracts.rewardToken, REWARD_TOKEN_ABI, signer));
      setCashbackNFTContract(new Contract(contracts.cashbackNFT, CASHBACK_NFT_ABI, signer));
    })();
  }, [signer, contracts]);

  const value = {
    account,
    chainId,
    balanceEth,
    balanceToken,
    nftCount,
    provider,
    signer,
    deliveryContract,
    rewardTokenContract,
    cashbackNFTContract,
    loading,
    error,
    isCorrectNetwork,
    chainName: chainId ? CHAIN_NAMES[Number(chainId)] : null,
    connect,
    disconnect,
    switchNetwork,
    updateBalances,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
