#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_initialize_and_mint() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, DiceToken);
    let client = DiceTokenClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(
        &admin,
        &String::from_str(&env, "LuckyLumen"),
        &String::from_str(&env, "LUCKY"),
    );
    client.mint(&user, &1000);

    assert_eq!(client.balance(&user), 1000);
    assert_eq!(client.total_supply(), 1000);
}

#[test]
fn test_transfer() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, DiceToken);
    let client = DiceTokenClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    client.initialize(
        &admin,
        &String::from_str(&env, "LuckyLumen"),
        &String::from_str(&env, "LUCKY"),
    );
    client.mint(&user1, &1000);
    client.transfer(&user1, &user2, &300);

    assert_eq!(client.balance(&user1), 700);
    assert_eq!(client.balance(&user2), 300);
}
