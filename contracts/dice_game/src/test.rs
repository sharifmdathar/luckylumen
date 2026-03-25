#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_game_initialization() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DiceGame);
    let client = DiceGameClient::new(&env, &contract_id);

    let token_addr = Address::generate(&env);
    let oracle_addr = Address::generate(&env);

    client.initialize(&token_addr, &oracle_addr);

    assert_eq!(client.get_house_balance(), 0);
}

// Note: Full integration test requires deploying all 3 contracts
// This is a simplified unit test
