#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
pub mod creator_direct {
    use ink::prelude::string::String;
    use ink::storage::Mapping;

    #[ink(storage)]
    pub struct CreatorDirect {
        /// Creator/owner who receives funds
        creator: AccountId,
        /// Subscription price per period (in the chain's native token)
        price_per_period: Balance,
        /// Number of blocks per subscription period
        period_in_blocks: u32,
        /// Map subscriber -> subscription expiry (block number)
        expiry: Mapping<AccountId, u32>,
        /// Map subscriber -> whether an access pass has been issued
        has_pass: Mapping<AccountId, bool>,
        /// Metadata (optional)
        name: String,
        description: String,
    }

    #[ink(event)]
    pub struct Subscribed {
        #[ink(topic)]
        subscriber: AccountId,
        periods: u32,
        new_expiry: u32,
        amount: Balance,
    }

    #[ink(event)]
    pub struct Withdrawn {
        #[ink(topic)]
        to: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct ParamsUpdated {
        price_per_period: Balance,
        period_in_blocks: u32,
    }

    impl CreatorDirect {
        /// Instantiate with pricing and period parameters
        #[ink(constructor)]
        pub fn new(price_per_period: Balance, period_in_blocks: u32, name: String, description: String) -> Self {
            let caller = Self::env().caller();
            Self {
                creator: caller,
                price_per_period,
                period_in_blocks,
                expiry: Mapping::default(),
                has_pass: Mapping::default(),
                name,
                description,
            }
        }

        /// Returns subscription info for the provided account
        /// Tuple: (is_active, expiry_block, current_block, has_pass)
        #[ink(message)]
        pub fn get_subscription_info(&self, account: AccountId) -> (bool, u32, u32, bool) {
            let now = self.env().block_number();
            let expiry = self.expiry.get(account).unwrap_or(0);
            let active = expiry > now;
            let has_pass = self.has_pass.get(account).unwrap_or(false);
            (active, expiry, now, has_pass)
        }

        /// Subscribe by sending native tokens. Extends access by N periods.
        /// Transfers are held in the contract until withdrawn by the creator.
        #[ink(message, payable)]
        pub fn subscribe(&mut self) -> Result<(u32, u32), String> {
            let transferred = self.env().transferred_value();
            if self.price_per_period == 0 {
                return Err(String::from("Price not set"));
            }
            if transferred < self.price_per_period {
                return Err(String::from("Insufficient amount sent"));
            }
            let caller = self.env().caller();
            #[allow(clippy::cast_possible_truncation, clippy::arithmetic_side_effects)]
            let periods: u32 = (transferred / self.price_per_period) as u32;
            if periods == 0 {
                return Err(String::from("Amount does not cover a full period"));
            }
            let now = self.env().block_number();
            let current_expiry = self.expiry.get(caller).unwrap_or(0);
            let base = if current_expiry > now { current_expiry } else { now };
            let added_blocks = self.period_in_blocks.saturating_mul(periods);
            let new_expiry = base.saturating_add(added_blocks);
            self.expiry.insert(caller, &new_expiry);
            if !self.has_pass.get(caller).unwrap_or(false) {
                self.has_pass.insert(caller, &true);
            }
            self.env().emit_event(Subscribed { subscriber: caller, periods, new_expiry, amount: transferred });
            Ok((periods, new_expiry))
        }

        /// Check if `account` currently has an active subscription
        #[ink(message)]
        pub fn is_active(&self, account: AccountId) -> bool {
            let now = self.env().block_number();
            self.expiry.get(account).unwrap_or(0) > now
        }

        /// Returns current parameters
        #[ink(message)]
        pub fn get_params(&self) -> (Balance, u32, String, String, AccountId) {
            (self.price_per_period, self.period_in_blocks, self.name.clone(), self.description.clone(), self.creator)
        }

