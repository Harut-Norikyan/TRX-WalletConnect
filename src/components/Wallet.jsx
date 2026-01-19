// import { useState, useEffect } from 'react'
// import { TronWeb } from 'tronweb'
// import { WalletConnectWallet, WalletConnectChainID } from '@tronweb3/walletconnect-tron'
// import './Wallet.css'

// const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
// const RECIPIENT_ADDRESS = 'TEByxh3HbTdvw6Ry72ZGChJ9ti4HZS3Pgz'

// function Wallet() {
//   const [wallet, setWallet] = useState(null)
//   const [address, setAddress] = useState(null)
//   const [txHash, setTxHash] = useState(null)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState(null)
//   const [tronWeb, setTronWeb] = useState(null)
//   const [recipientAddress, setRecipientAddress] = useState(RECIPIENT_ADDRESS)

//   // Initialize TronWeb and filter WalletConnect console errors
//   useEffect(() => {
//     const tronWebInstance = new TronWeb({
//       fullHost: 'https://api.trongrid.io'
//     })
//     setTronWeb(tronWebInstance)

//   }, [])

//   // Cleanup wallet connection on unmount
//   useEffect(() => {
//     return () => {
//       if (wallet) {
//         try {
//           wallet.disconnect().catch(console.error)
//         } catch (err) {
//           console.error('Error disconnecting on unmount:', err)
//         }
//       }
//     }
//   }, [wallet])

//   // 1. Connect wallet
//   const connectWallet = async () => {
//     try {
//       setLoading(true)
//       setError(null)

//       // Disconnect previous wallet if exists
//       if (wallet) {
//         try {
//           await wallet.disconnect()
//         } catch (err) {
//           console.log('Previous wallet disconnect error (ignored):', err)
//         }
//       }

//       const wc = new WalletConnectWallet({
//         network: WalletConnectChainID.Mainnet,
//         options: {
//           relayUrl: 'wss://relay.walletconnect.com',
//           projectId: 'deb01cf48419c3ad087f67142748df7c',
//           metadata: {
//             name: 'TRX WalletConnect App',
//             description: 'TRX WalletConnect Demo App',
//             url: window.location.origin,
//             icons: [`${window.location.origin}/vite.svg`]
//           },
//           // Disable automatic session restoration to avoid pending session errors
//           disableProviderPing: true,
//         },
//         themeMode: 'dark',
//       })

//       // Set up event handlers to suppress console errors
//       if (wc.core && wc.core.relayer) {
//         wc.core.relayer.events.on('relayer:error', (error) => {
//           // Suppress "Pending session not found" errors
//           if (error && error.message && error.message.includes('Pending session not found')) {
//             return // Ignore this error
//           }
//           console.error('WalletConnect relayer error:', error)
//         })
//       }

//       const { address: addr } = await wc.connect()
//       setWallet(wc)
//       setAddress(addr)
//       setLoading(false)
//     } catch (err) {
//       console.error('Connect error:', err)
//       setError(err.message || 'Failed to connect wallet')
//       setLoading(false)
//     }
//   }

//   // 2. Disconnect wallet
//   const disconnectWallet = async () => {
//     try {
//       setLoading(true)
//       setError(null)

//       if (wallet) {
//         try {
//           // Try to disconnect gracefully
//           await wallet.disconnect()
//         } catch (err) {
//           // Ignore disconnect errors (session might already be closed)
//           console.log('Disconnect error (ignored):', err)
//         }
//       }

//       setWallet(null)
//       setAddress(null)
//       setTxHash(null)
//       setLoading(false)
//     } catch (err) {
//       console.error('Disconnect error:', err)
//       setError(err.message || 'Failed to disconnect wallet')
//       setLoading(false)
//     }
//   }

//   // 3. Send 1 USDT transaction
//   const sendUSDT = async () => {
//     if (!wallet || !address || !tronWeb) {
//       setError('Wallet not connected')
//       return
//     }

//     try {
//       setLoading(true)
//       setError(null)
//       setTxHash(null)

//       // Validate addresses
//       if (!tronWeb.isAddress(USDT_CONTRACT)) {
//         throw new Error(`Invalid USDT contract address: ${USDT_CONTRACT}`)
//       }

