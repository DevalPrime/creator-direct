import { ApiPromise } from '@polkadot/api'

export interface ChainParams {
  price: bigint
  period: number
  creator: string
}

export interface SubInfo {
  active: boolean
  expiry: number
  now: number
  hasPass: boolean
}

export interface Toast {
  id: string | number
  type: 'success' | 'error' | 'info' | 'warning'
  text: string
}

export interface Account {
  address: string
  name?: string
}

export interface ContractState {
  api: ApiPromise | null
  account: string
  allAccounts: Account[]
  contractAddress: string
  metadata: unknown
  chainParams: ChainParams | null
  currentBlock: number
  subInfo: SubInfo | null
  contractBalance: bigint
  isBusy: boolean
  status: string
  contractInfo: string
  txHistory: string[]
}

export interface GasLimit {
  refTime: bigint
  proofSize: bigint
}
