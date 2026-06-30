#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, Symbol, Vec,
};

// ── Data types ───────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum BadgeStatus {
    Active,
    Revoked,
}

#[contracttype]
#[derive(Clone)]
pub struct Badge {
    pub token_id: u64,
    pub badge_type: Symbol,
    pub organization: Address,
    pub status: BadgeStatus,
    pub issued_at: u64,
    pub revoked_at: u64, // 0 cuando no ha sido revocado
}

#[contracttype]
pub enum DataKey {
    Admin,
    NextTokenId,
    BadgeById(u64),
    OrgBadges(Address),
}

// ── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct SbtBadge;

#[contractimpl]
impl SbtBadge {
    /// Inicializa el contrato. Solo puede llamarse una vez.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already_initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextTokenId, &1u64);
    }

    /// Emite un SBT de reputación a `organization`.
    /// Solo el admin puede llamar esta función.
    pub fn mint_badge(env: Env, organization: Address, badge_type: Symbol) -> u64 {
        Self::require_admin(&env);
        Self::validate_badge_type(&env, &badge_type);

        let token_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextTokenId)
            .unwrap();
        env.storage()
            .instance()
            .set(&DataKey::NextTokenId, &(token_id + 1));

        let badge = Badge {
            token_id,
            badge_type: badge_type.clone(),
            organization: organization.clone(),
            status: BadgeStatus::Active,
            issued_at: env.ledger().timestamp(),
            revoked_at: 0,
        };

        env.storage()
            .persistent()
            .set(&DataKey::BadgeById(token_id), &badge);

        // Índice org → [token_ids]
        let mut ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::OrgBadges(organization.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        ids.push_back(token_id);
        env.storage()
            .persistent()
            .set(&DataKey::OrgBadges(organization.clone()), &ids);

        env.events().publish(
            (Symbol::new(&env, "badge_minted"), badge_type),
            (token_id, organization),
        );

        token_id
    }

    /// Revoca un badge. El registro original permanece en ledger con status=Revoked.
    /// Solo el admin puede revocar.
    pub fn revoke_badge(env: Env, token_id: u64) {
        Self::require_admin(&env);

        let mut badge: Badge = env
            .storage()
            .persistent()
            .get(&DataKey::BadgeById(token_id))
            .unwrap_or_else(|| panic!("token_not_found"));

        if badge.status == BadgeStatus::Revoked {
            panic!("already_revoked");
        }

        let org = badge.organization.clone();
        badge.status = BadgeStatus::Revoked;
        badge.revoked_at = env.ledger().timestamp();

        env.storage()
            .persistent()
            .set(&DataKey::BadgeById(token_id), &badge);

        env.events().publish(
            (Symbol::new(&env, "badge_revoked"),),
            (token_id, org),
        );
    }

    /// Retorna un badge por token_id. None si no existe.
    pub fn get_badge(env: Env, token_id: u64) -> Option<Badge> {
        env.storage()
            .persistent()
            .get(&DataKey::BadgeById(token_id))
    }

    /// Todos los badges (activos + revocados) de una organización.
    pub fn get_badges(env: Env, organization: Address) -> Vec<Badge> {
        let ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::OrgBadges(organization))
            .unwrap_or_else(|| Vec::new(&env));

        let mut badges = Vec::new(&env);
        for id in ids.iter() {
            if let Some(b) = env.storage().persistent().get(&DataKey::BadgeById(id)) {
                badges.push_back(b);
            }
        }
        badges
    }

    /// Solo los badges activos de una organización.
    pub fn get_active_badges(env: Env, organization: Address) -> Vec<Badge> {
        let all = Self::get_badges(env.clone(), organization);
        let mut active = Vec::new(&env);
        for b in all.iter() {
            if b.status == BadgeStatus::Active {
                active.push_back(b);
            }
        }
        active
    }

    // ── Helpers privados ─────────────────────────────────────────────────────

    fn require_admin(env: &Env) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("not_admin"));
        admin.require_auth();
    }

    fn validate_badge_type(env: &Env, badge_type: &Symbol) {
        let valid = [
            Symbol::new(env, "kyb_verified"),
            Symbol::new(env, "transparency_bronze"),
            Symbol::new(env, "transparency_silver"),
            Symbol::new(env, "transparency_gold"),
        ];
        if !valid.iter().any(|t| t == badge_type) {
            panic!("invalid_badge_type");
        }
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Events as _, Ledger as _};
    use soroban_sdk::{symbol_short, Address, Env, Symbol};

    fn setup() -> (Env, SbtBadgeClient<'static>, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(SbtBadge, ());
        let client = SbtBadgeClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.initialize(&admin);
        (env, client, admin)
    }

    // ── mint_badge ────────────────────────────────────────────────────────────

    #[test]
    fn test_mint_returns_sequential_ids() {
        let (env, client, _admin) = setup();
        let org = Address::generate(&env);
        let bt = Symbol::new(&env, "kyb_verified");
        assert_eq!(client.mint_badge(&org, &bt), 1);
        assert_eq!(client.mint_badge(&org, &bt), 2);
        assert_eq!(client.mint_badge(&org, &bt), 3);
    }

    #[test]
    fn test_mint_emits_event() {
        let (env, client, _admin) = setup();
        let org = Address::generate(&env);
        let events_before = env.events().all().len();
        client.mint_badge(&org, &Symbol::new(&env, "kyb_verified"));
        assert!(env.events().all().len() > events_before);
    }

    // ── get_badge ─────────────────────────────────────────────────────────────

    #[test]
    fn test_get_badge_correct_data() {
        let (env, client, _admin) = setup();
        let org = Address::generate(&env);
        env.ledger().set_timestamp(1_700_000_000);

        let bt = Symbol::new(&env, "transparency_bronze");
        let id = client.mint_badge(&org, &bt);
        let badge = client.get_badge(&id).unwrap();

        assert_eq!(badge.token_id, id);
        assert_eq!(badge.organization, org);
        assert_eq!(badge.badge_type, bt);
        assert_eq!(badge.status, BadgeStatus::Active);
        assert_eq!(badge.issued_at, 1_700_000_000);
        assert_eq!(badge.revoked_at, 0);
    }

    #[test]
    fn test_get_badge_nonexistent_returns_none() {
        let (_env, client, _admin) = setup();
        assert!(client.get_badge(&999).is_none());
    }

    // ── get_badges / get_active_badges ────────────────────────────────────────

    #[test]
    fn test_get_badges_returns_all() {
        let (env, client, _admin) = setup();
        let org = Address::generate(&env);
        client.mint_badge(&org, &Symbol::new(&env, "kyb_verified"));
        client.mint_badge(&org, &Symbol::new(&env, "transparency_bronze"));
        assert_eq!(client.get_badges(&org).len(), 2);
    }

    #[test]
    fn test_get_badges_empty_for_unknown_org() {
        let (env, client, _admin) = setup();
        let org = Address::generate(&env);
        assert_eq!(client.get_badges(&org).len(), 0);
    }

    #[test]
    fn test_get_active_badges_excludes_revoked() {
        let (env, client, _admin) = setup();
        let org = Address::generate(&env);
        let id1 = client.mint_badge(&org, &Symbol::new(&env, "kyb_verified"));
        client.mint_badge(&org, &Symbol::new(&env, "transparency_bronze"));
        client.revoke_badge(&id1);

        let active = client.get_active_badges(&org);
        assert_eq!(active.len(), 1);
        assert_eq!(active.get(0).unwrap().status, BadgeStatus::Active);
    }

    // ── revoke_badge ──────────────────────────────────────────────────────────

    #[test]
    fn test_revoke_sets_status_and_timestamp() {
        let (env, client, _admin) = setup();
        let org = Address::generate(&env);
        env.ledger().set_timestamp(1_700_000_000);
        let id = client.mint_badge(&org, &Symbol::new(&env, "kyb_verified"));

        env.ledger().set_timestamp(1_800_000_000);
        client.revoke_badge(&id);

        let badge = client.get_badge(&id).unwrap();
        assert_eq!(badge.status, BadgeStatus::Revoked);
        assert_eq!(badge.revoked_at, 1_800_000_000);
        assert_eq!(badge.issued_at, 1_700_000_000); // el campo original no cambia
    }

    #[test]
    fn test_revoke_emits_event() {
        let (env, client, _admin) = setup();
        let org = Address::generate(&env);
        let id = client.mint_badge(&org, &Symbol::new(&env, "kyb_verified"));
        // events().all() devuelve solo eventos de la última invocación;
        // verificamos justo después de revoke que se emitió el evento.
        client.revoke_badge(&id);
        assert!(!env.events().all().is_empty());
    }

    #[test]
    #[should_panic]
    fn test_revoke_already_revoked_panics() {
        let (env, client, _admin) = setup();
        let org = Address::generate(&env);
        let id = client.mint_badge(&org, &Symbol::new(&env, "kyb_verified"));
        client.revoke_badge(&id);
        client.revoke_badge(&id);
    }

    #[test]
    #[should_panic]
    fn test_revoke_nonexistent_panics() {
        let (_env, client, _admin) = setup();
        client.revoke_badge(&999);
    }

    // ── badge type validation ─────────────────────────────────────────────────

    #[test]
    fn test_all_valid_badge_types_accepted() {
        let (env, client, _admin) = setup();
        let org = Address::generate(&env);
        for bt in &[
            "kyb_verified",
            "transparency_bronze",
            "transparency_silver",
            "transparency_gold",
        ] {
            client.mint_badge(&org, &Symbol::new(&env, bt));
        }
        assert_eq!(client.get_badges(&org).len(), 4);
    }

    #[test]
    #[should_panic]
    fn test_invalid_badge_type_panics() {
        let (env, client, _admin) = setup();
        let org = Address::generate(&env);
        client.mint_badge(&org, &symbol_short!("unknown"));
    }

    // ── multi-org isolation ───────────────────────────────────────────────────

    #[test]
    fn test_badges_are_per_organization() {
        let (env, client, _admin) = setup();
        let org_a = Address::generate(&env);
        let org_b = Address::generate(&env);
        client.mint_badge(&org_a, &Symbol::new(&env, "kyb_verified"));
        client.mint_badge(&org_a, &Symbol::new(&env, "transparency_bronze"));
        client.mint_badge(&org_b, &Symbol::new(&env, "kyb_verified"));

        assert_eq!(client.get_badges(&org_a).len(), 2);
        assert_eq!(client.get_badges(&org_b).len(), 1);
    }

    // ── initialize idempotency ────────────────────────────────────────────────

    #[test]
    #[should_panic]
    fn test_double_initialize_panics() {
        let (env, client, admin) = setup();
        let _ = &env;
        client.initialize(&admin);
    }
}