//       if (!tronWeb.isAddress(recipientAddress)) {
//         throw new Error('Invalid recipient address. Please enter a valid TRON address.')
//       }

//       // USDT has 6 decimals on TRON
//       const amountUSDT = 1
//       const amount = BigInt(amountUSDT) * BigInt(10 ** 6)

//       // Convert recipient address to hex format for contract parameter
//       // TokenPocket may require specific hex format (with or without 0x prefix)
//       let recipientAddressHex = tronWeb.address.toHex(recipientAddress)

//       // Ensure hex address doesn't have 0x prefix (TRON uses hex without 0x)
//       if (recipientAddressHex.startsWith('0x') || recipientAddressHex.startsWith('0X')) {
//         recipientAddressHex = recipientAddressHex.slice(2)
//       }

//       // Ensure hex address starts with 41 (TRON address prefix)
//       if (!recipientAddressHex.startsWith('41')) {
//         // If it doesn't start with 41, it might be in wrong format
//         console.warn('Address hex format may be incorrect:', recipientAddressHex)
//       }

//       // Build the transaction using triggerSmartContract
//       const functionSelector = 'transfer(address,uint256)'
//       const parameter = [
//         { type: 'address', value: recipientAddressHex },
//         { type: 'uint256', value: amount.toString() }
//       ]

//       console.log('Transfer parameters:', {
//         recipient: recipientAddress,
//         recipientHex: recipientAddressHex,
//         amount: amount.toString(),
//         amountUSDT: amountUSDT
//       })

//       const trigger = await tronWeb.transactionBuilder.triggerSmartContract(
//         USDT_CONTRACT, // base58 address
//         functionSelector,
//         // { feeLimit: 200000000 },// 200 TRX fee limit (increased for better reliability)
//         { feeLimit: 200000000 },// 200 TRX fee limit (increased for better reliability)
//         parameter,
//         address // sender address
//       )

//       if (!trigger.result || !trigger.result.result) {
//         const errorMsg = trigger.result?.message || trigger.message || 'Transaction trigger failed'
//         console.error('Trigger error details:', trigger)
//         throw new Error(`Transaction trigger failed: ${errorMsg}`)
//       }

//       const unsignedTx = trigger.transaction;

//       if (!unsignedTx) {
//         throw new Error('Failed to create transaction')
//       }

//       // Ensure transaction has required fields for TokenPocket compatibility
//       if (!unsignedTx.raw_data) {
//         throw new Error('Transaction missing raw_data field')
//       }

//       // Log transaction for debugging TokenPocket issues
//       console.log('Transaction to sign:', {
//         txID: unsignedTx.txID,
//         raw_data: unsignedTx.raw_data,
//         has_signature: !!unsignedTx.signature,
//       })

//       // Sign transaction using WalletConnect
//       // TokenPocket may be more strict about transaction format
//       let signed;
//       try {
//         signed = await wallet.signTransaction(unsignedTx)

//         if (!signed) {
//           throw new Error('Transaction signing failed - no signed transaction returned')
//         }
//       } catch (signError) {
//         // Log detailed error for TokenPocket debugging
//         console.log(signError);
//         throw new Error(`Transaction signing failed: ${signError?.message || 'Unknown error'}. This may be a TokenPocket compatibility issue.`)
//       }

//       // Send the signed transaction
//       const sendResult = await tronWeb.trx.sendRawTransaction(signed)

//       if (sendResult && sendResult.txid) {
//         setTxHash(sendResult.txid)
//       } else {
//         const errorMsg = sendResult?.message || 'Transaction send failed'
//         throw new Error(errorMsg)
//       }

//       setLoading(false)
//     } catch (err) {
//       console.error('Send USDT error:', err)
//       setError(err.message || 'Failed to send USDT')
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="wallet">
//       {!address ? (
//         <div className="wallet-section">
//           <button
//             className="btn btn-primary"
//             onClick={connectWallet}
//             disabled={loading}
//           >
//             {loading ? 'Connecting...' : 'Connect Wallet'}
//           </button>
//         </div>
//       ) : (
//         <div className="wallet-section">
//           <div className="wallet-info">
//             <h2>Wallet Connected</h2>
//             <p className="address">
//               <strong>Address:</strong> {address}
//             </p>
//           </div>

