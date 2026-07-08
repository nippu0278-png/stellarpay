#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, log};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Name(Address),
}

#[contract]
pub struct StudentRegistryContract;

#[contractimpl]
impl StudentRegistryContract {
    /// Registers a student with their public address and name.
    pub fn register_student(env: Env, student: Address, name: String) {
        student.require_auth();
        log!(&env, "register_student: {} -> {}", student, name);
        env.storage().persistent().set(&DataKey::Name(student.clone()), &name);
        env.events().publish((soroban_sdk::symbol_short!("register"), student), name);
    }

    /// Checks if a student is registered.
    pub fn is_registered(env: Env, student: Address) -> bool {
        env.storage().persistent().has(&DataKey::Name(student))
    }

    /// Gets a student's registered name.
    pub fn get_student_name(env: Env, student: Address) -> String {
        let key = DataKey::Name(student);
        if !env.storage().persistent().has(&key) {
            panic!("Student is not registered");
        }
        env.storage().persistent().get(&key).unwrap()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Env, String, testutils::Address as _};

    #[test]
    fn test_registration() {
        let env = Env::default();
        let contract_id = env.register(StudentRegistryContract, ());
        let client = StudentRegistryContractClient::new(&env, &contract_id);

        let student = Address::generate(&env);
        let name = String::from_str(&env, "Jane Doe");

        assert_eq!(client.is_registered(&student), false);

        env.mock_all_auths();
        client.register_student(&student, &name);

        assert_eq!(client.is_registered(&student), true);
        assert_eq!(client.get_student_name(&student), name);
    }
}
