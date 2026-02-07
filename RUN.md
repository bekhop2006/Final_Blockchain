# Как запустить проект Crypto Delivery

Пошаговая инструкция для локального запуска фронтенда, бэкенда и работы с контрактами в сети Sepolia.

---

## Что нужно установить

- **Node.js** 18+
- **MongoDB** (локально или Docker)
- **MetaMask** с сетью Sepolia и тестовым ETH
- Ключ от RPC Sepolia (например [Alchemy](https://www.alchemy.com/) или публичный RPC)

---

## 1. Контракты (Sepolia)

### 1.1. Переменные окружения

В папке `contracts/` создайте файл `.env`:

```env
PRIVATE_KEY=0x...ваш_приватный_ключ_кошелька
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

Либо используйте свой RPC (Alchemy, Infura и т.д.).

### 1.2. Установка и деплой

```bash
cd contracts
npm install
npm run compile
npm run deploy
```

После деплоя в консоли появятся адреса контрактов. Сохраните их.

### 1.3. Передача прав на токены

Чтобы оплата и бонусы работали, право владения токенами должно быть у контракта доставки:

```bash
npm run transfer-ownership
```

(Подставьте в скрипт адреса из шага 1.2, если используете свои.)

### 1.4. Адреса в фронтенд

Скопируйте адреса в `frontend/.env`:

```env
VITE_DELIVERY_ADDRESS=0x...
VITE_REWARD_TOKEN_ADDRESS=0x...
VITE_CASHBACK_NFT_ADDRESS=0x...
```

---

## 2. Бэкенд (API + авторизация)

### 2.1. Переменные окружения

В папке `backend/` уже должен быть файл `.env`. Если нет — создайте по образцу `.env.example`:

```env
MONGODB_URI=mongodb://localhost:27017/crypto_delivery
JWT_SECRET=your-super-secret-key-change-in-production
PORT=3001
```

### 2.2. Запуск MongoDB

Убедитесь, что MongoDB запущен локально (порт 27017), либо измените `MONGODB_URI` (например, для Docker или Atlas).

### 2.3. Запуск сервера

```bash
cd backend
npm install
npm run dev
```

API будет доступен по адресу: **http://localhost:3001**

---

## 3. Фронтенд

### 3.1. Переменные окружения

В папке `frontend/` файл `.env` должен содержать:

```env
VITE_API_URL=http://localhost:3001
VITE_DELIVERY_ADDRESS=0x...
VITE_REWARD_TOKEN_ADDRESS=0x...
VITE_CASHBACK_NFT_ADDRESS=0x...
```

### 3.2. Запуск

```bash
cd frontend
npm install
npm run dev
```

Откройте в браузере адрес, который покажет Vite (обычно **http://localhost:5173**).

---

## Порядок запуска

1. Запустить **MongoDB**.
2. Запустить **бэкенд**: `cd backend && npm run dev`.
3. Запустить **фронтенд**: `cd frontend && npm run dev`.
4. В MetaMask выбрать сеть **Sepolia** и подключить кошелёк на сайте.

Контракты деплоятся один раз; при следующем запуске нужны только бэкенд и фронтенд (и актуальные адреса в `frontend/.env`).

---

## Частые проблемы

| Проблема | Решение |
|----------|--------|
| «replacement transaction underpriced» при деплое | Подождать минуту и повторить деплой или transfer-ownership. |
| «execution reverted» при оплате | Выполнить `npm run transfer-ownership` в `contracts/`. |
| Ошибка подключения к API | Проверить, что бэкенд запущен и в `frontend/.env` указан `VITE_API_URL=http://localhost:3001`. |
| Ошибка MongoDB | Убедиться, что MongoDB запущен и `MONGODB_URI` в `backend/.env` верный. |
