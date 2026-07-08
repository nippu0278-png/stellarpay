#![no_std]
use soroban_sdk::{contract, contractimpl, contractclient, contracttype, Address, Env, String, log};

#[contractclient(name = "StudentRegistryClient")]
pub trait StudentRegistry {
    fn register_student(env: Env, student: Address, name: String);
    fn is_registered(env: Env, student: Address) -> bool;
    fn get_student_name(env: Env, student: Address) -> String;
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Registry,
    Points(Address),
    TotalRewards,
}

#[contract]
pub struct RewardVaultContract;

#[contractimpl]
impl RewardVaultContract {
    /// Initializes the RewardVault with the address of the StudentRegistry contract.
    pub fn initialize(env: Env, registry: Address) {
        if env.storage().instance().has(&DataKey::Registry) {
            panic!("Contract already initialized");
        }
        env.storage().instance().set(&DataKey::Registry, &registry);
        env.storage().instance().set(&DataKey::TotalRewards, &0u32);
    }

    /// Helper to get registry address.
    fn get_registry(env: &Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Registry)
            .expect("Contract not initialized")
    }

    /// Registers a student in the StudentRegistry.
    pub fn register_student(env: Env, student: Address, name: String) {
        student.require_auth();
        let registry = Self::get_registry(&env);
        let client = StudentRegistryClient::new(&env, &registry);
        client.register_student(&student, &name);
    }

    /// Awards points to a student. Validates registration first.
    pub fn reward_student(env: Env, student: Address, points: u32) {
        student.require_auth();
        let registry = Self::get_registry(&env);
        let client = StudentRegistryClient::new(&env, &registry);
        
        if !client.is_registered(&student) {
            panic!("Student is not registered in the StudentRegistry");
        }

        log!(&env, "reward_student: {} -> +{} points", student, points);
        
        let points_key = DataKey::Points(student.clone());
        let current_points: u32 = env.storage().persistent().get(&points_key).unwrap_or(0);
        env.storage().persistent().set(&points_key, &(current_points + points));

        let total_key = DataKey::TotalRewards;
        let current_total: u32 = env.storage().instance().get(&total_key).unwrap_or(0);
        env.storage().instance().set(&total_key, &(current_total + points));

        env.events().publish((soroban_sdk::symbol_short!("reward"), student), points);
    }

    /// Retrieves points balance of a student.
    pub fn get_student_points(env: Env, student: Address) -> u32 {
        let points_key = DataKey::Points(student);
        env.storage().persistent().get(&points_key).unwrap_or(0)
    }

    /// Deducts points from a student to claim a reward.
    pub fn claim_reward(env: Env, student: Address, points: u32) {
        student.require_auth();
        let registry = Self::get_registry(&env);
        let client = StudentRegistryClient::new(&env, &registry);
        
        if !client.is_registered(&student) {
            panic!("Student is not registered");
        }

        log!(&env, "claim_reward: {} -> -{} points", student, points);
        
        let points_key = DataKey::Points(student.clone());
        let current_points: u32 = env.storage().persistent().get(&points_key).unwrap_or(0);
        if current_points < points {
            panic!("Insufficient points balance to claim this reward");
        }
        env.storage().persistent().set(&points_key, &(current_points - points));
        
        env.events().publish((soroban_sdk::symbol_short!("claim"), student), points);
    }

    /// Gets total rewards issued.
    pub fn get_total_rewards(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::TotalRewards).unwrap_or(0)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Env, String, testutils::Address as _};
    use student_registry::StudentRegistryContract;

    #[test]
    fn test_rewards_vault_flow() {
        let env = Env::default();
        
        // Register StudentRegistry
        let registry_id = env.register(StudentRegistryContract, ());
        
        // Register RewardVault
        let vault_id = env.register(RewardVaultContract, ());
        let vault_client = RewardVaultContractClient::new(&env, &vault_id);
        
        // Initialize Vault
        vault_client.initialize(&registry_id);
        
        let student = Address::generate(&env);
        let name = String::from_str(&env, "Alice Cooper");
        
        env.mock_all_auths();
        
        // Register via Vault
        vault_client.register_student(&student, &name);
        
        // Check points
        assert_eq!(vault_client.get_student_points(&student), 0);
        
        // Reward student
        vault_client.reward_student(&student, &150);
        assert_eq!(vault_client.get_student_points(&student), 150);
        assert_eq!(vault_client.get_total_rewards(), 150);
        
        // Claim reward
        vault_client.claim_reward(&student, &100);
        assert_eq!(vault_client.get_student_points(&student), 50);
    }

    #[test]
    #[should_panic(expected = "Student is not registered in the StudentRegistry")]
    fn test_unregistered_student_rewards() {
        let env = Env::default();
        let registry_id = env.register(StudentRegistryContract, ());
        let vault_id = env.register(RewardVaultContract, ());
        let vault_client = RewardVaultContractClient::new(&env, &vault_id);
        
        vault_client.initialize(&registry_id);
        
        let student = Address::generate(&env);
        env.mock_all_auths();
        vault_client.reward_student(&student, &50); // should panic
    }
}
