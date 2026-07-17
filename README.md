# StellarPay

### Decentralized Student Wallet & Soroban Rewards Platform

🎥 **Demo Video**

https://drive.google.com/file/d/1n7bFCVEpt_LJg8dm9rIj_mqfqmmbOjBn/view?usp=sharing 

🌐 **Live Demo**

[StellarPay Live App](https://stellarpay-phi.vercel.app/)

---

# Overview

StellarPay is a production-quality Stellar dApp designed specifically for students. It combines the speed of the Stellar network with the power of Soroban smart contracts to create a modern, rewarding payment ecosystem.

This repository contains both the **Soroban smart contracts** and the **Vite React frontend**, fully integrated and deployed on the Stellar Testnet.

---

# Features

- **Multi-Wallet Support**: Freighter, Albedo, Private Secret Keys, BIP-39 Recovery Mnemonics, and Read-Only Address modes.
- **Smart Contract Rewards**: Points minting and claims on the Stellar Testnet.
- **Inter-Contract Architecture**: `RewardVault` contract verifies registration on `StudentRegistry` on-chain before executing actions.
- **Real-Time Logging**: Live transaction streaming and log terminal in the explorer view.
- **High-Contrast Design**: Sleek, responsive monochromatic light/dark interface.
- **CI/CD Build Pipeline**: Automatic testing and build validation via GitHub Actions.

---

# Tech Stack

## Frontend
- React
- Vite
- Tailwind CSS & Vanilla CSS
- TypeScript

## Blockchain
- `@stellar/stellar-sdk`
- Horizon API
- Soroban RPC

## Wallets
- Freighter
- Albedo
- BIP-39 local keys

---

# Architecture

```mermaid
flowchart TD
    User --> Wallet
    Wallet --> Frontend
    Frontend --> SorobanRPC
    SorobanRPC --> RewardVault[Reward Vault Contract]
    RewardVault -->|Cross-Contract Check| StudentRegistry[Student Registry Contract]
    RewardVault --> StellarTestnet
    StudentRegistry --> StellarTestnet
```

---

# On-Chain Deployments (Stellar Testnet)

- **Student Registry Contract ID**: `CBZD7SUMJYITJLX33IS3IXIIIPS7TRO5IM5TAGKJNINVY3I6O44VK56P`
- **Reward Vault Contract ID**: `CCE45FVYK5ZZHG2JHJZ5LMZKDH7P3IDBIKHE7RQLDBWEBSDZLPIX42QL`
- **Vault Link Initialization Hash**: `80a65f7740a0b589e1a9424bf98600e12ea8d2ef`

---

# Screenshots

### CI/CD Pipeline Running
<img width="959" height="474" alt="image" src="https://github.com/user-attachments/assets/d8602c20-7a7e-491f-a2d4-d17e16adcec4" />


### Mobile UI Screenshot 
<img width="202" height="401" alt="image" src="https://github.com/user-attachments/assets/1cd67b2d-6567-48ac-ab73-f42c0ff508bd" />


### Test case 
<img width="404" height="148" alt="image" src="https://github.com/user-attachments/assets/8ca1e81d-6fb8-43e2-87dd-af0ee15e2382" />

---

## 🌐 Deployed Smart Contract (Level 2 Testnet Proof)

The Soroban smart contract is deployed on the Stellar Testnet:

- **Contract ID**: `CCE45FVYK5ZZHG2JHJZ5LMZKDH7P3IDBIKHE7RQLDBWEBSDZLPIX42QL`
- **Stellar.expert Explorer Link**: [Stellar.expert Testnet Explorer - Contract CCE45F...](https://stellar.expert/explorer/testnet/contract/CCE45FVYK5ZZHG2JHJZ5LMZKDH7P3IDBIKHE7RQLDBWEBSDZLPIX42QL)

---

## 🛠️ Stellar Level 3 Verification & Function Mapping

All smart contract source files and frontend integrations are committed and fully tracked by Git. 

For full details, see the **[Stellar Level 3 Validation Report](stellar_level3_validation_report.md)**.

### Direct Function Mapping

* **`registerStudent() → register_student()`**
  * **Frontend Implementation:** [`StudentRewards.tsx`](src/pages/StudentRewards.tsx#L93-L131) and [`ContractExplorer.tsx`](src/pages/ContractExplorer.tsx#L56-L99) invoke this to register a new student address with a name.
  * **Contract Implementation:** [`reward_vault/src/lib.rs`](contract/reward_vault/src/lib.rs#L42-L47) (acting as a cross-contract wrapper) calls [`student_registry/src/lib.rs`](contract/student_registry/src/lib.rs#L16-L21).
* **`claimReward() → claim_reward()`**
  * **Frontend Implementation:** [`StudentRewards.tsx`](src/pages/StudentRewards.tsx#L171-L207) invokes this to spend/deduct points and redeem rewards.
  * **Contract Implementation:** [`reward_vault/src/lib.rs`](contract/reward_vault/src/lib.rs#L79-L98) verifies the student status on-chain and deducts points.
* **`rewardStudent() → reward_student()`**
  * **Frontend Implementation:** [`StudentRewards.tsx`](src/pages/StudentRewards.tsx#L134-L168) and [`ContractExplorer.tsx`](src/pages/ContractExplorer.tsx#L102-L146) invoke this to award points for completed educational milestones.
  * **Contract Implementation:** [`reward_vault/src/lib.rs`](contract/reward_vault/src/lib.rs#L50-L70) validates student registration and mints reward points.

---

# Getting Started

## Smart Contract Workspace
To run Rust contract tests locally:
```bash
cd contracts
cargo test
```

## Frontend Application
1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Run dev server**:
   ```bash
   npm run dev
   ```
3. **Build bundle**:
   ```bash
   npm run build
   ```
