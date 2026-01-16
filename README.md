# TRX WalletConnect App

React приложение для подключения кошелька через WalletConnect и отправки транзакций в сети TRON.

## Функциональность

- ✅ Подключение кошелька через WalletConnect
- ✅ Отключение кошелька
- ✅ Отправка 1 USDT в сети TRON
- ✅ Получение и отображение txHash транзакции

## Установка

```bash
npm install
```

## Настройка

Перед использованием необходимо:

1. Получить Project ID от WalletConnect:
   - Зарегистрируйтесь на [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Создайте проект и получите Project ID
   - Замените `YOUR_PROJECT_ID` в файле `src/components/Wallet.jsx`

2. (Опционально) Измените адрес получателя:
   - В файле `src/components/Wallet.jsx` измените `RECIPIENT_ADDRESS`

## Запуск

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

## Сборка

```bash
npm run build
```

## Используемые технологии

- React 18
- Vite
- @tronweb3/walletconnect-tron
- TronWeb

# TRX-WalletConnect
