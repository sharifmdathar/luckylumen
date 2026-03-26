#![cfg(test)]
use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events},
    Address, Env, String,
};

extern crate std;

#[test]
fn test_full_game_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let token_contract_id = env.register_contract_wasm(None, token::WASM);
    let oracle_contract_id = env.register_contract_wasm(None, oracle::WASM);
    let game_contract_id = env.register_contract(None, DiceGame);

    let token_client = token::Client::new(&env, &token_contract_id);
    let game_client = DiceGameClient::new(&env, &game_contract_id);

    let admin = Address::generate(&env);
    let player = Address::generate(&env);

    token_client.initialize(
        &admin,
        &String::from_str(&env, "LuckyLumen"),
        &String::from_str(&env, "LUCKY"),
    );

    token_client.mint(&player, &10000);
    token_client.mint(&game_contract_id, &100000);

    game_client.initialize(&token_contract_id, &oracle_contract_id);

    let initial_balance = token_client.balance(&player);
    let bet_amount = 100i128;
    let prediction = 3u32;

    let result = game_client.play(&player, &bet_amount, &prediction);

    assert_eq!(result.player, player);
    assert_eq!(result.bet_amount, bet_amount);
    assert_eq!(result.prediction, prediction);
    assert!(result.actual_roll >= 1 && result.actual_roll <= 6);

    let final_balance = token_client.balance(&player);

    if result.won {
        assert_eq!(final_balance, initial_balance - bet_amount + result.payout);
        assert_eq!(result.payout, bet_amount * 5);
    } else {
        assert_eq!(final_balance, initial_balance - bet_amount);
        assert_eq!(result.payout, 0);
    }

    let events = env.events().all();
    assert!(events.len() > 0);
}

#[test]
fn test_invalid_prediction() {
    let env = Env::default();
    env.mock_all_auths();

    let token_contract_id = env.register_contract_wasm(None, token::WASM);
    let oracle_contract_id = env.register_contract_wasm(None, oracle::WASM);
    let game_contract_id = env.register_contract(None, DiceGame);

    let token_client = token::Client::new(&env, &token_contract_id);
    let game_client = DiceGameClient::new(&env, &game_contract_id);

    let admin = Address::generate(&env);
    let player = Address::generate(&env);

    token_client.initialize(
        &admin,
        &String::from_str(&env, "LuckyLumen"),
        &String::from_str(&env, "LUCKY"),
    );
    token_client.mint(&player, &10000);
    token_client.mint(&game_contract_id, &100000);

    game_client.initialize(&token_contract_id, &oracle_contract_id);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        game_client.play(&player, &100, &7);
    }));

    assert!(result.is_err());
}

#[test]
fn test_house_balance_tracking() {
    let env = Env::default();
    env.mock_all_auths();

    let token_contract_id = env.register_contract_wasm(None, token::WASM);
    let oracle_contract_id = env.register_contract_wasm(None, oracle::WASM);
    let game_contract_id = env.register_contract(None, DiceGame);

    let token_client = token::Client::new(&env, &token_contract_id);
    let game_client = DiceGameClient::new(&env, &game_contract_id);

    let admin = Address::generate(&env);
    let player = Address::generate(&env);

    token_client.initialize(
        &admin,
        &String::from_str(&env, "LuckyLumen"),
        &String::from_str(&env, "LUCKY"),
    );
    token_client.mint(&player, &10000);
    token_client.mint(&game_contract_id, &100000);

    game_client.initialize(&token_contract_id, &oracle_contract_id);

    let initial_house_balance = game_client.get_house_balance();

    let result = game_client.play(&player, &100, &3);

    let final_house_balance = game_client.get_house_balance();

    if result.won {
        assert_eq!(final_house_balance, initial_house_balance - 400);
    } else {
        assert_eq!(final_house_balance, initial_house_balance + 100);
    }
}
