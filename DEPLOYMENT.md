# Deployment Guide

This guide covers deploying the CreatorDirect smart contract to both Shibuya testnet and Astar mainnet.

## Prerequisites

### Software Requirements

1. **Rust and Cargo**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup component add rust-src
   ```

2. **cargo-contract**
   ```bash
   cargo install cargo-contract --force
   ```

3. **Node.js and npm** (for frontend)
   ```bash
   # Install Node.js 20+ and npm
   # Verify installation
   node --version
   npm --version
   ```

4. **Polkadot.js Browser Extension**
   - Chrome: Install from Chrome Web Store
   - Firefox: Install from Firefox Add-ons

### Account Setup

1. Create accounts using Polkadot.js extension
2. For testnet: Get SBY tokens from [Shibuya Faucet](https://portal.astar.network)
3. For mainnet: Acquire ASTR tokens from exchanges

## Building the Contract

### 1. Build the Smart Contract

```bash
cd contracts/creator_direct
cargo contract build --release
```

This generates three files in `target/ink/`:
- `creator_direct.wasm` - Contract bytecode
- `creator_direct.json` - Contract metadata
- `metadata.json` - Simplified metadata

### 2. Verify Build Output

```bash
ls -lh target/ink/
```

Expected files:
- `creator_direct.contract` (includes both WASM and metadata)
- `creator_direct.wasm`
- `metadata.json`

## Deployment to Shibuya Testnet

### Step 1: Get Test Tokens

1. Visit [Astar Portal](https://portal.astar.network)
2. Connect your wallet
3. Switch to Shibuya network
4. Request SBY tokens from the faucet

### Step 2: Deploy Contract via Contracts UI

1. **Access Contracts UI:**
   - Visit: https://contracts-ui.substrate.io/
   - Or use: https://polkadot.js.org/apps/

2. **Connect to Shibuya:**
   - Click network selector (top-left)
   - Select "Shibuya Testnet"
   - RPC Endpoint: `wss://rpc.shibuya.astar.network`

3. **Upload Contract:**
   - Navigate to "Developer" → "Contracts"
   - Click "Upload & Deploy Code"
   - Upload `creator_direct.contract` file
   - Review ABI/Metadata

4. **Instantiate Contract:**
   - Set constructor parameters:
     - `price_per_period`: e.g., `1000000000000000000` (1 SBY in plancks)
     - `period_in_blocks`: e.g., `1000` (≈3.3 hours on Shibuya)
     - `name`: Your creator name (e.g., "My Creator Channel")
     - `description`: Short description (e.g., "Premium content access")
   - Set deployment parameters:
     - Endowment: `1000000000000000000` (1 SBY minimum)
     - Gas Limit: Auto-calculate or use `1000000000`
   - Click "Deploy"
   - Sign transaction in wallet

5. **Save Contract Address:**
   - Copy the deployed contract address
   - Format: `YQR6oMn2k8Yyzwb7w252jvA27ADa6AswAWfXFaYcMGSmhmq`
   - Save this for frontend configuration

### Step 3: Deploy Contract via CLI (Alternative)

```bash
# Using cargo-contract
cargo contract instantiate \
  --constructor new \
  --args 1000000000000000000 1000 "My Creator" "Premium Content" \
  --suri "//Alice" \
  --url wss://rpc.shibuya.astar.network \
  --execute

# Save the contract address from output
```

### Step 4: Configure Frontend

1. **Update contract address:**
   ```typescript
   // frontend/src/App.tsx or constants.ts
   const DEFAULT_CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS_HERE'
   ```

2. **Copy metadata file:**
   ```bash
   cp contracts/creator_direct/target/ink/metadata.json frontend/public/
   ```

3. **Build frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

### Step 5: Test Deployment

1. Run frontend locally:
   ```bash
   npm run dev
   ```

2. Connect wallet with test account
3. Paste contract address
4. Test subscription flow
5. Test withdrawal (as creator)

## Deployment to Astar Mainnet

### Step 1: Prepare for Mainnet

⚠️ **Important Mainnet Considerations:**

1. **Security Audit:** Consider getting contract audited
2. **Test Thoroughly:** Extensive testing on Shibuya first
3. **Backup Keys:** Secure backup of creator account
4. **Gas Costs:** Ensure sufficient ASTR for deployment
5. **Contract Immutability:** Cannot be upgraded after deployment

