# CreatorDirect

**Direct fan-to-creator subscriptions with zero platform fees**

Built with ink! smart contracts on Astar/Shibuya and a React frontend powered by Polkadot.js.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![ink! 5.0](https://img.shields.io/badge/ink!-5.0-blue)](https://use.ink/)
[![Astar](https://img.shields.io/badge/Network-Astar-purple)](https://astar.network/)

![CreatorDirect Application](https://github.com/user-attachments/assets/8eb5f3b4-0f14-4281-89cc-26ac8a1d0b4d)

## 🌟 Overview

CreatorDirect eliminates the middleman in creator-subscriber relationships. Traditional platforms take 20-30% fees; CreatorDirect takes **zero**. 

Creators receive payments directly on-chain with instant access to funds. Subscribers get transparent pricing and censorship-resistant access.

### Key Features

- 💰 **Zero Platform Fees** - Only minimal blockchain transaction costs
- ⚡ **Instant Payments** - Direct wallet-to-wallet transfers
- 🔒 **Censorship Resistant** - No platform can ban or deplatform
- 🌍 **Global Access** - Anyone with a wallet can participate
- 📊 **Transparent** - All transactions visible on-chain
- 🔧 **Flexible Pricing** - Creators set their own terms

## 📸 Screenshots

### Main Interface
The application features a clean, minimal interface focused on subscriptions:

- **Wallet Connection**: Easy integration with Polkadot.js Extension
- **Contract Interaction**: Simple address input and contract loading
- **Subscription Payment**: Enter payment amount and subscribe with one click
- **Status Messages**: Transaction status and confirmation feedback

*See the screenshot above for the full interface*

## 🏗️ Architecture

CreatorDirect consists of two main components:

### Smart Contract (ink!)
- **Language**: Rust with ink! framework
- **Chain**: Astar/Shibuya (Polkadot ecosystem)
- **Features**: Time-based subscriptions, creator withdrawals, parameter updates
- **Storage**: Efficient mapping for subscriber data

### Frontend (React)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Web3 Library**: Polkadot.js API
- **Features**: Wallet integration, contract interaction, subscription payments

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- [Polkadot.js Browser Extension](https://polkadot.js.org/extension/)
- [Rust](https://rustup.rs/) and cargo (for contract development)

### Run the Frontend

```bash
# Clone the repository
git clone https://github.com/DevalPrime/creator-direct.git
cd creator-direct

# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

### Use the Application

1. **Install Polkadot.js Extension**
   - Download from browser extension store
   - Create or import an account

2. **Connect Your Wallet**
   - Click "Connect Wallet"
   - Select your account
   - Approve the connection

3. **Subscribe to a Creator**
   - Paste the contract address: `YQR6oMn2k8Yyzwb7w252jvA27ADa6AswAWfXFaYcMGSmhmq`
   - Click "Check Contract" to load contract details
   - Enter payment amount in plancks (e.g., 1000000000000000000 = 1 SBY)
   - Click "Subscribe & Pay"
   - Sign the transaction in your wallet

4. **Verify Subscription**
   - Open [Polkadot.js Apps](https://polkadot.js.org/apps/)
   - Connect to Shibuya network: Settings → Select "Shibuya" or use `wss://rpc.shibuya.astar.network`
   - Navigate to Developer → Contracts
   - Add the contract address and interact with it
   - Call `is_active(your_address)` to check subscription status
   - Call `get_subscription_info(your_address)` to see expiry details

> **Note for Creators**: To manage your contract (withdraw funds, update pricing), use [Polkadot.js Apps](https://polkadot.js.org/apps/) contract interface directly on the Shibuya network.

## 📦 Deployment

### Current Deployments

**Shibuya Testnet** (Active)
- Network: Shibuya (Astar testnet)
- RPC: `wss://rpc.shibuya.astar.network`
- Contract: `YQR6oMn2k8Yyzwb7w252jvA27ADa6AswAWfXFaYcMGSmhmq`
- Purpose: Testing and development
- Get test tokens: [Shibuya Faucet](https://portal.astar.network)

**Astar Mainnet** (Ready to Deploy)
- Network: Astar
- RPC: `wss://rpc.astar.network`
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for mainnet deployment guide

### Deploy Your Own Contract

```bash
# Install cargo-contract
cargo install cargo-contract --force

# Build the contract
cd contracts/creator_direct
cargo contract build --release

# Deploy via Contracts UI
# 1. Visit https://contracts-ui.substrate.io/
# 2. Connect to Shibuya or Astar
# 3. Upload target/ink/creator_direct.contract
# 4. Set constructor parameters:
#    - price_per_period: Your subscription price in plancks
#    - period_in_blocks: Duration (e.g., 1000 blocks ≈ 3.3 hours)
#    - name: Your creator name
#    - description: Description of your offering
# 5. Deploy and save the contract address
```

For detailed deployment instructions, including mainnet deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🧪 Testing

### Smart Contract Tests

The contract includes comprehensive unit tests (11 test cases):

```bash
cd contracts/creator_direct
cargo test
```

**Test Coverage:**
- ✅ Contract initialization
- ✅ Subscription purchases and extensions
- ✅ Insufficient funds handling
- ✅ Expired subscription checks
- ✅ Creator-only function protection
- ✅ Zero price validation
- ✅ Multi-period subscriptions
- ✅ Subscription renewal logic
- ✅ Parameter updates
- ✅ Withdrawal functionality
- ✅ Subscription info retrieval

### Frontend Testing

```bash
cd frontend

# Lint the code
npm run lint

# Format check
npm run format:check

# Build for production
npm run build
```

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed system architecture and design
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide for testnet and mainnet
- **[BLOG.md](./BLOG.md)** - Technical blog post explaining the approach

## 🛠️ Technology Stack

### Smart Contract
- **ink! 5.0** - Rust-based smart contract framework
- **Substrate Contracts Pallet** - WASM contract execution
- **Cargo Contract** - Build and deployment tooling

### Frontend
- **React 18** - UI framework with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Polkadot.js API** - Blockchain interaction library
- **Polkadot.js Extension** - Wallet integration

### Blockchain
- **Astar Network** - Production parachain on Polkadot
- **Shibuya Testnet** - Test environment for Astar
- **WASM Runtime** - Smart contract execution engine

## 📁 Project Structure

```
creator-direct/
├── contracts/
│   └── creator_direct/
│       ├── Cargo.toml          # Contract dependencies
│       └── lib.rs              # Smart contract code
├── frontend/
│   ├── public/
│   │   └── metadata.json       # Contract ABI
│   ├── src/
│   │   ├── App.tsx            # Main application
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom hooks
│   │   └── styles.css         # Styling
│   ├── package.json           # Frontend dependencies
│   └── vite.config.ts         # Vite configuration
├── docs/
│   └── images/                # Documentation images
├── scripts/                   # Deployment scripts
├── ARCHITECTURE.md            # Architecture documentation
├── DEPLOYMENT.md              # Deployment guide
├── BLOG.md                    # Technical blog post
└── README.md                  # This file
```

## 💡 Use Cases

### For Creators
- **Content Creators**: YouTubers, podcasters, bloggers
- **Artists**: Musicians, digital artists, performers
- **Educators**: Course creators, tutors, coaches
- **Developers**: Open source maintainers, tool builders
- **Communities**: Private Discord servers, forums, clubs

### Benefits Over Traditional Platforms
| Feature | Traditional Platform | CreatorDirect |
|---------|---------------------|---------------|
| Platform Fee | 20-30% | 0% |
| Payment Delay | 7-30 days | Instant |
| Minimum Payout | $50-100 | None |
| Geographic Restrictions | Many | None |
| Censorship Risk | High | None |
| Transaction Fees | 3-5% | ~$0.0001 |

## 🔒 Security

### Smart Contract Security
- ✅ Comprehensive unit test coverage
- ✅ Rust's memory safety guarantees
- ✅ Overflow protection with saturating arithmetic
- ✅ Access control for creator-only functions
- ✅ Reentrancy protection
- ✅ Input validation

### Frontend Security
- ✅ No private key handling (uses wallet extension)
- ✅ All transactions require user approval
- ✅ Input validation and sanitization
- ✅ HTTPS/WSS only for RPC connections
- ✅ Error boundaries for graceful failures

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs**: Open an issue describing the problem
2. **Suggest Features**: Share your ideas for improvements
3. **Submit PRs**: Fix bugs or add features
4. **Improve Documentation**: Help make docs clearer
5. **Share**: Tell other creators about CreatorDirect

### Development Setup

```bash
# Fork the repository
git clone https://github.com/YOUR_USERNAME/creator-direct.git
cd creator-direct

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and test
cd contracts/creator_direct && cargo test
cd ../../frontend && npm run lint

# Commit and push
git add .
git commit -m "Add your feature"
git push origin feature/your-feature-name

# Open a Pull Request
```

## 📖 Additional Resources

### Learn More
- [ink! Documentation](https://use.ink/) - Learn about ink! smart contracts
- [Polkadot.js Docs](https://polkadot.js.org/docs/) - Web3 library documentation
- [Astar Docs](https://docs.astar.network/) - Astar network documentation
- [Substrate Contracts](https://docs.substrate.io/tutorials/smart-contracts/) - Contract development guide

### Community
- [Astar Discord](https://discord.gg/astarnetwork) - Join the Astar community
- [Polkadot Forum](https://forum.polkadot.network/) - Discuss Polkadot ecosystem
- [ink! GitHub](https://github.com/paritytech/ink) - Contribute to ink!

### Block Explorers
- [Shibuya Subscan](https://shibuya.subscan.io/) - Shibuya testnet explorer
- [Astar Subscan](https://astar.subscan.io/) - Astar mainnet explorer

## 🎯 Roadmap

### Current Version (v0.1.0)
- ✅ Basic subscription functionality
- ✅ Creator withdrawal
- ✅ Parameter updates
- ✅ Frontend UI
- ✅ Shibuya testnet deployment

### Future Enhancements
- [ ] Enhanced frontend UI (real-time status, countdown timers, creator dashboard)
- [ ] Multi-tier subscription levels
- [ ] NFT-based subscriptions (transferable)
- [ ] Referral reward system
- [ ] Analytics dashboard for creators
- [ ] Cross-chain support (other parachains)
- [ ] Custom token payments
- [ ] Batch operations
- [ ] Auto-renewal options
- [ ] Mobile wallet support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Astar Network** - For providing an excellent platform for WASM contracts
- **Parity Technologies** - For ink! and Substrate
- **Polkadot.js** - For comprehensive blockchain interaction tools
- **The Creator Community** - For inspiring this project

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/DevalPrime/creator-direct/issues)
- **Documentation**: See [ARCHITECTURE.md](./ARCHITECTURE.md) and [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Blog Post**: Read about our approach in [BLOG.md](./BLOG.md)

---

**Built with ❤️ for creators everywhere**

**Powered by Astar Network and ink! smart contracts**

*Zero platform fees. Maximum creator freedom.*
