#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, token, Address, Env};

#[contracttype]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u32)]
pub enum Status {
    Initialized = 0,
    Funded = 1,
    Released = 2,
    Refunded = 3,
}

#[contracttype]
pub enum DataKey {
    Client,
    Freelancer,
    Token,
    Amount,
    Status,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidStatus = 4,
    InvalidAmount = 5,
}

#[contract]
pub struct GigEscrowContract;

#[contractimpl]
impl GigEscrowContract {
    /// Initialize the escrow with the client, freelancer, token (USDC), and amount.
    pub fn init(
        env: Env,
        client: Address,
        freelancer: Address,
        token: Address,
        amount: i128,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Client) {
            let status: Status = env.storage().instance().get(&DataKey::Status).unwrap_or(Status::Initialized);
            if status != Status::Released && status != Status::Refunded {
                return Err(Error::AlreadyInitialized);
            }
        }
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        env.storage().instance().set(&DataKey::Client, &client);
        env.storage().instance().set(&DataKey::Freelancer, &freelancer);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Amount, &amount);
        env.storage().instance().set(&DataKey::Status, &Status::Initialized);
        
        env.storage().instance().extend_ttl(1000, 5000);
        Ok(())
    }

    /// Client deposits the funds into the contract.
    pub fn deposit(env: Env) -> Result<(), Error> {
        let client: Address = env.storage().instance().get(&DataKey::Client).ok_or(Error::NotInitialized)?;
        client.require_auth();

        let status: Status = env.storage().instance().get(&DataKey::Status).unwrap_or(Status::Initialized);
        if status != Status::Initialized {
            return Err(Error::InvalidStatus);
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let amount: i128 = env.storage().instance().get(&DataKey::Amount).unwrap();
        
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&client, &env.current_contract_address(), &amount);

        env.storage().instance().set(&DataKey::Status, &Status::Funded);
        Ok(())
    }

    /// Client releases the funds to the freelancer.
    pub fn release(env: Env) -> Result<(), Error> {
        let client: Address = env.storage().instance().get(&DataKey::Client).ok_or(Error::NotInitialized)?;
        client.require_auth();

        let status: Status = env.storage().instance().get(&DataKey::Status).unwrap_or(Status::Initialized);
        if status != Status::Funded {
            return Err(Error::InvalidStatus);
        }

        let freelancer: Address = env.storage().instance().get(&DataKey::Freelancer).unwrap();
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let amount: i128 = env.storage().instance().get(&DataKey::Amount).unwrap();
        
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &freelancer, &amount);

        env.storage().instance().set(&DataKey::Status, &Status::Released);
        Ok(())
    }

    /// Client refunds the funds back to themselves (e.g. if gig is cancelled).
    pub fn refund(env: Env) -> Result<(), Error> {
        let client: Address = env.storage().instance().get(&DataKey::Client).ok_or(Error::NotInitialized)?;
        client.require_auth();

        let status: Status = env.storage().instance().get(&DataKey::Status).unwrap_or(Status::Initialized);
        if status != Status::Funded {
            return Err(Error::InvalidStatus);
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let amount: i128 = env.storage().instance().get(&DataKey::Amount).unwrap();
        
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &client, &amount);

        env.storage().instance().set(&DataKey::Status, &Status::Refunded);
        Ok(())
    }

    /// Get current state of the escrow.
    pub fn get_status(env: Env) -> Status {
        env.storage().instance().get(&DataKey::Status).unwrap_or(Status::Initialized)
    }
}

mod test;
