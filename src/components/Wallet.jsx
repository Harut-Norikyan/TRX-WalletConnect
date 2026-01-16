import { useState, useEffect } from 'react'
import TronWeb from 'tronweb'
import { WalletConnectWallet, WalletConnectChainID } from '@tronweb3/walletconnect-tron'
import './Wallet.css'

// USDT TRC20 contract address on TRON mainnet
const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'

// Recipient address for testing (you can change this)
const RECIPIENT_ADDRESS = 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf'

function Wallet() {
  const [wallet, setWallet] = useState(null)
  const [address, setAddress] = useState(null)
  const [txHash, setTxHash] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tronWeb, setTronWeb] = useState(null)
  const [recipientAddress, setRecipientAddress] = useState(RECIPIENT_ADDRESS)

  // Initialize TronWeb and filter WalletConnect console errors
  useEffect(() => {
    const tronWebInstance = new TronWeb({
      fullHost: 'https://api.trongrid.io'
    })
    setTronWeb(tronWebInstance)

    // Filter out "Pending session not found" errors from console
    const originalError = console.error
    console.error = (...args) => {
      const errorMessage = args[0]?.msg || args[0]?.message || String(args[0] || '')
      if (errorMessage.includes('Pending session not found')) {
        // Suppress this specific error
        return
      }
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  // Cleanup wallet connection on unmount
  useEffect(() => {
    return () => {
      if (wallet) {
        try {
          wallet.disconnect().catch(console.error)
        } catch (err) {
          console.error('Error disconnecting on unmount:', err)
        }
      }
    }
  }, [wallet])

  // 1. Connect wallet
  const connectWallet = async () => {
    try {
      setLoading(true)
      setError(null)

      // Disconnect previous wallet if exists
      if (wallet) {
        try {
          await wallet.disconnect()
        } catch (err) {
          console.log('Previous wallet disconnect error (ignored):', err)
        }
      }

      const wc = new WalletConnectWallet({
        network: WalletConnectChainID.Mainnet,
        options: {
          projectId: 'deb01cf48419c3ad087f67142748df7c',
          metadata: {
            name: 'TRX WalletConnect App',
            description: 'TRX WalletConnect Demo App',
            url: window.location.origin,
            icons: [`${window.location.origin}/vite.svg`]
          },
          // Disable automatic session restoration to avoid pending session errors
          disableProviderPing: true,
        }
      })

      // Set up event handlers to suppress console errors
      if (wc.core && wc.core.relayer) {
        wc.core.relayer.events.on('relayer:error', (error) => {
          // Suppress "Pending session not found" errors
          if (error && error.message && error.message.includes('Pending session not found')) {
            return // Ignore this error
          }
          console.error('WalletConnect relayer error:', error)
        })
      }

      const { address: addr } = await wc.connect()
      setWallet(wc)
      setAddress(addr)
      setLoading(false)
    } catch (err) {
      console.error('Connect error:', err)
      setError(err.message || 'Failed to connect wallet')
      setLoading(false)
    }
  }

  // 2. Disconnect wallet
  const disconnectWallet = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (wallet) {
        try {
          // Try to disconnect gracefully
          await wallet.disconnect()
        } catch (err) {
          // Ignore disconnect errors (session might already be closed)
          console.log('Disconnect error (ignored):', err)
        }
      }
      
      setWallet(null)
      setAddress(null)
      setTxHash(null)
      setLoading(false)
    } catch (err) {
      console.error('Disconnect error:', err)
      setError(err.message || 'Failed to disconnect wallet')
      setLoading(false)
    }
  }

  // 3. Send 1 USDT transaction
  const sendUSDT = async () => {
    if (!wallet || !address || !tronWeb) {
      setError('Wallet not connected')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setTxHash(null)

      // Validate addresses
      if (!tronWeb.isAddress(USDT_CONTRACT)) {
        throw new Error('Invalid USDT contract address')
      }

      if (!tronWeb.isAddress(recipientAddress)) {
        throw new Error('Invalid recipient address. Please enter a valid TRON address.')
      }

      // USDT has 6 decimals on TRON
      const amountUSDT = 1
      const amount = amountUSDT * (10 ** 6)

      // Convert recipient address to hex format for contract parameter
      const recipientAddressHex = tronWeb.address.toHex(recipientAddress)

      // Build the transaction using triggerSmartContract
      const functionSelector = 'transfer(address,uint256)'
      const parameter = [
        { type: 'address', value: recipientAddressHex },
        { type: 'uint256', value: amount.toString() }
      ]

      const trigger = await tronWeb.transactionBuilder.triggerSmartContract(
        USDT_CONTRACT, // base58 address
        functionSelector,
        { feeLimit: 100_000_000 }, // 100 TRX fee limit
        parameter,
        address // sender address
      )

      if (!trigger.result || !trigger.result.result) {
        const errorMsg = trigger.result?.message || trigger.message || 'Transaction trigger failed'
        throw new Error(errorMsg)
      }

      const unsignedTx = trigger.transaction

      if (!unsignedTx) {
        throw new Error('Failed to create transaction')
      }

      // Sign transaction using WalletConnect
      const signed = await wallet.signTransaction(unsignedTx)

      if (!signed) {
        throw new Error('Transaction signing failed')
      }

      // Send the signed transaction
      const sendResult = await tronWeb.trx.sendRawTransaction(signed)

      if (sendResult && sendResult.txid) {
        setTxHash(sendResult.txid)
      } else {
        const errorMsg = sendResult?.message || 'Transaction send failed'
        throw new Error(errorMsg)
      }

      setLoading(false)
    } catch (err) {
      console.error('Send USDT error:', err)
      setError(err.message || 'Failed to send USDT')
      setLoading(false)
    }
  }

  return (
    <div className="wallet">
      {!address ? (
        <div className="wallet-section">
          <button 
            className="btn btn-primary" 
            onClick={connectWallet}
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      ) : (
        <div className="wallet-section">
          <div className="wallet-info">
            <h2>Wallet Connected</h2>
            <p className="address">
              <strong>Address:</strong> {address}
            </p>
          </div>

          <div className="wallet-actions">
            <div className="input-group">
              <label htmlFor="recipient">Recipient Address:</label>
              <input
                id="recipient"
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="Enter TRON address"
                className="address-input"
                disabled={loading}
              />
            </div>
            
            <button 
              className="btn btn-success" 
              onClick={sendUSDT}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send 1 USDT'}
            </button>
            
            <button 
              className="btn btn-secondary" 
              onClick={disconnectWallet}
              disabled={loading}
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {txHash && (
        <div className="tx-section">
          <h3>Transaction Hash:</h3>
          <p className="tx-hash">{txHash}</p>
          <a 
            href={`https://tronscan.org/#/transaction/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tx-link"
          >
            View on TronScan
          </a>
        </div>
      )}

      {error && (
        <div className="error-section">
          <p className="error">{error}</p>
        </div>
      )}
    </div>
  )
}

export default Wallet

