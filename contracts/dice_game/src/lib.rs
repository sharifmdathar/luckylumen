#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    TokenContract,
    OracleContract,
    GameNonce,
    HouseBalance,
}

#[derive(Clone)]
#[contracttype]
pub struct GameResult {
    pub player: Address,
    pub bet_amount: i128,
    pub prediction: u32,
    pub actual_roll: u32,
    pub won: bool,
    pub payout: i128,
}

mod token {
    soroban_sdk::contractimport!(
        file = "../dice_token/target/wasm32-unknown-unknown/release/dice_token.wasm"
    );
}

mod oracle {
    soroban_sdk::contractimport!(
        file = "../randomness_oracle/target/wasm32-unknown-unknown/release/randomness_oracle.wasm"
    );
}

#[contract]
pub struct DiceGame;

const PAYOUT_MULTIPLIER: i128 = 5;

#[contractimpl]
impl DiceGame {
    pub fn initialize(env: Env, token_contract: Address, oracle_contract: Address) {
        if env.storage().instance().has(&DataKey::TokenContract) {
            panic!("Already initialized");
        }

        env.storage()
            .instance()
            .set(&DataKey::TokenContract, &token_contract);
        env.storage()
            .instance()
            .set(&DataKey::OracleContract, &oracle_contract);
        env.storage().instance().set(&DataKey::GameNonce, &0u64);
        env.storage().instance().set(&DataKey::HouseBalance, &0i128);
    }

    pub fn play(env: Env, player: Address, bet_amount: i128, prediction: u32) -> GameResult {
        player.require_auth();

        if prediction < 1 || prediction > 6 {
            panic!("Prediction must be between 1 and 6");
        }

        let token_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenContract)
            .unwrap();
        let oracle_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::OracleContract)
            .unwrap();

        let token_client = token::Client::new(&env, &token_contract);
        token_client.transfer(&player, &env.current_contract_address(), &bet_amount);

        let mut nonce: u64 = env
            .storage()
            .instance()
            .get(&DataKey::GameNonce)
            .unwrap_or(0);
        nonce += 1;
        env.storage().instance().set(&DataKey::GameNonce, &nonce);

        let oracle_client = oracle::Client::new(&env, &oracle_contract);
        let actual_roll = oracle_client.generate_random(&player, &nonce);

        let won = actual_roll == prediction;
        let payout = if won {
            bet_amount * PAYOUT_MULTIPLIER
        } else {
            0
        };

        let mut house_balance: i128 = env
            .storage()
            .instance()
            .get(&DataKey::HouseBalance)
            .unwrap_or(0);

        if won {
            token_client.transfer(&env.current_contract_address(), &player, &payout);
            house_balance -= payout - bet_amount;
        } else {
            house_balance += bet_amount;
        }

        env.storage()
            .instance()
            .set(&DataKey::HouseBalance, &house_balance);

        let result = GameResult {
            player: player.clone(),
            bet_amount,
            prediction,
            actual_roll,
            won,
            payout,
        };

        env.events().publish(
            (symbol_short!("game"), player),
            (prediction, actual_roll, won, payout),
        );

        result
    }

    pub fn get_house_balance(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::HouseBalance)
            .unwrap_or(0)
    }
}

mod test;
