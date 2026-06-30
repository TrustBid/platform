#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Bytes, Env, Symbol};

#[contracttype]
#[derive(Clone)]
pub struct AnchoredExpense {
    pub expense_id: Symbol,
    pub project_id: Symbol,
    pub submitted_by: Address,
    pub amount_xlm: i128,
    pub receipt_hash: Bytes,  // SHA-256 del comprobante almacenado en R2
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
