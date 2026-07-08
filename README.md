# StellarPay Student Wallet - Level 1

StellarPay is a production-quality Stellar dApp designed specifically for students. It combines the speed of the Stellar network with the power of Soroban smart contracts to create a modern, rewarding payment ecosystem.

---

## 🚀 Features

- **Freighter Wallet Integration**: Seamless authentication, connection management, and secure browser transaction signing.
- **XLM Payments**: Send instant, low-cost payments across the globe on the Stellar Testnet.
- **Balance Handling**: Real-time native XLM balance fetching from Horizon servers and auto-refresh after transaction submission.
- **Error Handling**: Displays visual warnings for missing extensions, invalid public addresses, and insufficient balances.
- **Premium UI**: Glassmorphic dark theme with smooth hover state indicators and responsive layouts across mobile and desktop.

---

## 🛠 Tech Stack

- **Frontend**: React, Vite, TypeScript
- **Routing**: React Router (`react-router-dom`)
- **Styling**: Tailwind CSS v3, Material Symbols Icons
- **Blockchain**: Stellar SDK (`stellar-sdk`), Freighter Wallet API (`@stellar/freighter-api`)
- **Network**: Stellar Testnet

---

## 📋 Installation & Getting Started

1. **Clone the Repository**
   ```bash
   git clone <repository_url>
   cd stitch_stellarpay_student_wallet
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_NETWORK=testnet
   VITE_CONTRACT_ID=CDUI3V6W7G3E5W6K3U4I5O6E7P8A9S0D1F2G3H4J5K6L7M8N9O0P1Q2R
   ```

4. **Run Locally**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

5. **Build for Production**
   ```bash
   npm run build
   ```

---

## 🦊 Freighter Wallet Setup Guide

Freighter is a browser extension that enables you to sign Stellar transactions.

1. **Install Freighter**:
   Download and install the extension from [freighter.app](https://www.freighter.app/) for your browser (Chrome, Firefox, Edge).

2. **Create/Import Account**:
   Open the extension, set up a secure password, and write down your 12-word recovery mnemonic phrase.

3. **Switch to Stellar Testnet**:
   - Open the Freighter extension window.
   - Click the gear/settings icon in the bottom right.
   - Go to **Network** (or select active network at the top).
   - Choose **Testnet** (Stellar Testnet Network).

---

## 🌟 Funding Your Testnet Wallet (Stellar Friendbot)

To send transactions, your newly created Testnet account needs XLM to establish its starting balance.

1. **Copy Wallet Address**:
   Open Freighter and copy your public address (starts with `G...`).

2. **Request Test Funds (Friendbot)**:
   - Go to the [Stellar Laboratory Friendbot Tool](https://laboratory.stellar.org/#account-creator?network=testnet).
   - Paste your public key into the "Friendbot: Fund a Test Network Account" input field.
   - Click **Get Test Network XLM**.
   - Your account is now active on the testnet with 10,000 test XLM!

---

## 📷 Screenshots (Level 1 Verification)

- **Landing Page & Connection Flow**: Accessible on home page routing (`/`).
- **Dashboard Balance Cards**: View native balances and refresh buttons after wallet connection (`/dashboard`).
- **Payment Transfer Screen**: Recipient address input, amount validators, and memo logs (`/send`).
- **Successful Transaction Receipts**: Displays confirmed status and copyable Transaction Hashes.
- **Settings Info**: System details and logout configurations (`/settings`).

---

## 🌐 Deployed Smart Contract (Level 2 Testnet Proof)

The Soroban smart contract is deployed on the Stellar Testnet:

- **Contract ID**: `CCE45FVYK5ZZHG2JHJZ5LMZKDH7P3IDBIKHE7RQLDBWEBSDZLPIX42QL`
- **Stellar.expert Explorer Link**: [Stellar.expert Testnet Explorer - Contract CCE45F...](https://stellar.expert/explorer/testnet/contract/CCE45FVYK5ZZHG2JHJZ5LMZKDH7P3IDBIKHE7RQLDBWEBSDZLPIX42QL)

