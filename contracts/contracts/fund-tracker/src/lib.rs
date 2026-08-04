#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol};

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

const DAY_IN_LEDGERS: u32 = 17280;
const BUMP_THRESHOLD: u32 = 30 * DAY_IN_LEDGERS;
const BUMP_TO: u32 = 120 * DAY_IN_LEDGERS;

#[contract]
pub struct FundTracker;

#[contractimpl]
impl FundTracker {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already_initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn allocate(env: Env, caller: Address, project_id: Symbol, amount_xlm: i128) {
        caller.require_auth();
        Self::require_caller_is_admin(&env, &caller);

        if amount_xlm <= 0 {
            panic!("invalid_amount");
        }

        let allocation = FundAllocation {
            project_id: project_id.clone(),
            organization: caller,
            amount_xlm,
            allocated_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Allocation(project_id.clone()), &allocation);
        env.storage().persistent().extend_ttl(
            &DataKey::Allocation(project_id),
            BUMP_THRESHOLD,
            BUMP_TO,
        );
    }

    pub fn get_allocation(env: Env, project_id: Symbol) -> Option<FundAllocation> {
        env.storage()
            .persistent()
            .get(&DataKey::Allocation(project_id))
    }

    // `caller` is signature-verified above via `require_auth`, but that only proves
    // *someone* signed — not that they're allowed to write. TrustBid allocations are
    // server-mediated (the API always calls with its own keypair; see
    // apps/api/src/modules/soroban/soroban.service.ts), so the caller must also be
    // the on-chain admin, or any address can overwrite any project's allocation.
    fn require_caller_is_admin(env: &Env, caller: &Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("not_initialized"));
        if caller != &admin {
            panic!("not_admin");
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger as _};
    use soroban_sdk::{symbol_short, Address, Env};

    fn setup() -> (Env, FundTrackerClient<'static>, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(FundTracker, ());
        let client = FundTrackerClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.initialize(&admin);
        (env, client, admin)
    }

    #[test]
    fn test_allocate_and_get() {
        let (_env, client, admin) = setup();

        let project_id = symbol_short!("proj1");
        client.allocate(&admin, &project_id, &1_000_0000000);

        let alloc = client.get_allocation(&project_id).unwrap();
        assert_eq!(alloc.amount_xlm, 1_000_0000000);
        assert_eq!(alloc.project_id, project_id);
        assert_eq!(alloc.organization, admin);
    }

    #[test]
    fn test_get_nonexistent_returns_none() {
        let (_env, client, _admin) = setup();
        let missing = symbol_short!("ghost");
        assert!(client.get_allocation(&missing).is_none());
    }

    #[test]
    fn test_reallocate_overwrites() {
        let (_env, client, admin) = setup();
        let project_id = symbol_short!("proj2");

        client.allocate(&admin, &project_id, &500_0000000);
        client.allocate(&admin, &project_id, &1_500_0000000);

        let alloc = client.get_allocation(&project_id).unwrap();
        assert_eq!(alloc.amount_xlm, 1_500_0000000);
    }

    #[test]
    fn test_different_projects_independent() {
        let (_env, client, admin) = setup();
        let p1 = symbol_short!("projA");
        let p2 = symbol_short!("projB");

        client.allocate(&admin, &p1, &100_0000000);
        client.allocate(&admin, &p2, &200_0000000);

        assert_eq!(client.get_allocation(&p1).unwrap().amount_xlm, 100_0000000);
        assert_eq!(client.get_allocation(&p2).unwrap().amount_xlm, 200_0000000);
    }

    #[test]
    fn test_allocated_at_matches_ledger_time() {
        let (env, client, admin) = setup();
        env.ledger().set_timestamp(1_700_000_000);

        let project_id = symbol_short!("proj3");
        client.allocate(&admin, &project_id, &50_0000000);

        let alloc = client.get_allocation(&project_id).unwrap();
        assert_eq!(alloc.allocated_at, 1_700_000_000);
    }

    #[test]
    #[should_panic]
    fn test_double_initialize_panics() {
        let (_env, client, admin) = setup();
        client.initialize(&admin);
    }

    #[test]
    #[should_panic]
    fn test_negative_amount_panics() {
        let (_env, client, admin) = setup();
        let project_id = symbol_short!("neg1");
        client.allocate(&admin, &project_id, &-1);
    }

    #[test]
    #[should_panic]
    fn test_non_admin_caller_panics() {
        let (env, client, _admin) = setup();
        let intruder = Address::generate(&env);
        client.allocate(&intruder, &symbol_short!("proj1"), &100_0000000);
    }
}

