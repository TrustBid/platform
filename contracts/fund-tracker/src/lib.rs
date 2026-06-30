#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, Symbol};

#[contracttype]
#[derive(Clone)]
pub struct FundAllocation {
    pub project_id: Symbol,
    pub organization: Address,
    pub amount_xlm: i128,
    pub allocated_at: u64,
}

#[contracttype]
pub enum DataKey {
    Allocation(Symbol),
    Admin,
}

#[contract]
pub struct FundTracker;

#[contractimpl]
impl FundTracker {
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn allocate(
        env: Env,
        caller: Address,
        project_id: Symbol,
        amount_xlm: i128,
    ) {
        caller.require_auth();

        let allocation = FundAllocation {
            project_id: project_id.clone(),
            organization: caller,
            amount_xlm,
            allocated_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Allocation(project_id), &allocation);
    }

    pub fn get_allocation(env: Env, project_id: Symbol) -> Option<FundAllocation> {
        env.storage()
            .persistent()
            .get(&DataKey::Allocation(project_id))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::{symbol_short, Address, Env};

    #[test]
    fn test_allocate_and_get() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(FundTracker, ());
        let client = FundTrackerClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        let project_id = symbol_short!("proj_1");
        client.allocate(&admin, &project_id, &1_000_0000000);

        let alloc = client.get_allocation(&project_id).unwrap();
        assert_eq!(alloc.amount_xlm, 1_000_0000000);
    }
}