        /// Only creator can update price and period
        #[ink(message)]
        pub fn update_params(&mut self, price_per_period: Balance, period_in_blocks: u32) -> Result<(), String> {
            self.ensure_creator()?;
            self.price_per_period = price_per_period;
            self.period_in_blocks = period_in_blocks;
            self.env().emit_event(ParamsUpdated { price_per_period, period_in_blocks });
            Ok(())
        }

        /// Withdraw full balance to the creator
        #[ink(message)]
        pub fn withdraw(&mut self) -> Result<Balance, String> {
            self.ensure_creator()?;
            let to = self.creator;
            let balance = self.env().balance();
            // Avoid transferring reserved existential deposit if chain enforces it
            if balance == 0 { return Ok(0); }
            // Transfer entire available balance to creator
            self.env().transfer(to, balance).map_err(|_| String::from("Transfer failed"))?;
            self.env().emit_event(Withdrawn { to, amount: balance });
            Ok(balance)
        }

        fn ensure_creator(&self) -> Result<(), String> {
            if self.env().caller() != self.creator {
                Err(String::from("Only creator"))
            } else { Ok(()) }
        }
    }

    // Unit tests (off-chain)
    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::test;

        fn set_caller(caller: AccountId) {
            test::set_caller::<ink::env::DefaultEnvironment>(caller);
        }

        #[ink::test]
        fn new_works() {
            let price = 1000u128;
            let period = 10u32;
            let contract = CreatorDirect::new(price, period, String::from("Demo"), String::from("Desc"));
            assert_eq!(contract.price_per_period, price);
            assert_eq!(contract.period_in_blocks, period);
        }

        #[ink::test]
        fn subscribe_extends() {
            let price = 100u128;
            let period = 5u32;
            let mut contract = CreatorDirect::new(price, period, String::from("Demo"), String::from("Desc"));
            let accounts = test::default_accounts::<ink::env::DefaultEnvironment>();
            set_caller(accounts.alice);

            // Set transferred value
            test::set_value_transferred::<ink::env::DefaultEnvironment>(200u128); // 2 periods
            let _ = contract.subscribe().expect("subscribe ok");
            assert!(contract.is_active(accounts.alice));
        }

