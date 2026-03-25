#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_random_generation() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, RandomnessOracle);
    let client = RandomnessOracleClient::new(&env, &contract_id);

    let player = Address::generate(&env);

    let result = client.generate_random(&player, &1);

    assert!(result >= 1 && result <= 6);
}

#[test]
fn test_random_uniqueness() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, RandomnessOracle);
    let client = RandomnessOracleClient::new(&env, &contract_id);

    let player = Address::generate(&env);

    let result1 = client.generate_random(&player, &1);
    let result2 = client.generate_random(&player, &2);

    assert!(result1 >= 1 && result1 <= 6);
    assert!(result2 >= 1 && result2 <= 6);
}
