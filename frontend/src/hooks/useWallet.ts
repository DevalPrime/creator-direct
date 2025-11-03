import { useState, useCallback } from 'react'
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp'
import { Account } from '../types'
import { APP_NAME } from '../constants'

export function useWallet() {
  const [account, setAccount] = useState<string>('')
  const [allAccounts, setAllAccounts] = useState<Account[]>([])
  const [status, setStatus] = useState<string>('')

  const connectWallet = useCallback(async () => {
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
  }, [])

  return { account, allAccounts, status, connectWallet, setAccount }
}
