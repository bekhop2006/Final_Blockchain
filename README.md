# Crypto Delivery DApp

Курьерская доставка с оплатой в ETH, кэшбеком в NFT (ERC721) и бонусными токенами (ERC20). Ethereum testnet (Sepolia / Holesky).

## Структура

- **contracts/** — Solidity: RewardToken (ERC20), CashbackNFT (ERC721), DeliveryCrowdfund
- **frontend/** — React + Vite + ethers.js

## Запуск

### 1. Контракты

```bash
cd contracts
npm install
npm run compile
```

Деплой на Sepolia (нужен PRIVATE_KEY в .env):

```bash
# contracts/.env
PRIVATE_KEY=ваш_приватный_ключ
```

```bash
npm run deploy
```

После деплоя скопируйте адреса в `frontend/.env`:

```
VITE_DELIVERY_ADDRESS=0x...
VITE_REWARD_TOKEN_ADDRESS=0x...
VITE_CASHBACK_NFT_ADDRESS=0x...
```

### 2. Фронтенд

```bash
cd frontend
npm install
npm run dev
```

Откройте http://localhost:5173. Подключите MetaMask к Sepolia/Holesky и получите test ETH (faucet).

## Логика

- **Каталог и корзина** — off-chain (JSON).
- **Оплата** — ETH в контракт `DeliveryCrowdfund.contribute(campaignId)`.
- При оплате: начисляются ERC20 (CDR), минтится NFT кэшбек (1% / 3% / 5% в зависимости от суммы).
- **Кампания** = заказ: создаётся через `createCampaign`, после дедлайна создатель вызывает `finalize`; при неуспехе — `refund`.
