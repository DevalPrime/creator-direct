# CreatorDirect Architecture

## Overview

CreatorDirect is a decentralized subscription platform that enables direct fan-to-creator payments with zero platform fees. The system is built on the Astar/Shibuya blockchain using ink! smart contracts and a React frontend.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Wallet     │  │  Contract    │  │ Subscription │       │
│  │  Integration │  │  Interaction │  │   Payment    │       │
│  │              │  │              │  │              │       │
│  │ Polkadot.js  │  │ ContractAPI  │  │   Subscribe  │       │
│  │  Extension   │  │              │  │   Function   │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                  │                  │             │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Polkadot.js API                          │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │  Web3 Accounts  │  │  Contract Calls   │                 │
│  │   Management    │  │  & Transactions   │                 │
│  └─────────────────┘  └──────────────────┘                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ WebSocket (wss://)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Astar/Shibuya Blockchain Network               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         CreatorDirect Smart Contract (ink!)          │   │
│  │                                                      │   │
│  │  Storage:                                            │   │
│  │  ├─ creator: AccountId                               │   │
│  │  ├─ price_per_period: Balance                        │   │
│  │  ├─ period_in_blocks: u32                            │   │
│  │  ├─ expiry: Mapping<AccountId, u32>                  │   │
│  │  ├─ has_pass: Mapping<AccountId, bool>               │   │
│  │  ├─ name: String                                     │   │
│  │  └─ description: String                              │   │
│  │                                                      │   │
│  │  Functions:                                          │   │
│  │  ├─ subscribe() [payable]                            │   │
│  │  ├─ is_active(account)                               │   │
│  │  ├─ get_subscription_info(account)                   │   │
│  │  ├─ withdraw() [creator only]                        │   │
│  │  └─ update_params() [creator only]                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Events:                                                    │
│  ├─ Subscribed                                              │
│  ├─ Withdrawn                                               │
│  └─ ParamsUpdated                                           │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend (React + Vite)

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling
- Polkadot.js for blockchain interaction
- CSS for styling

**Key Features:**
- Wallet connection via Polkadot.js browser extension
- Contract address input and validation
- Subscription payment interface
- Transaction status feedback
- QR code sharing for contract address

**Main Components:**
- `App.tsx`: Main application component with all functionality
- Wallet connection and account selection
- Contract interaction UI
- Payment and subscription flow

### Smart Contract (ink!)

**Technology Stack:**
- ink! 5.0 (Rust-based smart contract framework)
- Substrate contracts pallet
- WASM compilation target

**Storage:**
- `creator`: The account that receives subscription payments
- `price_per_period`: Cost per subscription period in native tokens
- `period_in_blocks`: Duration of one subscription period
- `expiry`: Mapping of subscriber addresses to their expiry block numbers
- `has_pass`: Tracks whether a subscriber has ever had access
- `name` & `description`: Contract metadata

**Key Functions:**

1. **subscribe() [payable]**
   - Accepts payment from subscribers
   - Calculates number of periods based on payment amount
   - Extends subscription from current expiry or current block
   - Emits `Subscribed` event

2. **is_active(account)**
   - Returns boolean indicating if subscription is currently active
   - Compares expiry block with current block number

3. **get_subscription_info(account)**
   - Returns tuple: (is_active, expiry_block, current_block, has_pass)
   - Used to query subscription status (can be called via Polkadot.js Apps)

4. **withdraw() [creator only]**
   - Transfers all contract balance to creator
   - Protected by creator-only modifier
   - Emits `Withdrawn` event

5. **update_params(price, period) [creator only]**
   - Allows creator to modify subscription pricing and duration
   - Protected by creator-only modifier
   - Emits `ParamsUpdated` event

### Blockchain Layer

**Astar/Shibuya Network:**
- Shibuya: Testnet for development and testing
- Astar: Production mainnet for live deployments
- Block time: ~12 seconds
- Smart contracts via WASM execution
- Native token payments

## Data Flow

### Subscription Flow

```
User Action                    Frontend                    Contract
    │                              │                          │
    ├──1. Connect Wallet──────────>│                          │
    │                              │                          │
    │                              ├──2. Load Accounts───────>│
    │                              │                          │
    ├──3. Set Contract Address────>│                          │
    │                              │                          │
    │                              ├──4. Load Contract Info──>│
    │                              │<─────────────────────────┤
    │                              │    (price, period, etc.) │
    │                              │                          │
    ├──5. Click Subscribe─────────>│                          │
    │   (select amount)            │                          │
    │                              │                          │
    │                              ├──6. Call subscribe()────>│
    │                              │    with payment          │
    │                              │                          │
    │                              │                          ├─7. Calculate periods
    │                              │                          │
    │                              │                          ├─8. Update expiry
    │                              │                          │
    │                              │<─9. Emit Subscribed──────┤
    │                              │    Event                 │
    │                              │                          │
    │<─10. Transaction confirmed───┤                          │
    │                              │                          │
```

### Withdrawal Flow (Creator Only)

The withdraw() function is available in the smart contract but not exposed in the simplified frontend UI. Creators should use [Polkadot.js Apps](https://polkadot.js.org/apps/) to interact with the contract directly:

```
Creator                    Polkadot.js Apps            Contract
   │                              │                          │
   ├──1. Navigate to contract────>│                          │
   │                              │                          │
   ├──2. Call withdraw()─────────>│                          │
   │                              │                          │
   │                              ├──3. Submit tx───────────>│
   │                              │                          │
   │                              │                          ├─4. Verify caller
   │                              │                          │   is creator
   │                              │                          │
   │                              │                          ├─5. Get balance
   │                              │                          │
   │                              │                          ├─6. Transfer to
   │                              │                          │   creator
   │                              │                          │
   │                              │<─7. Emit Withdrawn───────┤
   │                              │    Event                 │
   │                              │                          │
   │<─8. Transaction confirmed────┤                          │
```

## Security Considerations

### Smart Contract Security

1. **Access Control:**
   - Creator-only functions protected by `ensure_creator()` modifier
   - Only the contract creator can withdraw funds or update parameters

2. **Arithmetic Safety:**
   - Uses Rust's built-in overflow protection
   - Saturating arithmetic for critical calculations
   - Explicit casting with clippy warnings

3. **Payment Validation:**
   - Checks that sufficient funds are sent
   - Verifies price is set before accepting subscriptions
   - Calculates periods based on actual payment received

4. **State Management:**
   - Subscription extensions calculate from either current expiry or current block
   - Prevents loss of remaining subscription time on renewal
   - Idempotent operations where possible

### Frontend Security

1. **Wallet Integration:**
   - Uses official Polkadot.js extension
   - No private key handling in frontend
   - All transactions require user approval

2. **Input Validation:**
   - Contract address validation
   - Amount validation before sending transactions
   - Error handling for failed transactions

## Testing Strategy

### Unit Tests (Contract)

The contract includes comprehensive unit tests covering:

1. **Basic Functionality:**
   - Contract initialization
   - Subscription purchase and extension
   - Status checks

2. **Edge Cases:**
   - Insufficient funds handling
   - Expired subscription checks
   - Zero price validation
   - Multiple period subscriptions

3. **Access Control:**
   - Creator-only function protection
   - Non-creator rejection

4. **Subscription Logic:**
   - Renewal extends from expiry
   - Correct period calculation
   - Status info accuracy

### Integration Testing

Frontend integration with the contract should test:
- Wallet connection flow
- Contract loading and interaction
- Transaction signing and submission
- Transaction status feedback

## Deployment

### Shibuya Testnet
- Network: Shibuya (Astar testnet)
- RPC: `wss://rpc.shibuya.astar.network`
- Current Contract: `YQR6oMn2k8Yyzwb7w252jvA27ADa6AswAWfXFaYcMGSmhmq`
- Purpose: Development and testing

### Astar Mainnet
- Network: Astar
- RPC: `wss://rpc.astar.network`
- Purpose: Production deployment
- See DEPLOYMENT.md for detailed instructions

## Performance Considerations

1. **Block Time:** ~12 seconds on Shibuya/Astar
2. **Transaction Finality:** ~1-2 blocks for finalization
3. **Gas Costs:** Minimal for subscription and withdrawal operations
4. **Storage:** Efficient mapping structure for subscriber data

## Future Enhancements

Potential improvements for the system:

1. **Enhanced Frontend UI:** Real-time subscription status display, countdown timers, creator dashboard
2. **Multi-tier Subscriptions:** Support for different subscription levels
3. **Bulk Operations:** Batch subscription management
4. **Referral System:** Creator referral rewards
5. **NFT Integration:** Subscription as NFT for transferability
6. **Cross-chain Support:** Bridge to other Polkadot parachains
7. **Automatic Renewals:** Optional recurring payments
8. **Analytics Dashboard:** Detailed subscription metrics for creators
9. **Token Payments:** Support for custom tokens beyond native currency

## Resources

- [ink! Documentation](https://use.ink/)
- [Polkadot.js Documentation](https://polkadot.js.org/docs/)
- [Astar Documentation](https://docs.astar.network/)
- [Substrate Contracts Pallet](https://github.com/paritytech/substrate/tree/master/frame/contracts)
