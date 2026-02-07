# Crypto Delivery DApp

Курьерская доставка с оплатой в ETH, кэшбеком в NFT (ERC721) и бонусными токенами (ERC20). Ethereum testnet (Sepolia / Holesky).

## Структура

- **contracts/** — Solidity: RewardToken (ERC20), CashbackNFT (ERC721), DeliveryCrowdfund
- **backend/** — Node.js (Express), MongoDB, авторизация (JWT, регистрация/вход)
- **frontend/** — React + Vite + ethers.js

## Запуск

Рекомендуется Node.js 18 или 20 (Hardhat может предупреждать на Node 25+).

### 1. Контракты

```bash
cd contracts
npm install
npm run compile
```

**Деплой на Sepolia**

**Зачем нужен PRIVATE_KEY:** чтобы отправить транзакции в сеть (деплой контрактов), скрипт должен подписать их от имени кошелька. Для подписи используется приватный ключ. С этого же кошелька спишется комиссия (gas) в test ETH — поэтому на нём должны быть тестовые ETH.

**Как сделать (только для testnet, не используйте кошелёк с реальными деньгами):**

1. Создайте в папке `contracts/` файл с именем `.env` (точка в начале).

2. **Как получить приватный ключ в MetaMask:**
   - Откройте расширение MetaMask.
   - Нажмите на три точки (⋮) рядом с названием кошелька.
   - Выберите **«Детали счёта»** (Account details).
   - Внизу нажмите **«Экспорт приватного ключа»** (Export private key).
   - Введите пароль от MetaMask и подтвердите.
   - Скопируйте длинную строку (64 символа, иногда с префиксом `0x`) — это и есть приватный ключ. Никому не показывайте и не отправляйте его.

3. В `.env` напишите одну строку (подставьте свой ключ):
   ```
   PRIVATE_KEY=ваш_скопированный_приватный_ключ
   ```

4. Убедитесь, что в MetaMask выбрана сеть **Sepolia** и на счёте есть test ETH (если нет — получите с [sepoliafaucet.com](https://sepoliafaucet.com) или другого faucet).

5. В терминале из папки `contracts/` выполните:
   ```bash
   npm run deploy
   ```

Файл `.env` не коммитьте в git (он уже в .gitignore). Это защищает ключ от попадания в репозиторий.

После деплоя скопируйте адреса в `frontend/.env`:

```
VITE_DELIVERY_ADDRESS=0x...
VITE_REWARD_TOKEN_ADDRESS=0x...
VITE_CASHBACK_NFT_ADDRESS=0x...
```

### 2. Бэкенд (авторизация + MongoDB)

Установите и запустите MongoDB локально (например, с [mongodb.com](https://www.mongodb.com/try/download/community) или `brew install mongodb-community` на Mac).

```bash
cd backend
cp .env.example .env
# При необходимости отредактируйте .env (MONGODB_URI, JWT_SECRET)
npm install
npm run dev
```

Сервер будет доступен на http://localhost:3001. API: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.

### 3. Фронтенд

В `frontend/.env` можно задать адрес бэкенда: `VITE_API_URL=http://localhost:3001` (по умолчанию так и есть).

```bash
cd frontend
npm install
npm run dev
```

Откройте http://localhost:5173. В профиле доступны «Войти / Регистрация» (аккаунт в MongoDB). Подключите MetaMask к Sepolia/Holesky и получите test ETH (faucet).

## Логика

- **Каталог и корзина** — off-chain (JSON).
- **Оплата** — клиент платит ETH в контракт `DeliveryCrowdfund.contribute(campaignId)`.
- **Прикол проекта:** клиент получает наши токены (CDR, ERC20) как бонусы и может использовать их в приложении — например, для скидки при следующем заказе (в корзине: «Списать бонусы на скидку»).
- При каждой оплате также минтится NFT-кэшбек (1% / 3% / 5% в зависимости от суммы).
- **Кампания** = заказ: создаётся через `createCampaign`, после дедлайна создатель вызывает `finalize`; при неуспехе — `refund`.

## Примечание по npm audit

В `contracts/` после `npm install` выводится 31 уязвимость (22 low, 9 moderate) в транзитивных зависимостях Hardhat (cookie, elliptic, tmp, undici). Исправление без перехода на Hardhat 3.x недоступно и потребует breaking changes. Для учебного проекта, работающего только в testnet и без хранения секретов в коде, это допустимо. Не используйте этот набор зависимостей в production без обновления стека.