### Step 2: Acquire ASTR Tokens

Obtain ASTR tokens from:
- Centralized exchanges (Binance, KuCoin, etc.)
- Decentralized exchanges (Arthswap, etc.)
- Bridge from other chains

Recommended amounts:
- Contract deployment: 5-10 ASTR
- Testing transactions: 1-2 ASTR
- Buffer for operations: 5+ ASTR

### Step 3: Deploy to Astar

1. **Access Contracts UI:**
   - Visit: https://contracts-ui.substrate.io/
   - Or: https://polkadot.js.org/apps/

2. **Connect to Astar:**
   - Click network selector
   - Select "Astar Network"
   - RPC Endpoint: `wss://rpc.astar.network`
   - Verify connection (green dot)

3. **Upload Contract:**
   - Navigate to "Developer" → "Contracts"
   - Click "Upload & Deploy Code"
   - Upload `creator_direct.contract`
   - Review metadata carefully

4. **Set Production Parameters:**
   ```
   price_per_period: Consider your pricing strategy
   - Example: 5000000000000000000 (5 ASTR per period)
   - Calculate in plancks: 1 ASTR = 10^18 plancks
   
   period_in_blocks: Consider subscription duration
   - 1 day: ~7200 blocks
   - 1 week: ~50400 blocks
   - 1 month: ~216000 blocks
   
   name: Your production creator name
   description: Clear value proposition
   ```

5. **Deploy with Sufficient Endowment:**
   - Endowment: 10+ ASTR recommended
   - Gas Limit: Auto-calculate
   - Review all parameters twice
   - Sign and deploy

6. **Verify Deployment:**
   - Confirm transaction on block explorer
   - Test contract calls
   - Verify state is correct

### Step 4: Configure Production Frontend

1. **Update configuration:**
   ```typescript
   // Use environment variables for production
   const NETWORK_CONFIG = {
     development: {
       rpc: 'wss://rpc.shibuya.astar.network',
       contract: 'SHIBUYA_CONTRACT_ADDRESS'
     },
     production: {
       rpc: 'wss://rpc.astar.network',
       contract: 'ASTAR_CONTRACT_ADDRESS'
     }
   }
   ```

2. **Build production frontend:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy frontend:**
   - To IPFS: Use Fleek, Pinata, or NFT.Storage
   - To traditional hosting: Vercel, Netlify, or AWS
   - To Astar EVM+: Deploy as static site

### Step 5: Verify and Monitor

1. **Functional Testing:**
   - Connect with multiple test wallets
   - Test subscription flow end-to-end
   - Verify expiry calculations
   - Test withdrawal function

2. **Monitor Contract:**
   - Check contract balance
   - Monitor events
   - Track subscriber count
   - Use Subscan for analytics: https://astar.subscan.io/

3. **Set Up Alerts:**
   - Monitor for contract interactions
   - Track withdrawal events
   - Alert on unusual activity

## Multi-Network Configuration

### Supporting Both Networks

For applications supporting both Shibuya and Astar:

```typescript
// frontend/src/config.ts
export const NETWORKS = {
  shibuya: {
    name: 'Shibuya Testnet',
    rpc: 'wss://rpc.shibuya.astar.network',
    contract: 'SHIBUYA_CONTRACT_ADDRESS',
    blockTime: 12000,
    explorer: 'https://shibuya.subscan.io'
  },
  astar: {
    name: 'Astar Network',
    rpc: 'wss://rpc.astar.network',
    contract: 'ASTAR_CONTRACT_ADDRESS',
    blockTime: 12000,
    explorer: 'https://astar.subscan.io'
  }
}

// Auto-detect or allow user selection
export function getNetwork() {
  const env = process.env.REACT_APP_NETWORK || 'shibuya'
  return NETWORKS[env]
}
```

### Network Switcher UI

Add network selection in frontend:

```typescript
function NetworkSelector() {
  const [network, setNetwork] = useState('shibuya')
  
  return (
    <select onChange={(e) => setNetwork(e.target.value)}>
      <option value="shibuya">Shibuya Testnet</option>
      <option value="astar">Astar Mainnet</option>
    </select>
  )
}
```

## Deployment Checklist

