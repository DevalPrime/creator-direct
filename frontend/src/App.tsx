import React, { useEffect, useMemo, useState } from 'react'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { ContractPromise } from '@polkadot/api-contract'
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp'
import './styles.css'

// Minimal UI: connect wallet, set contract, subscribe

const SHIBUYA_WS = 'wss://rpc.shibuya.astar.network'
const BLOCK_TIME_MS = 12_000 // Shibuya ~12s per block
const APP_NAME = 'CreatorDirect'

// Small presentational component: circular progress ring
function ProgressRing({ percent, label, sub }: { percent: number; label?: string; sub?: string }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const p = Math.max(0, Math.min(100, Math.round(percent)))
  const dash = (p / 100) * circumference
  return (
    <div className="ring">
      <svg viewBox="0 0 70 70" aria-label="progress">
        <circle cx="35" cy="35" r={radius} fill="none" stroke="#eee" strokeWidth="8" />
        <circle
          cx="35"
          cy="35"
          r={radius}
          fill="none"
          stroke="#667eea"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform="rotate(-90 35 35)"
        />
        <text x="35" y="39" textAnchor="middle" fontSize="14" fontWeight="700" fill="#333">
          {p}%
        </text>
      </svg>
      <div>
        <div className="label">{label}</div>
        {sub && <div className="sub">{sub}</div>}
      </div>
    </div>
  )
}

