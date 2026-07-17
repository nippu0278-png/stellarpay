# Stellar Level 3 Audit & Validation Report

This validation report serves as official audit evidence demonstrating that the smart contract source code, frontend-to-contract integrations, and function mappings comply fully with Stellar Level 3 requirements.

---

## 1. Smart Contract Source Files

Every Soroban contract contains a visible `src/lib.rs` file. All contract files are fully committed and tracked in version control, with none excluded via `.gitignore`.

### A. Student Registry Contract
* **Contract Name:** `StudentRegistryContract`
* **Directory Path:** [contract/student_registry/](file:///c:/Projects/Stellar%20projects/stellarpay-nippu/contract/student_registry/)
* **Source Code Entrypoint:** [contract/student_registry/src/lib.rs](file:///c:/Projects/Stellar%20projects/stellarpay-nippu/contract/student_registry/src/lib.rs)
* **Git Status:** Committed and Tracked.
* **On-Chain Testnet Contract ID:** `CBZD7SUMJYITJLX33IS3IXIIIPS7TRO5IM5TAGKJNINVY3I6O44VK56P`

### B. Reward Vault Contract
* **Contract Name:** `RewardVaultContract`
* **Directory Path:** [contract/reward_vault/](file:///c:/Projects/Stellar%20projects/stellarpay-nippu/contract/reward_vault/)
* **Source Code Entrypoint:** [contract/reward_vault/src/lib.rs](file:///c:/Projects/Stellar%20projects/stellarpay-nippu/contract/reward_vault/src/lib.rs)
* **Git Status:** Committed and Tracked.
* **On-Chain Testnet Contract ID:** `CCE45FVYK5ZZHG2JHJZ5LMZKDH7P3IDBIKHE7RQLDBWEBSDZLPIX42QL`

---

## 2. Frontend Integration Files

The frontend application connects to the Soroban RPC nodes to simulate, sign, and submit smart contract transactions. All integration files are fully committed and tracked.

* **Primary Stellar Service:** [src/services/stellar.ts](file:///c:/Projects/Stellar%20projects/stellarpay-nippu/src/services/stellar.ts)
  * Implements `simulateAndSubmitSorobanTransaction()`, which handles ledger simulation, footprint assembly, Freighter wallet signature callbacks, transaction broadcasting, and ledger validation status polling.
* **Student Rewards Page:** [src/pages/StudentRewards.tsx](file:///c:/Projects/Stellar%20projects/stellarpay-nippu/src/pages/StudentRewards.tsx)
  * Provides the UI for students to earn points and claim rewards.
* **Contract Explorer Page:** [src/pages/ContractExplorer.tsx](file:///c:/Projects/Stellar%20projects/stellarpay-nippu/src/pages/ContractExplorer.tsx)
  * Provides direct contract interaction inputs and logs.

---

## 3. Frontend to Contract Function Mapping

Below is the verified direct mapping between frontend JavaScript/TypeScript functions and Soroban Rust smart contract entrypoint functions:

| Frontend UI Action / Function | Source File Location | Smart Contract Function called | Smart Contract Source File Location |
| :--- | :--- | :--- | :--- |
| **`registerStudent()`** | [`StudentRewards.tsx:L93-131`](file:///c:/Projects/Stellar%20projects/stellarpay-nippu/src/pages/StudentRewards.tsx#L93-L131) <br> [`ContractExplorer.tsx:L56-99`](file:///c:/Projects/Stellar%20projects/stellarpay-nippu/src/pages/ContractExplorer.tsx#L56-L99) | `register_student` | [`reward_vault/src/lib.rs:L42-47`](file:///c:/Projects/Stellar%20projects/stellarpay-nippu/contract/reward_vault/src/lib.rs#L42-L47) (cross-contract wrapper) <br> [`student_registry/src/lib.rs:L16-21`](file:///c:/Projects/Stellar%20projects/stellarpay-nippu/contract/student_registry/src/lib.rs#L16-L21) |
| **`rewardStudent()`** | [`StudentRewards.tsx:L134-168`](file:///c:/Projects/Stellar%20projects/stellarpay-nippu/src/pages/StudentRewards.tsx#L134-L168) <br> [`ContractExplorer.tsx:L102-146`](file:///c:/Projects/Stellar%20projects/stellarpay-nippu/src/pages/ContractExplorer.tsx#L102-L146) | `reward_student` | [`reward_vault/src/lib.rs:L50-70`](file:///c:/Projects/Stellar%20projects/stellarpay-nippu/contract/reward_vault/src/lib.rs#L50-L70) |
| **`claimReward()`** | [`StudentRewards.tsx:L171-207`](file:///c:/Projects/Stellar%20projects/stellarpay-nippu/src/pages/StudentRewards.tsx#L171-L207) | `claim_reward` | [`reward_vault/src/lib.rs:L79-98`](file:///c:/Projects/Stellar%20projects/stellarpay-nippu/contract/reward_vault/src/lib.rs#L79-L98) |

---

## 4. Verification & Testing

Rust unit and integration tests are verified locally and execute successfully during build cycles.

* **Registry Tests:** Defined in [student_registry/src/lib.rs:L38-60](file:///c:/Projects/Stellar%20projects/stellarpay-nippu/contract/student_registry/src/lib.rs#L38-L60) (`test_registration`).
* **Vault Tests:** Defined in [reward_vault/src/lib.rs:L106-161](file:///c:/Projects/Stellar%20projects/stellarpay-nippu/contract/reward_vault/src/lib.rs#L106-L161) (`test_rewards_vault_flow`, `test_unregistered_student_rewards`).
