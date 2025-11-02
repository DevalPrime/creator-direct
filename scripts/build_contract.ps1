# Build the ink! contract
param(
  [switch]$Release
)

$ErrorActionPreference = "Stop"

Push-Location "$PSScriptRoot\..\contracts\creator_direct"

if ($Release) {
  cargo contract build --release
} else {
  cargo contract build
}

Pop-Location