export default function App() {
  const [api, setApi] = useState<ApiPromise | null>(null)
  const [account, setAccount] = useState<string>('')
  const [allAccounts, setAllAccounts] = useState<{ address: string; name?: string }[]>([])
  const [contractAddress, setContractAddress] = useState<string>('')
  const [metadata, setMetadata] = useState<any>(null)
  const [pricePerPeriod, setPricePerPeriod] = useState<string>('1000000000000000000')
  const [periodBlocks, setPeriodBlocks] = useState<string>('600')
  const [status, setStatus] = useState<string>('')
  const [contractInfo, setContractInfo] = useState<string>('')
  const [chainParams, setChainParams] = useState<{
    price: bigint
    period: number
    creator: string
  } | null>(null)
  const [currentBlock, setCurrentBlock] = useState<number>(0)
  const [subInfo, setSubInfo] = useState<{
    active: boolean
    expiry: number
    now: number
    hasPass: boolean
  } | null>(null)
  const [isBusy, setIsBusy] = useState<boolean>(false)
  const [txHistory, setTxHistory] = useState<string[]>([])
  const [contractBalance, setContractBalance] = useState<bigint>(0n)
  const [showQr, setShowQr] = useState(false)
  const [toasts, setToasts] = useState<
    Array<{ id: number; type: 'success' | 'error' | 'info' | 'warning'; text: string }>
  >([])

  useEffect(() => {
    const connect = async () => {
      try {
        const provider = new WsProvider(SHIBUYA_WS)
        const api = await ApiPromise.create({ provider })
        setApi(api)
        setStatus('Connected to Shibuya')

        // Subscribe to new heads for live block number
        const unsub = await api.rpc.chain.subscribeNewHeads((header) => {
          const bn = header.number.toNumber()
          setCurrentBlock(bn)
        })
        // Cleanup on unmount
        return () => unsub && (unsub as any)()
      } catch (e) {
        console.error(e)
        setStatus('Failed to connect to chain')
      }
    }
    connect()

    // Load contract metadata
    const loadMetadata = async () => {
      try {
        const response = await fetch('/metadata.json')
        const data = await response.json()
        setMetadata(data)
      } catch (e) {
        console.error('Failed to load metadata:', e)
      }
    }
    loadMetadata()
  }, [])

  const connectWallet = async () => {
    try {
      // Enable the extension
      const extensions = await web3Enable(APP_NAME)
      if (extensions.length === 0) {
        setStatus('Install Polkadot.js extension')
        return
      }

      // Get all accounts
      const accounts = await web3Accounts()
      if (accounts.length === 0) {
        setStatus('No accounts found in extension')
        return
      }

      setAllAccounts(
        accounts.map((acc) => ({ address: acc.address, name: acc.meta.name as string }))
      )
      if (accounts.length) setAccount(accounts[0].address)
      setStatus('Wallet connected')
    } catch (e) {
      console.error(e)
      setStatus('Wallet connection failed')
    }
  }

  const checkContractParams = async () => {
    if (!api || !metadata || !contractAddress || !account) {
      return setContractInfo('Enter contract address first')
    }

    try {
      const contract = new ContractPromise(api, metadata, contractAddress)
      const gasLimit = api.registry.createType('WeightV2', {
        refTime: 10_000_000_000n,
        proofSize: 500_000n,
      }) as any

      const { result, output } = await contract.query.getParams(account, { gasLimit })

      if (result.isOk && output) {
        const data = output.toHuman()
        console.log('Contract params:', data)
        if (data && typeof data === 'object' && 'Ok' in data) {
          const params = (data as any).Ok
          const priceStr = String(params[0])
          const price = BigInt(priceStr.replace(/,/g, ''))
          const period = Number(String(params[1]).replace(/,/g, ''))
          const creator = String(params[4])
          setChainParams({ price, period, creator })
          setContractInfo(
            `📋 Contract Settings: Price=${params[0]} plancks/period, Period=${params[1]} blocks, Creator=${params[4]}`
          )
        } else {
          setChainParams(null)
          setContractInfo(JSON.stringify(data))
        }
      } else {
        setContractInfo('❌ Could not read contract params')
      }
    } catch (e: any) {
      setContractInfo(`❌ Error: ${e.message}`)
    }
  }

  const notify = (text: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, text, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }

  const copyAddress = async () => {
    try {
      if (!contractAddress) return
      await navigator.clipboard.writeText(contractAddress)
      notify('Contract address copied', 'success')
    } catch {}
  }

  // Fetch subscription info (new ABI) with graceful fallback
  const refreshSubscription = async () => {
    if (!api || !metadata || !contractAddress || !account) return
    try {
      const contract = new ContractPromise(api, metadata, contractAddress)
      const gasLimit = api.registry.createType('WeightV2', {
        refTime: 8_000_000_000n,
        proofSize: 200_000n,
      }) as any
      // Try new helper (requires updated metadata.json)
      // @ts-ignore - dynamic message may not exist on older metadata
      if ((contract.query as any).getSubscriptionInfo) {
        // @ts-ignore
        const { result, output } = await (contract.query as any).getSubscriptionInfo(
          account,
          { gasLimit },
          account
        )
        if (result.isOk && output) {
          const human = output.toHuman() as any
          const ok = (human && human.Ok) || human
          // ok should be [active, expiry, now, has_pass]
          const [active, expiry, now, hasPass] = ok
          setSubInfo({
            active: active === true || active === 'true',
            expiry: Number(String(expiry).replace(/,/g, '')),
            now: Number(String(now).replace(/,/g, '')),
            hasPass: hasPass === true || hasPass === 'true',
          })
          return
        }
      }
      // Fallback: only know active flag
      const { result, output } = await contract.query.isActive(account, { gasLimit }, account)
      if (result.isOk && output) {
        const human = output.toHuman() as any
        const ok = (human && human.Ok) || human
        const active = ok === true || ok === 'true'
        setSubInfo({ active, expiry: 0, now: currentBlock, hasPass: false })
      }
    } catch (e) {
      console.warn('refreshSubscription failed', e)
    }
  }

  // Fetch contract balance (creator dashboard)
  const refreshContractBalance = async () => {
    if (!api || !contractAddress) return
    try {
      // Query system account for contract address
      const info = await (api.query as any).system.account(contractAddress)
      const free = (info as any).data.free.toBigInt()
      setContractBalance(free)
    } catch (e) {
      console.warn('refreshContractBalance failed', e)
    }
  }

  const subscribe = async () => {
    if (!api) return setStatus('API not ready')
    if (!account) return setStatus('Select an account')
    if (!contractAddress) return setStatus('Enter contract address')
    if (!metadata) return setStatus('Metadata not loaded')

    try {
      setIsBusy(true)
      setStatus('Preparing transaction...')

      const injector = await web3FromAddress(account)
      const contract = new ContractPromise(api, metadata, contractAddress)
      const value = BigInt(pricePerPeriod)

      // Validate that value is enough
      if (value === 0n) {
        return setStatus(
          '❌ Price cannot be 0. Enter amount in plancks (e.g., 1000000000000000000 = 1 SBY)'
        )
      }

      console.log('Subscribing with:', {
        account,
        contractAddress,
        value: value.toString(),
        valueInSBY: Number(value) / 1e18,
      })

      // Check account balance first
      const accountInfo = await api.query.system.account(account)
      const balance = (accountInfo as any).data.free.toBigInt()
      const balanceInSBY = Number(balance) / 1e18

      console.log('Account balance:', {
        free: balance.toString(),
        inSBY: balanceInSBY.toFixed(4),
      })

      // Need at least value for subscription + ~0.1 SBY for gas
      const minRequired = value + BigInt(100_000_000_000_000_000) // value + 0.1 SBY for gas
      if (balance < minRequired) {
        const required = Number(minRequired) / 1e18
        return setStatus(
          `❌ Insufficient balance. Have: ${balanceInSBY.toFixed(4)} SBY, Need: ~${required.toFixed(4)} SBY. Get more from faucet.`
        )
      }

      // First do a dry-run to check if it will succeed
      setStatus('Checking contract call...')
      const gasLimit = api.registry.createType('WeightV2', {
        refTime: 30_000_000_000n,
        proofSize: 1_000_000n,
      }) as any

      const { gasRequired, storageDeposit, result, output, debugMessage } =
        await contract.query.subscribe(account, { value, gasLimit })

      console.log('Dry-run full result:', {
        result: result.toHuman(),
        flags: (result as any).flags?.toHuman
          ? (result as any).flags.toHuman()
          : (result as any).flags,
        output: output?.toHuman(),
        debugMessage: debugMessage.toHuman(),
      })

      // Check the result flags - ink! contracts return Ok but set a revert flag
      if (result.isOk) {
        const flags = (result as any).flags || []
        const hasRevertFlag = Array.isArray(flags) ? flags.includes('Revert') : false

        console.log('Result flags:', flags, 'Has revert:', hasRevertFlag)

        if (hasRevertFlag) {
          const debugMsg = debugMessage.toString()
          return setStatus(`❌ Contract will revert: ${debugMsg || 'Unknown reason'}`)
        }

        if (output) {
          const data = output.toHuman()
          console.log('Dry-run output:', data)

          // Check if the contract function returned an error Result
          if (data && typeof data === 'object' && 'Err' in data) {
            const errorMsg = JSON.stringify((data as any).Err)
            return setStatus(`❌ Contract returned error: ${errorMsg}`)
          }
        }

        console.log('Gas required:', gasRequired.toHuman())
        console.log('Storage deposit:', storageDeposit.toHuman())

        // Dry-run succeeded!
        setStatus('✅ Dry-run OK! Sending transaction...')
      }

      if (result.isErr) {
        const error = result.asErr
        if (error.isModule) {
          const decoded = api.registry.findMetaError(error.asModule)
          return setStatus(`❌ Contract error: ${decoded.name} - ${decoded.docs.join(' ')}`)
        }
        return setStatus(`❌ Contract reverted: ${error.toString()}`)
      }

      // Use much higher gas limit for actual transaction (contracts need more gas than dry-run)
      // Multiply by 3x to have buffer (10x might exceed block limits)
      const requiredRefTime = (gasRequired as any).refTime.toBigInt
        ? (gasRequired as any).refTime.toBigInt()
        : BigInt((gasRequired as any).refTime.toString().replace(/,/g, ''))
      const requiredProofSize = (gasRequired as any).proofSize.toBigInt
        ? (gasRequired as any).proofSize.toBigInt()
        : BigInt((gasRequired as any).proofSize.toString().replace(/,/g, ''))

      const gasLimitTx = api.registry.createType('WeightV2', {
        refTime: requiredRefTime * 3n, // 3x buffer
        proofSize: requiredProofSize * 3n, // 3x buffer
      }) as any

      console.log('Using gas limit:', {
        refTime: (requiredRefTime * 3n).toString(),
        proofSize: (requiredProofSize * 3n).toString(),
      })

      // Add storage deposit limit (set to null for unlimited from balance)
      const tx = contract.tx.subscribe({
        value,
        gasLimit: gasLimitTx,
        storageDepositLimit: null, // Allow any storage deposit from account balance
      })

      // Get the latest nonce to avoid "Transaction is outdated" error
      const nonce = await api.rpc.system.accountNextIndex(account)

      await tx.signAndSend(
        account,
        { signer: injector.signer as any, nonce },
        ({ status: txStatus, dispatchError, events }) => {
          console.log('Transaction status:', txStatus.type)

          if (dispatchError) {
            console.error('Dispatch error:', dispatchError.toHuman())
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule)
              console.error('Decoded error:', decoded)
              setStatus(`❌ Error: ${decoded.section}.${decoded.name} - ${decoded.docs.join(' ')}`)
            } else {
              setStatus(`❌ Error: ${dispatchError.toString()}`)
            }
          } else if (txStatus.isInBlock) {
            console.log('In block:', txStatus.asInBlock.toHex())

            // Log ALL events to see what happened
            console.log(
              'ALL EVENTS:',
              events?.map(({ event }) => ({
                section: event.section,
                method: event.method,
                data: event.data.toHuman(),
              }))
            )

            // Check for contract events
            const contractEvents = events?.filter(({ event }) => event.section === 'contracts')
            console.log(
              'Contract events:',
              contractEvents?.map(({ event }) => ({
                method: event.method,
                data: event.data.toHuman(),
              }))
            )

            setStatus(`⏳ In block: ${txStatus.asInBlock.toString().slice(0, 10)}...`)
          } else if (txStatus.isFinalized) {
            console.log('Finalized in block:', txStatus.asFinalized.toHex())

            // Check if contract emitted success event
            const contractEvent = events?.find(({ event }) =>
              api.events.contracts.ContractEmitted.is(event)
            )
            if (contractEvent) {
              console.log('Contract emitted event:', contractEvent.event.toHuman())
              setStatus('✅ Subscription successful! Verify with is_active in Polkadot.js Apps')
              setTxHistory((prev) =>
                [`Subscribed at #${txStatus.asFinalized.toString().slice(0, 10)}`, ...prev].slice(
                  0,
                  10
                )
              )
              refreshSubscription()
            } else {
              // Check for any errors in events
              const failedEvent = events?.find(
                ({ event }) => event.section === 'system' && event.method === 'ExtrinsicFailed'
              )
              if (failedEvent) {
                console.error('Extrinsic failed event:', failedEvent.event.toHuman())
                setStatus('❌ Transaction included but failed. Check console for details.')
                setTxHistory((prev) =>
                  [`Failed at #${txStatus.asFinalized.toString().slice(0, 10)}`, ...prev].slice(
                    0,
                    10
                  )
                )
              } else {
                setStatus(
                  `✅ Transaction finalized in block: ${txStatus.asFinalized.toString().slice(0, 10)}...`
                )
                setTxHistory((prev) =>
                  [`Finalized #${txStatus.asFinalized.toString().slice(0, 10)}`, ...prev].slice(
                    0,
                    10
                  )
                )
              }
            }
          } else {
            setStatus(`Status: ${txStatus.type}`)
          }
        }
      )
    } catch (e: any) {
      console.error(e)
      setStatus(`❌ Subscribe failed: ${e.message}`)
    } finally {
      setIsBusy(false)
    }
  }

  const updateContractParams = async () => {
    if (!api || !account) return setStatus('Connect wallet first')
    if (!contractAddress) return setStatus('Enter contract address')
    if (!metadata) return setStatus('Metadata not loaded')

    try {
      setIsBusy(true)
      setStatus('Updating contract parameters...')

      const injector = await web3FromAddress(account)
      const contract = new ContractPromise(api, metadata, contractAddress)

      const newPriceValue = BigInt(pricePerPeriod)
      const newPeriodValue = parseInt(periodBlocks)

      if (newPriceValue === 0n) {
        return setStatus('❌ Price cannot be 0')
      }
      if (newPeriodValue === 0) {
        return setStatus('❌ Period cannot be 0')
      }

      console.log('Updating params:', {
        price: newPriceValue.toString(),
        period: newPeriodValue,
      })

      // Call update_params
      const gasLimit = api.registry.createType('WeightV2', {
        refTime: 10_000_000_000n,
        proofSize: 500_000n,
      }) as any

      const tx = contract.tx.updateParams(
        { gasLimit, storageDepositLimit: null },
        newPriceValue,
        newPeriodValue
      )

      const nonce = await api.rpc.system.accountNextIndex(account)

      await tx.signAndSend(
        account,
        { signer: injector.signer as any, nonce },
        ({ status, dispatchError }) => {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule)
              setStatus(`❌ Error: ${decoded.section}.${decoded.name} - ${decoded.docs.join(' ')}`)
            } else {
              setStatus(`❌ Error: ${dispatchError.toString()}`)
            }
          } else if (status.isFinalized) {
            setStatus('✅ Contract parameters updated! Click "Check Contract" to verify.')
            checkContractParams()
            setTxHistory((prev) =>
              [`Params updated at #${status.asFinalized.toString().slice(0, 10)}`, ...prev].slice(
                0,
                10
              )
            )
          }
        }
      )
    } catch (e: any) {
      console.error(e)
      setStatus(`❌ Update failed: ${e.message}`)
    } finally {
      setIsBusy(false)
    }
  }

  const withdraw = async () => {
    if (!api || !account || !metadata || !contractAddress) return setStatus('Missing prerequisites')
    try {
      setIsBusy(true)
      setStatus('Withdrawing funds to creator...')
      const injector = await web3FromAddress(account)
      const contract = new ContractPromise(api, metadata, contractAddress)
      const gasLimit = api.registry.createType('WeightV2', {
        refTime: 10_000_000_000n,
        proofSize: 500_000n,
      }) as any
      const tx = contract.tx.withdraw({ gasLimit, storageDepositLimit: null })
      const nonce = await api.rpc.system.accountNextIndex(account)
      await tx.signAndSend(
        account,
        { signer: injector.signer as any, nonce },
        ({ status, dispatchError }) => {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule)
              setStatus(`❌ Error: ${decoded.section}.${decoded.name} - ${decoded.docs.join(' ')}`)
            } else {
              setStatus(`❌ Error: ${dispatchError.toString()}`)
            }
          } else if (status.isFinalized) {
            setStatus('✅ Withdraw successful')
            setTxHistory((prev) =>
              [`Withdraw at #${status.asFinalized.toString().slice(0, 10)}`, ...prev].slice(0, 10)
            )
            refreshContractBalance()
          }
        }
      )
    } catch (e: any) {
      console.error(e)
      setStatus(`❌ Withdraw failed: ${e.message}`)
    } finally {
      setIsBusy(false)
    }
  }

  // Derived displays
  const humanTimeRemaining = useMemo(() => {
    if (!subInfo || !subInfo.expiry || !currentBlock) return ''
    const blocksLeft = Math.max(0, subInfo.expiry - currentBlock)
    const ms = blocksLeft * BLOCK_TIME_MS
    const hrs = Math.floor(ms / 3_600_000)
    const mins = Math.floor((ms % 3_600_000) / 60_000)
    return `${hrs}h ${mins}m`
  }, [subInfo, currentBlock])

  // Refresh sub info when inputs change
  useEffect(() => {
    refreshSubscription()
    refreshContractBalance()
  }, [api, metadata, contractAddress, account])

  return (
    <div className="app-container">
      <div className="app-card">
        <header className="header">
          <div className="header-left">
            <div className="logo">CD</div>
            <h1 className="header-title">CreatorDirect</h1>
          </div>
          <div className="header-right">
            <div className="chain-info">Shibuya Testnet</div>
            <div className="block-number">Block #{currentBlock || '...'}</div>
          </div>
        </header>

        <p className="subtitle">
          Subscribe to creators with on-chain micropayments. Zero platform fees.
        </p>

        <div className="wallet-section">
          <button className="btn btn-primary" onClick={connectWallet} disabled={isBusy}>
            {account ? '✓ Wallet Connected' : 'Connect Wallet'}
          </button>
          {allAccounts.length > 0 && (
            <select value={account} onChange={(e) => setAccount(e.target.value)}>
              {allAccounts.map((a) => (
                <option key={a.address} value={a.address}>
                  {a.name
                    ? `${a.name} (${a.address.slice(0, 6)}...${a.address.slice(-4)})`
                    : a.address}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Contract Address</label>
          <div className="input-with-btn">
            <input
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              onBlur={checkContractParams}
              placeholder="Paste your deployed contract address..."
            />
            <button className="btn btn-ghost btn-icon" onClick={copyAddress} title="Copy address">
              📋
            </button>
          </div>
          {contractInfo && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                background: '#f0f7ff',
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              {contractInfo}
            </div>
          )}
        </div>

        <div className="grid-main">
          <div>
            <div className="form-group">
              <label className="form-label">
                💰 Payment amount (plancks) - Amount you want to pay
              </label>
              <input
                value={pricePerPeriod}
                onChange={(e) => setPricePerPeriod(e.target.value)}
                placeholder="1000000000000000000"
              />
              <div className="form-hint">1 SBY = 1000000000000000000 plancks (18 zeros)</div>
              <div className="form-hint">
                Quick fill:{' '}
                {[1, 5, 10].map((n) => (
                  <button
                    key={n}
                    className="btn btn-secondary btn-small"
                    onClick={() =>
                      setPricePerPeriod(String(BigInt(n) * 1_000_000_000_000_000_000n))
                    }
                  >
                    {n} SBY
                  </button>
                ))}
              </div>
              {chainParams && (
                <div className="form-hint" style={{ marginTop: 8, color: '#0070f3' }}>
                  {(() => {
                    try {
                      const paying = BigInt(pricePerPeriod || '0')
                      const per = chainParams.price
                      if (per === 0n) return null
                      const periods = Number(paying / per)
                      const blocks = periods * chainParams.period
                      const base =
                        subInfo?.active && subInfo?.expiry ? subInfo.expiry : currentBlock
                      const estExpiryBlock = base + blocks
                      const estMs = Math.max(0, estExpiryBlock - currentBlock) * BLOCK_TIME_MS
                      const hours = Math.floor(estMs / 3_600_000)
                      const mins = Math.floor((estMs % 3_600_000) / 60_000)
                      return (
                        <span>
                          Paying ≈ <strong>{periods}</strong> period(s) • adds ~
                          <strong>{blocks}</strong> blocks ≈{' '}
                          <strong>
                            {hours}h {mins}m
                          </strong>
                        </span>
                      )
                    } catch {}
                    return null
                  })()}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={async () => {
                  await subscribe()
                  notify('Subscription transaction submitted', 'info')
                }}
                disabled={isBusy || !account || !contractAddress}
              >
                {isBusy ? '⏳ Processing...' : '💳 Subscribe & Pay'}
              </button>
              <button className="btn btn-secondary" onClick={checkContractParams}>
                Check Contract
              </button>
            </div>

            <details
              className="card"
              style={{ background: '#fff3cd', border: '1px solid #ffc107' }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#856404' }}>
                🔧 Update Contract Settings (Creator Only)
              </summary>
              <div style={{ marginTop: 12 }}>
                <div className="alert alert-warning">
                  ⚠️ Only the contract creator can update these settings.
                </div>
                <div className="form-group">
                  <label className="form-label">New Price (plancks):</label>
                  <input
                    value={pricePerPeriod}
                    onChange={(e) => setPricePerPeriod(e.target.value)}
                    placeholder="1000000000000000000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Period (blocks):</label>
                  <input
                    value={periodBlocks}
                    onChange={(e) => setPeriodBlocks(e.target.value)}
                    placeholder="600"
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    await updateContractParams()
                    notify('Contract settings updated', 'success')
                  }}
                  disabled={isBusy || !account || !contractAddress}
                >
                  {isBusy ? '⏳ Updating...' : 'Update Settings'}
                </button>
              </div>
            </details>
          </div>

          <div>
            {contractAddress && (
              <div className="card card-info" style={{ marginBottom: 16 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div style={{ fontWeight: 700 }}>Subscription Status</div>
                  {chainParams && subInfo?.active && (
                    <ProgressRing
                      percent={Math.max(
                        0,
                        Math.min(
                          100,
                          Math.round(
                            ((subInfo.expiry - currentBlock) / Math.max(1, chainParams.period)) *
                              100
                          )
                        )
                      )}
                      label={humanTimeRemaining || '—'}
                      sub={`until expiry (block #${subInfo.expiry})`}
                    />
                  )}
                </div>
                <div style={{ marginTop: 12 }}>
                  <span
                    className={`status-badge ${subInfo?.active ? 'status-badge-success' : 'status-badge-error'}`}
                  >
                    {subInfo?.active ? '✓ Active' : '✗ Not active'}
                  </span>
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Share</div>
                  <img
                    alt="QR"
                    width={120}
                    height={120}
                    className="qr-image"
                    onClick={() => setShowQr(true)}
                    src={`https://chart.googleapis.com/chart?chs=240x240&cht=qr&chl=${encodeURIComponent(contractAddress)}`}
                  />
                </div>
              </div>
            )}

            {contractAddress && (
              <div className="card">
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Creator Dashboard</div>
                <div style={{ marginBottom: 12 }}>
                  Contract balance: <strong>{Number(contractBalance) / 1e18} SBY</strong>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary" onClick={refreshContractBalance}>
                    Refresh
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      await withdraw()
                      notify('Withdraw sent', 'info')
                    }}
                    disabled={isBusy || (!!chainParams && chainParams.creator !== account)}
                  >
                    Withdraw
                  </button>
                  {chainParams && chainParams.creator !== account && (
                    <span style={{ fontSize: 12, color: '#777' }}>Creator only</span>
                  )}
                </div>
              </div>
            )}

            <div className="card" style={{ marginTop: 16 }}>
              <div
                className={`alert ${status.includes('✅') ? 'alert-success' : status.includes('❌') ? 'alert-error' : 'alert-info'}`}
              >
                <strong>Status:</strong> {status || 'Waiting...'}
              </div>
              {subInfo?.active &&
                subInfo?.expiry &&
                (subInfo.expiry - currentBlock) * BLOCK_TIME_MS < 2 * 60 * 60 * 1000 && (
                  <div className="alert alert-warning" style={{ marginTop: 8 }}>
                    ⏰ Your subscription expires in {humanTimeRemaining}. Consider renewing.
                  </div>
                )}
            </div>

            {txHistory.length > 0 && (
              <div className="card" style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Recent Activity</div>
                <ul className="activity-list">
                  {txHistory.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <details className="card" style={{ background: '#f5f5f5', marginTop: 16 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
            ℹ️ How to use this app
          </summary>
          <ol style={{ marginTop: 12 }}>
            <li>Deploy contract on Shibuya using Polkadot.js Apps</li>
            <li>Copy the contract address and paste it above</li>
            <li>Enter payment amount (default: 1 SBY = 1000000000000000000)</li>
            <li>Click "Subscribe & Pay" to send transaction</li>
            <li>
              Verify with <code>is_active(your_address)</code> in Polkadot.js Apps
            </li>
          </ol>
        </details>

        {showQr && (
          <div className="modal-backdrop" onClick={() => setShowQr(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <div style={{ fontWeight: 700 }}>Share Contract</div>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowQr(false)}>
                  ✖
                </button>
              </div>
              <img
                alt="QR Large"
                width={360}
                height={360}
                className="qr-image"
                src={`https://chart.googleapis.com/chart?chs=600x600&cht=qr&chl=${encodeURIComponent(contractAddress)}`}
              />
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={copyAddress}>
                  Copy Address
                </button>
                <a
                  className="btn btn-secondary"
                  href={`https://chart.googleapis.com/chart?chs=600x600&cht=qr&chl=${encodeURIComponent(contractAddress)}`}
                  download="creator-direct-qr.png"
                >
                  Download QR
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.type}`}>
              {t.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