        #[ink::test]
        fn subscribe_insufficient_funds() {
            let price = 100u128;
            let period = 5u32;
            let mut contract = CreatorDirect::new(price, period, String::from("Demo"), String::from("Desc"));
            let accounts = test::default_accounts::<ink::env::DefaultEnvironment>();
            set_caller(accounts.alice);

            // Transfer less than required price
            test::set_value_transferred::<ink::env::DefaultEnvironment>(50u128);
            let result = contract.subscribe();
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), "Insufficient amount sent");
        }

        #[ink::test]
        fn subscription_expiry_check() {
            let price = 100u128;
            let period = 5u32;
            let mut contract = CreatorDirect::new(price, period, String::from("Demo"), String::from("Desc"));
            let accounts = test::default_accounts::<ink::env::DefaultEnvironment>();
            set_caller(accounts.alice);

            // Subscribe for 1 period
            test::set_value_transferred::<ink::env::DefaultEnvironment>(100u128);
            let _ = contract.subscribe().expect("subscribe ok");
            
            // Should be active now
            assert!(contract.is_active(accounts.alice));
            
            // Advance blocks beyond expiry
            ink::env::test::advance_block::<ink::env::DefaultEnvironment>();
            let current_block = ink::env::block_number::<ink::env::DefaultEnvironment>();
            ink::env::test::set_block_number::<ink::env::DefaultEnvironment>(current_block + period + 1);
            
            // Should be inactive after expiry
            assert!(!contract.is_active(accounts.alice));
        }

        #[ink::test]
        fn only_creator_can_withdraw() {
            let price = 100u128;
            let period = 5u32;
            let mut contract = CreatorDirect::new(price, period, String::from("Demo"), String::from("Desc"));
            let accounts = test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Alice subscribes
            set_caller(accounts.alice);
            test::set_value_transferred::<ink::env::DefaultEnvironment>(100u128);
            let _ = contract.subscribe().expect("subscribe ok");

            // Bob (non-creator) tries to withdraw
            set_caller(accounts.bob);
            let result = contract.withdraw();
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), "Only creator");
        }

        #[ink::test]
        fn only_creator_can_update_params() {
            let price = 100u128;
            let period = 5u32;
            let mut contract = CreatorDirect::new(price, period, String::from("Demo"), String::from("Desc"));
            let accounts = test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Non-creator tries to update params
            set_caller(accounts.bob);
            let result = contract.update_params(200u128, 10u32);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), "Only creator");
        }

        #[ink::test]
        fn subscription_renewal_extends_from_expiry() {
            let price = 100u128;
            let period = 5u32;
            let mut contract = CreatorDirect::new(price, period, String::from("Demo"), String::from("Desc"));
            let accounts = test::default_accounts::<ink::env::DefaultEnvironment>();
            set_caller(accounts.alice);

            // First subscription
            test::set_value_transferred::<ink::env::DefaultEnvironment>(100u128);
            let result1 = contract.subscribe().expect("subscribe ok");
            let first_expiry = result1.1;

            // Second subscription before expiry
            test::set_value_transferred::<ink::env::DefaultEnvironment>(100u128);
            let result2 = contract.subscribe().expect("subscribe ok");
            let second_expiry = result2.1;

            // Second expiry should be period blocks after first expiry
            assert_eq!(second_expiry, first_expiry + period);
        }

        #[ink::test]
        fn subscription_with_zero_price_fails() {
            let price = 0u128;
            let period = 5u32;
            let mut contract = CreatorDirect::new(price, period, String::from("Demo"), String::from("Desc"));
            let accounts = test::default_accounts::<ink::env::DefaultEnvironment>();
            set_caller(accounts.alice);

            test::set_value_transferred::<ink::env::DefaultEnvironment>(100u128);
            let result = contract.subscribe();
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), "Price not set");
        }

        #[ink::test]
        fn get_subscription_info_works() {
            let price = 100u128;
            let period = 5u32;
            let mut contract = CreatorDirect::new(price, period, String::from("Demo"), String::from("Desc"));
            let accounts = test::default_accounts::<ink::env::DefaultEnvironment>();
            set_caller(accounts.alice);

            // Check info before subscription
            let (is_active, expiry, _, has_pass) = contract.get_subscription_info(accounts.alice);
            assert!(!is_active);
            assert_eq!(expiry, 0);
            assert!(!has_pass);

            // Subscribe
            test::set_value_transferred::<ink::env::DefaultEnvironment>(100u128);
            let _ = contract.subscribe().expect("subscribe ok");

            // Check info after subscription
            let (is_active, _, _, has_pass) = contract.get_subscription_info(accounts.alice);
            assert!(is_active);
            assert!(has_pass);
        }

        #[ink::test]
        fn multiple_periods_subscription() {
            let price = 100u128;
            let period = 5u32;
            let mut contract = CreatorDirect::new(price, period, String::from("Demo"), String::from("Desc"));
            let accounts = test::default_accounts::<ink::env::DefaultEnvironment>();
            set_caller(accounts.alice);

            // Subscribe for 3 periods
            test::set_value_transferred::<ink::env::DefaultEnvironment>(300u128);
            let result = contract.subscribe().expect("subscribe ok");
            let (periods, _) = result;
            assert_eq!(periods, 3);
        }

        #[ink::test]
        fn creator_can_update_params() {
            let price = 100u128;
            let period = 5u32;
            let mut contract = CreatorDirect::new(price, period, String::from("Demo"), String::from("Desc"));
            let accounts = test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Creator updates params
            set_caller(accounts.alice);
            let result = contract.update_params(200u128, 10u32);
            assert!(result.is_ok());

            // Verify params updated
            let (new_price, new_period, _, _, _) = contract.get_params();
            assert_eq!(new_price, 200u128);
            assert_eq!(new_period, 10u32);
        }
    }
}
