#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Bytes, Env, Symbol};

#[contracttype]
#[derive(Clone)]
pub struct AnchoredExpense {
    pub expense_id: Symbol,
    pub project_id: Symbol,
    pub submitted_by: Address,
    pub amount_xlm: i128,
    pub receipt_hash: Bytes, // SHA-256 hash of the receipt stored in R2
    pub anchored_at: u64,
}

#[contracttype]
pub enum DataKey {
    Expense(Symbol),
    Admin,
}

#[contract]
pub struct ExpenseAnchor;

#[contractimpl]
impl ExpenseAnchor {
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn anchor(
        env: Env,
        caller: Address,
        expense_id: Symbol,
        project_id: Symbol,
        amount_xlm: i128,
        receipt_hash: Bytes,
    ) {
        caller.require_auth();

        let expense = AnchoredExpense {
            expense_id: expense_id.clone(),
            project_id,
            submitted_by: caller,
            amount_xlm,
            receipt_hash,
            anchored_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Expense(expense_id), &expense);

        env.events()
            .publish((Symbol::new(&env, "expense_anchored"),), expense);
    }

    pub fn get_expense(env: Env, expense_id: Symbol) -> Option<AnchoredExpense> {
        env.storage()
            .persistent()
            .get(&DataKey::Expense(expense_id))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Events as _, Ledger as _};
    use soroban_sdk::{symbol_short, vec, Address, Bytes, Env, IntoVal, Symbol};

    fn make_hash(env: &Env, seed: u8) -> Bytes {
        let mut raw = [seed; 32];
        raw[0] = seed;
        Bytes::from_array(env, &raw)
    }

    fn setup() -> (Env, ExpenseAnchorClient<'static>, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(ExpenseAnchor, ());
        let client = ExpenseAnchorClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.initialize(&admin);
        (env, client, admin)
    }

    #[test]
    fn test_anchor_and_get() {
        let (env, client, admin) = setup();

        let expense_id = symbol_short!("exp1");
        let project_id = symbol_short!("proj1");
        let hash = make_hash(&env, 0xAB);

        client.anchor(&admin, &expense_id, &project_id, &250_0000000, &hash);

        let exp = client.get_expense(&expense_id).unwrap();
        assert_eq!(exp.expense_id, expense_id);
        assert_eq!(exp.project_id, project_id);
        assert_eq!(exp.submitted_by, admin);
        assert_eq!(exp.amount_xlm, 250_0000000);
        assert_eq!(exp.receipt_hash, hash);
    }

    #[test]
    fn test_get_nonexistent_returns_none() {
        let (_env, client, _admin) = setup();
        assert!(client.get_expense(&symbol_short!("ghost")).is_none());
    }

    #[test]
    fn test_anchored_at_matches_ledger_time() {
        let (env, client, admin) = setup();
        env.ledger().set_timestamp(1_700_000_000);

        let expense_id = symbol_short!("exp2");
        client.anchor(
            &admin,
            &expense_id,
            &symbol_short!("proj1"),
            &100_0000000,
            &make_hash(&env, 0x01),
        );

        let exp = client.get_expense(&expense_id).unwrap();
        assert_eq!(exp.anchored_at, 1_700_000_000);
    }

    #[test]
    fn test_different_expenses_independent() {
        let (env, client, admin) = setup();
        let proj = symbol_short!("proj1");

        client.anchor(&admin, &symbol_short!("expA"), &proj, &100_0000000, &make_hash(&env, 0x01));
        client.anchor(&admin, &symbol_short!("expB"), &proj, &200_0000000, &make_hash(&env, 0x02));

        assert_eq!(client.get_expense(&symbol_short!("expA")).unwrap().amount_xlm, 100_0000000);
        assert_eq!(client.get_expense(&symbol_short!("expB")).unwrap().amount_xlm, 200_0000000);
    }

    #[test]
    fn test_re_anchor_same_id_overwrites() {
        let (env, client, admin) = setup();
        let expense_id = symbol_short!("exp3");
        let proj = symbol_short!("proj1");

        client.anchor(&admin, &expense_id, &proj, &50_0000000, &make_hash(&env, 0x01));
        client.anchor(&admin, &expense_id, &proj, &99_0000000, &make_hash(&env, 0x02));

        let exp = client.get_expense(&expense_id).unwrap();
        assert_eq!(exp.amount_xlm, 99_0000000);
        assert_eq!(exp.receipt_hash, make_hash(&env, 0x02));
    }

    #[test]
    fn test_anchor_emits_event() {
        let (env, client, admin) = setup();

        let expense_id = symbol_short!("exp4");
        let project_id = symbol_short!("proj1");
        let hash = make_hash(&env, 0xFF);

        client.anchor(&admin, &expense_id, &project_id, &300_0000000, &hash);

        let events = env.events().all();
        assert!(!events.is_empty(), "must emit at least one event");

        let (_, topics, _) = events.last().unwrap();
        // First topic is the "expense_anchored" Symbol
        let expected_topic: Symbol = Symbol::new(&env, "expense_anchored");
        assert_eq!(topics, vec![&env, expected_topic.into_val(&env)]);
    }

    #[test]
    fn test_different_callers_can_anchor() {
        let (env, client, _admin) = setup();
        let caller_a = Address::generate(&env);
        let caller_b = Address::generate(&env);
        let proj = symbol_short!("proj1");

        client.anchor(&caller_a, &symbol_short!("eA"), &proj, &10_0000000, &make_hash(&env, 0x0A));
        client.anchor(&caller_b, &symbol_short!("eB"), &proj, &20_0000000, &make_hash(&env, 0x0B));

        assert_eq!(client.get_expense(&symbol_short!("eA")).unwrap().submitted_by, caller_a);
        assert_eq!(client.get_expense(&symbol_short!("eB")).unwrap().submitted_by, caller_b);
    }

    #[test]
    fn test_double_initialize_succeeds() {
        let (_env, client, admin) = setup();
        client.initialize(&admin);
    }

    #[test]
    fn test_short_receipt_hash_accepted() {
        let (env, client, admin) = setup();
        let expense_id = symbol_short!("short");
        let short_hash = Bytes::from_array(&env, &[0x01]);

        client.anchor(
            &admin,
            &expense_id,
            &symbol_short!("proj1"),
            &100_0000000,
            &short_hash,
        );

        let exp = client.get_expense(&expense_id).unwrap();
        assert_eq!(exp.receipt_hash, short_hash);
    }
}
