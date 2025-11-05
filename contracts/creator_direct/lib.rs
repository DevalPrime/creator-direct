#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
pub mod creator_direct {
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    /// Subscription tier levels
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    #[cfg_attr(
        feature = "std",
        derive(ink::storage::traits::StorageLayout)
    )]
    pub enum SubscriptionTier {
        Bronze,
        Silver,
        Gold,
    }

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
        /// Multi-tier pricing: tier -> price per period
        tier_prices: Mapping<u8, Balance>,
        /// Map subscriber -> current tier
        subscriber_tier: Mapping<AccountId, u8>,
        /// Map subscriber -> auto-renewal enabled
        auto_renewal: Mapping<AccountId, bool>,
        /// NFT counter for access passes
        nft_counter: u64,
        /// Map subscriber -> NFT token ID
        nft_tokens: Mapping<AccountId, u64>,
        /// Analytics: total subscribers ever
        total_subscribers: u64,
        /// Analytics: total revenue earned
        total_revenue: Balance,
        /// Analytics: list of active subscribers
        active_subscribers: Vec<AccountId>,
    }

    #[ink(event)]
    pub struct Subscribed {
        #[ink(topic)]
        subscriber: AccountId,
        periods: u32,
        new_expiry: u32,
        amount: Balance,
        tier: u8,
    }

    #[ink(event)]
    pub struct GiftSubscription {
        #[ink(topic)]
        gifter: AccountId,
        #[ink(topic)]
        recipient: AccountId,
        periods: u32,
        new_expiry: u32,
        amount: Balance,
        tier: u8,
    }

    #[ink(event)]
    pub struct AutoRenewalToggled {
        #[ink(topic)]
        subscriber: AccountId,
        enabled: bool,
    }

    #[ink(event)]
    pub struct NFTMinted {
        #[ink(topic)]
        owner: AccountId,
        token_id: u64,
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

    #[ink(event)]
    pub struct TierPriceUpdated {
        tier: u8,
        price: Balance,
    }

    impl CreatorDirect {
        /// Instantiate with pricing and period parameters
        #[ink(constructor)]
        pub fn new(price_per_period: Balance, period_in_blocks: u32, name: String, description: String) -> Self {
            let caller = Self::env().caller();
            let mut contract = Self {
                creator: caller,
                price_per_period,
                period_in_blocks,
                expiry: Mapping::default(),
                has_pass: Mapping::default(),
                name,
                description,
                tier_prices: Mapping::default(),
                subscriber_tier: Mapping::default(),
                auto_renewal: Mapping::default(),
                nft_counter: 0,
                nft_tokens: Mapping::default(),
                total_subscribers: 0,
                total_revenue: 0,
                active_subscribers: Vec::new(),
            };
            // Initialize default tier prices (Bronze=0, Silver=1, Gold=2)
            contract.tier_prices.insert(0, &price_per_period); // Bronze
            contract.tier_prices.insert(1, &(price_per_period * 2)); // Silver (2x)
            contract.tier_prices.insert(2, &(price_per_period * 3)); // Gold (3x)
            contract
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
        /// Default to Bronze tier (0) for backward compatibility
        #[ink(message, payable)]
        pub fn subscribe(&mut self) -> Result<(u32, u32), String> {
            self.subscribe_with_tier(0)
        }

        /// Subscribe with a specific tier (0=Bronze, 1=Silver, 2=Gold)
        #[ink(message, payable)]
        pub fn subscribe_with_tier(&mut self, tier: u8) -> Result<(u32, u32), String> {
            let caller = self.env().caller();
            self.process_subscription(caller, caller, tier)
        }

        /// Gift a subscription to another account
        #[ink(message, payable)]
        pub fn gift_subscription(&mut self, recipient: AccountId, tier: u8) -> Result<(u32, u32), String> {
            let caller = self.env().caller();
            let result = self.process_subscription(caller, recipient, tier)?;
            
            self.env().emit_event(GiftSubscription {
                gifter: caller,
                recipient,
                periods: result.0,
                new_expiry: result.1,
                amount: self.env().transferred_value(),
                tier,
            });
            
            Ok(result)
        }

        /// Internal function to process subscription logic
        fn process_subscription(&mut self, _payer: AccountId, subscriber: AccountId, tier: u8) -> Result<(u32, u32), String> {
            if tier > 2 {
                return Err(String::from("Invalid tier (0=Bronze, 1=Silver, 2=Gold)"));
            }
            
            let tier_price = self.tier_prices.get(tier).unwrap_or(0);
            if tier_price == 0 {
                return Err(String::from("Tier price not set"));
            }
            
            let transferred = self.env().transferred_value();
            if transferred < tier_price {
                return Err(String::from("Insufficient amount sent for tier"));
            }
            
            #[allow(clippy::cast_possible_truncation, clippy::arithmetic_side_effects)]
            let periods: u32 = (transferred / tier_price) as u32;
            if periods == 0 {
                return Err(String::from("Amount does not cover a full period"));
            }
            
            let now = self.env().block_number();
            let current_expiry = self.expiry.get(subscriber).unwrap_or(0);
            let base = if current_expiry > now { current_expiry } else { now };
            let added_blocks = self.period_in_blocks.saturating_mul(periods);
            let new_expiry = base.saturating_add(added_blocks);
            
            self.expiry.insert(subscriber, &new_expiry);
            self.subscriber_tier.insert(subscriber, &tier);
            
            // Update analytics
            self.total_revenue = self.total_revenue.saturating_add(transferred);
            
            // Track new subscriber
            if !self.has_pass.get(subscriber).unwrap_or(false) {
                self.has_pass.insert(subscriber, &true);
                self.total_subscribers = self.total_subscribers.saturating_add(1);
                
                // Mint NFT access pass
                self.nft_counter = self.nft_counter.saturating_add(1);
                self.nft_tokens.insert(subscriber, &self.nft_counter);
                
                self.env().emit_event(NFTMinted {
                    owner: subscriber,
                    token_id: self.nft_counter,
                });
            }
            
            // Add to active subscribers if not already present
            if !self.active_subscribers.contains(&subscriber) {
                self.active_subscribers.push(subscriber);
            }
            
            self.env().emit_event(Subscribed {
                subscriber,
                periods,
                new_expiry,
                amount: transferred,
                tier,
            });
            
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

        /// Toggle auto-renewal for the caller's subscription
        #[ink(message)]
        pub fn toggle_auto_renewal(&mut self, enabled: bool) -> Result<(), String> {
            let caller = self.env().caller();
            self.auto_renewal.insert(caller, &enabled);
            self.env().emit_event(AutoRenewalToggled { subscriber: caller, enabled });
            Ok(())
        }

        /// Check if auto-renewal is enabled for an account
        #[ink(message)]
        pub fn is_auto_renewal_enabled(&self, account: AccountId) -> bool {
            self.auto_renewal.get(account).unwrap_or(false)
        }

        /// Get NFT token ID for a subscriber
        #[ink(message)]
        pub fn get_nft_token(&self, account: AccountId) -> Option<u64> {
            self.nft_tokens.get(account)
        }

        /// Get subscriber's current tier
        #[ink(message)]
        pub fn get_subscriber_tier(&self, account: AccountId) -> u8 {
            self.subscriber_tier.get(account).unwrap_or(0)
        }

        /// Get price for a specific tier
        #[ink(message)]
        pub fn get_tier_price(&self, tier: u8) -> Balance {
            self.tier_prices.get(tier).unwrap_or(0)
        }

        /// Creator can update tier prices
        #[ink(message)]
        pub fn update_tier_price(&mut self, tier: u8, price: Balance) -> Result<(), String> {
            self.ensure_creator()?;
            if tier > 2 {
                return Err(String::from("Invalid tier (0=Bronze, 1=Silver, 2=Gold)"));
            }
            self.tier_prices.insert(tier, &price);
            self.env().emit_event(TierPriceUpdated { tier, price });
            Ok(())
        }

        /// Get analytics data for creator dashboard
        /// Returns: (total_subscribers, total_revenue, active_count)
        #[ink(message)]
        pub fn get_analytics(&self) -> (u64, Balance, u32) {
            let now = self.env().block_number();
            let mut active_count = 0u32;
            
            // Count active subscribers
            for subscriber in &self.active_subscribers {
                let expiry = self.expiry.get(subscriber).unwrap_or(0);
                if expiry > now {
                    active_count = active_count.saturating_add(1);
                }
            }
            
            (self.total_subscribers, self.total_revenue, active_count)
        }

        /// Get all tier prices at once
        /// Returns: (bronze_price, silver_price, gold_price)
        #[ink(message)]
        pub fn get_all_tier_prices(&self) -> (Balance, Balance, Balance) {
            (
                self.tier_prices.get(0).unwrap_or(0),
                self.tier_prices.get(1).unwrap_or(0),
                self.tier_prices.get(2).unwrap_or(0),
            )
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
            assert_eq!(result.unwrap_err(), "Insufficient amount sent for tier");
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
            assert_eq!(result.unwrap_err(), "Tier price not set");
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

        #[ink::test]
        fn multi_tier_subscription_works() {
            let price = 100u128;
            let period = 5u32;
            let mut contract = CreatorDirect::new(price, period, String::from("Demo"), String::from("Desc"));
            let accounts = test::default_accounts::<ink::env::DefaultEnvironment>();
            set_caller(accounts.alice);

            // Subscribe to Silver tier (tier 1)
            test::set_value_transferred::<ink::env::DefaultEnvironment>(200u128); // Silver is 2x bronze
            let result = contract.subscribe_with_tier(1);
            assert!(result.is_ok());
            
            // Verify tier
            assert_eq!(contract.get_subscriber_tier(accounts.alice), 1);
            assert!(contract.is_active(accounts.alice));
        }

        #[ink::test]
        fn gift_subscription_works() {
            let price = 100u128;
            let period = 5u32;
            let mut contract = CreatorDirect::new(price, period, String::from("Demo"), String::from("Desc"));
            let accounts = test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Alice gifts subscription to Bob
            set_caller(accounts.alice);
            test::set_value_transferred::<ink::env::DefaultEnvironment>(100u128);
            let result = contract.gift_subscription(accounts.bob, 0);
            assert!(result.is_ok());
            
            // Bob should have active subscription
            assert!(contract.is_active(accounts.bob));
        }

        #[ink::test]
        fn auto_renewal_toggle_works() {
            let price = 100u128;
            let period = 5u32;
            let mut contract = CreatorDirect::new(price, period, String::from("Demo"), String::from("Desc"));
            let accounts = test::default_accounts::<ink::env::DefaultEnvironment>();
            set_caller(accounts.alice);

            // Enable auto-renewal
            let result = contract.toggle_auto_renewal(true);
            assert!(result.is_ok());
            assert!(contract.is_auto_renewal_enabled(accounts.alice));

            // Disable auto-renewal
            let result = contract.toggle_auto_renewal(false);
            assert!(result.is_ok());
            assert!(!contract.is_auto_renewal_enabled(accounts.alice));
        }

        #[ink::test]
        fn nft_minting_on_first_subscription() {
            let price = 100u128;
            let period = 5u32;
            let mut contract = CreatorDirect::new(price, period, String::from("Demo"), String::from("Desc"));
            let accounts = test::default_accounts::<ink::env::DefaultEnvironment>();
            set_caller(accounts.alice);

            // First subscription should mint NFT
            test::set_value_transferred::<ink::env::DefaultEnvironment>(100u128);
            let _ = contract.subscribe().expect("subscribe ok");
            
            // Verify NFT was minted
            assert!(contract.get_nft_token(accounts.alice).is_some());
            assert_eq!(contract.get_nft_token(accounts.alice).unwrap(), 1);
        }

        #[ink::test]
        fn analytics_tracking_works() {
            let price = 100u128;
            let period = 5u32;
            let mut contract = CreatorDirect::new(price, period, String::from("Demo"), String::from("Desc"));
            let accounts = test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Alice subscribes
            set_caller(accounts.alice);
            test::set_value_transferred::<ink::env::DefaultEnvironment>(100u128);
            let _ = contract.subscribe().expect("subscribe ok");
            
            // Bob subscribes
            set_caller(accounts.bob);
            test::set_value_transferred::<ink::env::DefaultEnvironment>(100u128);
            let _ = contract.subscribe().expect("subscribe ok");
            
            // Check analytics
            let (total_subs, total_rev, active_count) = contract.get_analytics();
            assert_eq!(total_subs, 2);
            assert_eq!(total_rev, 200u128);
            assert_eq!(active_count, 2);
        }

        #[ink::test]
        fn tier_prices_can_be_updated() {
            let price = 100u128;
            let period = 5u32;
            let mut contract = CreatorDirect::new(price, period, String::from("Demo"), String::from("Desc"));
            let accounts = test::default_accounts::<ink::env::DefaultEnvironment>();
            set_caller(accounts.alice);

            // Update Gold tier price
            let result = contract.update_tier_price(2, 500u128);
            assert!(result.is_ok());
            assert_eq!(contract.get_tier_price(2), 500u128);
        }

        #[ink::test]
        fn get_all_tier_prices_works() {
            let price = 100u128;
            let period = 5u32;
            let contract = CreatorDirect::new(price, period, String::from("Demo"), String::from("Desc"));
            
            let (bronze, silver, gold) = contract.get_all_tier_prices();
            assert_eq!(bronze, 100u128);
            assert_eq!(silver, 200u128);
            assert_eq!(gold, 300u128);
        }
    }
}
