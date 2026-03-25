#![no_std]
use soroban_sdk::{contract, contractimpl, Env, symbol_short};

#[contract]
pub struct RandomnessOracle;

#[contractimpl]
impl RandomnessOracle {
    pub fn generate_random(env: Env, player: soroban_sdk::Address, nonce: u64) -> u32 {
        player.require_auth();
        
        let ledger_seq = env.ledger().sequence();
        let timestamp = env.ledger().timestamp();
        
        let mut hash_input = soroban_sdk::Bytes::new(&env);
        hash_input.append(&soroban_sdk::Bytes::from_slice(&env, &ledger_seq.to_be_bytes()));
        hash_input.append(&soroban_sdk::Bytes::from_slice(&env, &timestamp.to_be_bytes()));
        hash_input.append(&soroban_sdk::Bytes::from_slice(&env, &nonce.to_be_bytes()));
        
        let hash = env.crypto().sha256(&hash_input);
        let hash_bytes = hash.to_array();
        let random_num = u32::from_be_bytes([
            hash_bytes[0],
            hash_bytes[1],
            hash_bytes[2],
            hash_bytes[3],
        ]);
        let dice_result = (random_num % 6) + 1;
        
        env.events().publish(
            (symbol_short!("random"), player.clone()),
            (dice_result, nonce)
        );
        
        dice_result
    }
}

mod test;