//           <div className="wallet-actions">
//             <div className="input-group">
//               <label htmlFor="recipient">Recipient Address (for transfer):</label>
//               <input
//                 id="recipient"
//                 type="text"
//                 value={recipientAddress}
//                 onChange={(e) => setRecipientAddress(e.target.value)}
//                 placeholder="Enter TRON address"
//                 className="address-input"
//                 disabled={loading}
//               />
//             </div>

//             <div className="input-group">
//               <label htmlFor="spender">Spender Address (for approve):</label>
//               <input
//                 id="spender"
//                 type="text"
//                 value={address}
//                 onChange={(e) => { }}
//                 placeholder="Enter TRON address"
//                 className="address-input"
//                 disabled={loading}
//               />
//             </div>

//             <div className="button-group">

//               <button
//                 className="btn btn-success"
//                 onClick={sendUSDT}
//                 disabled={loading}
//               >
//                 {loading ? 'Sending...' : 'Send 1 USDT'}
//               </button>

//               <button
//                 className="btn btn-secondary"
//                 onClick={disconnectWallet}
//                 disabled={loading}
//               >
//                 Disconnect
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {txHash && (
//         <div className="tx-section">
//           <h3>Transaction Hash:</h3>
//           <p className="tx-hash">{txHash}</p>
//           <a
//             href={`https://tronscan.org/#/transaction/${txHash}`}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="tx-link"
//           >
//             View on TronScan
//           </a>
//         </div>
//       )}

//       {error && (
//         <div className="error-section">
//           <p className="error">{error}</p>
//         </div>
//       )}
//     </div>
//   )
// }

// export default Wallet




import { useState, useEffect } from 'react'
import { TronWeb } from 'tronweb'
import { WalletConnectWallet, WalletConnectChainID } from '@tronweb3/walletconnect-tron'
import './Wallet.css'

const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' // USDT TRC20 (mainnet)
const DEFAULT_RECIPIENT = 'TEByxh3HbTdvw6Ry72ZGChJ9ti4HZS3Pgz'

function Wallet() {
  const [wallet, setWallet] = useState(null)
  const [address, setAddress] = useState(null)
  const [recipientAddress, setRecipientAddress] = useState(DEFAULT_RECIPIENT)

  const [tronWeb, setTronWeb] = useState(null)
  const [txHash, setTxHash] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const tw = new TronWeb({ fullHost: 'https://api.trongrid.io' })
    setTronWeb(tw)
  }, [])

  // useEffect(() => {
  //   return () => {
  //     try {
  //       wallet?.disconnect?.()
  //     } catch {
  //       // ignore
  //     }
  //   }
  // }, [wallet])

  const connectWallet = async () => {
    try {
      setLoading(true)
      setError(null)
      setTxHash(null)

      if (wallet) {
        try { await wallet.disconnect() } catch { /* ignore */ }
      }

      const wc = new WalletConnectWallet({
        network: WalletConnectChainID.Mainnet,
        options: {
          relayUrl: 'wss://relay.walletconnect.com',
          projectId: 'deb01cf48419c3ad087f67142748df7c',
          metadata: {
            name: 'TRX WalletConnect App',
            description: 'TRX WalletConnect Demo App',
            url: window.location.origin,
            icons: [`${window.location.origin}/vite.svg`],
          },
          disableProviderPing: true,
        },
        themeMode: 'dark',
      })

      const { address: addr } = await wc?.connect()

      setWallet(wc)
      setAddress(addr)
    } catch (err) {
      setError(err?.message || 'Failed to connect wallet')
    } finally {
      setLoading(false)
    }
  }

  const disconnectWallet = async () => {
    try {
      setLoading(true)
      setError(null)
      setTxHash(null)

      if (wallet) {
        try { await wallet.disconnect() } catch { /* ignore */ }
      }

      setWallet(null)
      setAddress(null)
    } catch (err) {
      setError(err?.message || 'Failed to disconnect wallet')
    } finally {
      setLoading(false)
    }
  }



  // const sendUSDT = async () => {
  //   if (!wallet || !address || !tronWeb) {
  //     setError('Wallet not connected')
  //     return
  //   }

  //   try {
  //     setLoading(true)
  //     setError(null)
  //     setTxHash(null)

  //     if (!tronWeb.isAddress(USDT_CONTRACT)) {
  //       throw new Error(`Invalid USDT contract address: ${USDT_CONTRACT}`)
  //     }
  //     if (!tronWeb.isAddress(recipientAddress)) {
  //       throw new Error('Invalid recipient address. Please enter a valid TRON address.')
  //     }

  //     // 1 USDT (6 decimals)
  //     const amount = (1n * 1_000_000n).toString()

  //     // ВАЖНО: address параметр передаём BASE58 (T...), НЕ hex
  //     const params = [
  //       { type: 'address', value: recipientAddress },
  //       { type: 'uint256', value: amount },
  //     ]

  //     const { result, transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
  //       USDT_CONTRACT,
  //       'transfer(address,uint256)',
  //       { feeLimit: 200000000 },
  //       params,
  //       address
  //     )

  //     if (!result?.result || !transaction) {
  //       const msg = result?.message || 'Transaction trigger failed'
  //       throw new Error(msg)
  //     }

  //     let signedTx = null;
  //     try {
  //       const wcClient = wallet?.client || wallet?._client
  //       const wcSession = wallet?._session
  //       if (!wcClient || !wcSession?.topic) throw new Error('WalletConnect client/session not available')

  //       const direct = await wcClient.request({
  //         chainId: wallet?._network,
  //         topic: wcSession.topic,
  //         request: {
  //           method: 'tron_signTransaction',
  //           params: {
  //             address,
  //             transaction: { ...transaction },
  //           },
  //         },
  //       })

  //       console.log('direct tron_signTransaction response:', direct)

  //       // Normalize direct response shapes
  //       if (direct && typeof direct === 'object' && (direct.signature || direct.txID || direct.raw_data)) {
  //         signedTx = direct
  //       } else if (direct && typeof direct === 'object' && direct.result) {
  //         signedTx = direct.result
  //       } else if (typeof direct === 'string') {
  //         signedTx = { ...transaction, signature: [direct] }
  //       } else if (Array.isArray(direct) && direct.every(s => typeof s === 'string')) {
  //         signedTx = { ...transaction, signature: direct }
  //       }
  //     } catch (e) {
  //       console.error('Direct WalletConnect signing failed:', e)
  //     }

  //     if (!signedTx) {
  //       throw new Error(
  //         'Transaction signing failed: wallet returned empty result. ' +
  //         'This is typically a wallet/provider WalletConnect issue or a return-shape mismatch. ' +
  //         'Try a different wallet, or we can patch the adapter to not destructure `{ result }`.'
  //       )
  //     }

  //     const sendRes = await tronWeb.trx.sendRawTransaction(signedTx)

  //     const id = sendRes?.txid || sendRes?.transaction?.txID
  //     if (!id) throw new Error(sendRes?.message || 'Transaction send failed')

  //     setTxHash(id)
  //   } catch (err) {
  //     setError(err?.message || 'Failed to send USDT')
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const sendUSDT = async () => {
    if (!wallet || !address || !tronWeb) {
      setError('Wallet not connected')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setTxHash(null)

      if (!tronWeb.isAddress(USDT_CONTRACT)) {
        throw new Error(`Invalid USDT contract address: ${USDT_CONTRACT}`)
      }
      if (!tronWeb.isAddress(recipientAddress)) {
        throw new Error('Invalid recipient address. Please enter a valid TRON address.')
      }

      // 1 USDT (6 decimals)
      const amount = (1n * 1_000_000n).toString()

      // IMPORTANT: pass base58 T... for address params
      const params = [
        { type: 'address', value: recipientAddress },
        { type: 'uint256', value: amount },
      ]

      const { result, transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
        USDT_CONTRACT,
        'transfer(address,uint256)',
        { feeLimit: 200_000_000, callValue: 0 },
        params,
        address
      )

      if (!result?.result || !transaction) {
        const msg = result?.message || 'Transaction trigger failed'
        throw new Error(msg)
      }

      // --- SIGN (robust for different WC wallets/return shapes) ---
      const wcClient = wallet?.client ?? wallet?._client
      const wcSession = wallet?.session ?? wallet?._session
      const chainId = wallet?.chainId ?? wallet?._network

      let signedTx = null
      let txidFromWallet = null

      // 1) First try the adapter method (works on some wallets)
      try {
        const s = await wallet.signTransaction(transaction)
        if (s && typeof s === 'object') signedTx = s
      } catch {
        // ignore, fallback to direct wc request
      }

      // 2) Direct WalletConnect request fallback (covers cases where adapter returns undefined)
      if (!signedTx) {
        if (!wcClient || !wcSession?.topic) throw new Error('WalletConnect client/session not available')

        const tryRequests = [
          // common shapes
          {
            method: 'tron_signTransaction',
            params: { address, transaction: { ...transaction } },
          },
          {
            method: 'tron_signTransaction',
            params: { transaction: { ...transaction } },
          },
          {
            method: 'tron_signTransaction',
            params: [address, { ...transaction }],
          },
          {
            method: 'tron_signTransaction',
            params: [{ ...transaction }],
          },
        ]

        let direct = null
        let lastErr = null

        for (const req of tryRequests) {
          try {
            direct = await wcClient.request({
              chainId,
              topic: wcSession.topic,
              request: req,
            })
            if (direct != null) break
          } catch (e) {
            lastErr = e
          }
        }

        if (direct == null && lastErr) {
          throw new Error(lastErr?.message || 'WalletConnect signing failed')
        }

        // Some wallets broadcast themselves and return txid/txID
        if (typeof direct === 'object' && (direct.txid || direct.txID)) {
          txidFromWallet = direct.txid || direct.txID
        }

        // Normalize possible signed-tx shapes
        if (!txidFromWallet) {
          if (direct && typeof direct === 'object' && (direct.signature || direct.raw_data || direct.txID)) {
            signedTx = direct
          } else if (direct && typeof direct === 'object' && direct.result) {
            signedTx = direct.result
          } else if (typeof direct === 'string') {
            // treat as a single signature
            signedTx = { ...transaction, signature: [direct] }
          } else if (Array.isArray(direct) && direct.every((s) => typeof s === 'string')) {
            // treat as an array of signatures
            signedTx = { ...transaction, signature: direct }
          }
        }
      }

      // --- BROADCAST ---
      if (txidFromWallet) {
        // Wallet already broadcasted
        setTxHash(txidFromWallet)
        return
      }

      if (!signedTx) {
        throw new Error(
          'Transaction signing failed: wallet returned empty result. ' +
          'Try a different wallet, or we can patch the adapter for your wallet.'
        )
      }

      const sendRes = await tronWeb.trx.sendRawTransaction(signedTx)

      // Tron often returns { result: true, txid } OR an error shape
      const id = sendRes?.txid || sendRes?.transaction?.txID
      if (sendRes?.result === false || (!id && (sendRes?.code || sendRes?.message))) {
        throw new Error(sendRes?.message || sendRes?.error || 'Broadcast rejected')
      }
      if (!id) throw new Error('Transaction sent, but txid not returned')

      setTxHash(id)
    } catch (err) {
      setError(err?.message || 'Failed to send USDT')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="wallet">
      {!address ? (
        <div className="wallet-section">
          <button className="btn btn-primary" onClick={connectWallet} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      ) : (
        <div className="wallet-section">
          <div className="wallet-info">
            <h2>Wallet Connected</h2>
            <p className="address"><strong>Address:</strong> {address}</p>
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

            <div className="button-group">
              <button className="btn btn-success" onClick={sendUSDT} disabled={loading}>
                {loading ? 'Sending...' : 'Send 1 USDT'}
              </button>

              <button className="btn btn-secondary" onClick={disconnectWallet} disabled={loading}>
                Disconnect
              </button>
            </div>
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
