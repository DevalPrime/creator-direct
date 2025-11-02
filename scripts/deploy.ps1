# Deploy the ink! contract to a node or via Contracts UI helper
# This script prepares the bundle path and prints guidance.

$bundle = Join-Path $PSScriptRoot "..\contracts\creator_direct\target\ink\creator_direct.contract"

if (!(Test-Path $bundle)) {
  Write-Host "Bundle not found: $bundle"
  Write-Host "Run scripts\\build_contract.ps1 -Release first."
  exit 1
}

Write-Host "Contract bundle ready at: $bundle"
Write-Host "You can deploy using the Substrate Contracts UI: https://contracts-ui.substrate.io/"
Write-Host "Recommended network: Shibuya (Astar testnet)"
Write-Host "Constructor params: price_per_period (Balance), period_in_blocks (u32), name (String), description (String)"
