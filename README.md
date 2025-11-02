# CreatorDirect (Polkadot Hackathon)

Direct fan-to-creator subscriptions with zero platform fees. Built with ink! smart contracts on Astar Shibuya and a React + Polkadot.js frontend.

- Chain: Shibuya Testnet (Astar)
- Contract address: `YQR6oMn2k8Yyzwb7w252jvA27ADa6AswAWfXFaYcMGSmhmq`
- Frontend: React + Vite + Polkadot.js

## Features
- Subscribe with on-chain micropayments (pay in plancks)
- Live status + countdown to expiry
- Creator dashboard (balance + withdraw)
- Quick-fill amounts, QR sharing, copy address, toasts

## Run locally
```powershell
# 1) Frontend
cd frontend
npm install
npm run dev  # open the shown localhost URL

# 2) Contract (optional: rebuild)
cd contracts/creator_direct
cargo contract build --release
```

Notes
- Frontend expects updated `frontend/public/metadata.json` (already provided).
- Shibuya block time ≈ 12 seconds; default period ≈ 1000 blocks.

## Folder structure
```
contracts/creator_direct/   # ink! contract (Rust)
frontend/                   # React app (Vite)
```

## Judge checklist
- Connect wallet (Polkadot.js extension)
- Paste contract address
- Click Subscribe → sign transaction
- See active status and countdown
- Creator can Withdraw funds

## License
MIT