### Pre-Deployment

- [ ] Contract code reviewed and tested
- [ ] All unit tests passing (cargo test)
- [ ] Frontend tested locally
- [ ] Accounts created with sufficient funds
- [ ] Backup of creator account seed phrase
- [ ] Parameters calculated and documented
- [ ] Metadata file generated and verified

### Shibuya Deployment

- [ ] SBY tokens obtained from faucet
- [ ] Contract deployed to Shibuya
- [ ] Contract address saved and documented
- [ ] Frontend configured with Shibuya contract
- [ ] End-to-end testing completed
- [ ] Test subscriptions created
- [ ] Withdrawal tested

### Astar Deployment (Optional)

- [ ] Security audit completed (recommended)
- [ ] ASTR tokens acquired
- [ ] Production parameters finalized
- [ ] Contract deployed to Astar
- [ ] Contract address saved securely
- [ ] Frontend configured for production
- [ ] Production domain configured
- [ ] Monitoring and analytics set up
- [ ] Emergency procedures documented
- [ ] Team briefed on operations

## Troubleshooting

### Common Deployment Issues

**Issue: "Insufficient funds"**
- Solution: Ensure account has enough tokens for gas + endowment

**Issue: "Contract instantiation failed"**
- Solution: Check constructor parameters are correct types
- Verify gas limit is sufficient
- Check endowment meets minimum requirements

**Issue: "Module not found" during build**
- Solution: Ensure rust-src component installed
- Run: `rustup component add rust-src`

**Issue: "Out of gas"**
- Solution: Increase gas limit or simplify constructor logic
- Use auto-calculate gas feature

### Frontend Connection Issues

**Issue: "Failed to connect to RPC"**
- Solution: Check network connectivity
- Verify RPC endpoint is correct
- Try alternative RPC endpoints

**Issue: "Extension not found"**
- Solution: Install Polkadot.js extension
- Refresh page after installation
- Check extension is enabled for site

## Post-Deployment Maintenance

### Regular Tasks

1. **Monitor Contract Balance:**
   - Check regularly for accumulated subscriptions
   - Withdraw periodically to secure funds

2. **Track Subscribers:**
   - Monitor active subscriptions
   - Track churn and renewal rates
   - Analyze subscription patterns

3. **Update Frontend:**
   - Keep dependencies updated
   - Monitor for security advisories
   - Update UI based on user feedback

4. **Communication:**
   - Announce network maintenance
   - Notify of parameter changes
   - Provide support documentation

### Emergency Procedures

**If Contract Issues Arise:**

1. Stop directing new users to contract
2. Withdraw all funds to secure account
3. Deploy corrected contract
4. Migrate users to new contract
5. Update frontend configuration
6. Communicate changes to users

**If Blockchain Network Issues:**

- Monitor Astar official channels
- Switch to backup RPC endpoints
- Inform users of temporary unavailability
- Resume once network is stable

## Resources

### Official Documentation

- [Astar Portal](https://portal.astar.network)
- [Astar Docs](https://docs.astar.network/)
- [ink! Documentation](https://use.ink/)
- [Substrate Contracts](https://docs.substrate.io/tutorials/smart-contracts/)

### Tools

- [Contracts UI](https://contracts-ui.substrate.io/)
- [Polkadot.js Apps](https://polkadot.js.org/apps/)
- [Subscan Explorer](https://astar.subscan.io/)
- [cargo-contract](https://github.com/paritytech/cargo-contract)

### Community

- [Astar Discord](https://discord.gg/astarnetwork)
- [Substrate Stack Exchange](https://substrate.stackexchange.com/)
- [Polkadot Forum](https://forum.polkadot.network/)

## Cost Estimation

### Shibuya Testnet
- Contract Deployment: ~1 SBY (free from faucet)
- Transaction: ~0.0001 SBY
- Total for testing: ~2-5 SBY (all from faucet)

### Astar Mainnet
- Contract Deployment: ~5-10 ASTR
- Transaction: ~0.001 ASTR
- Endowment: 10+ ASTR recommended
- Total initial: ~15-25 ASTR
- Ongoing: Minimal (only withdrawal gas)

## Support

For deployment assistance:
- Check GitHub Issues
- Join Astar Discord
- Review ink! documentation
- Contact the development team
