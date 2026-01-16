'use client';

import { useState, useEffect } from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useChainId,
  useSwitchChain,
} from 'wagmi';
import { injected } from 'wagmi/connectors';
import { simpleStorageABI } from '../src/contracts/simpleStorage';
import { SIMPLE_STORAGE_ADDRESS } from '../address';
import { avalancheFuji } from 'wagmi/chains';

// ==============================
// 🔹 CONFIG
// ==============================

const CONTRACT_ADDRESS = SIMPLE_STORAGE_ADDRESS;
const SIMPLE_STORAGE_ABI = simpleStorageABI;
const EXPECTED_CHAIN_ID = avalancheFuji.id; // Avalanche Fuji Testnet

// ==============================
// 🔹 TOAST COMPONENT
// ==============================

type ToastType = 'berhasil' | 'gagal' | 'status' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            p-4 rounded-lg shadow-lg border backdrop-blur-sm
            transform transition-all duration-300 ease-out
            animate-slide-in cursor-pointer
            ${toast.type === 'berhasil' ? 'bg-green-900/90 border-green-500 text-green-100' : ''}
            ${toast.type === 'gagal' ? 'bg-red-900/90 border-red-500 text-red-100' : ''}
            ${toast.type === 'status' ? 'bg-blue-900/90 border-blue-500 text-blue-100' : ''}
            ${toast.type === 'warning' ? 'bg-yellow-900/90 border-yellow-500 text-yellow-100' : ''}
          `}
          onClick={() => removeToast(toast.id)}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg">
              {toast.type === 'berhasil' && '✅'}
              {toast.type === 'gagal' && '❌'}
              {toast.type === 'status' && 'ℹ️'}
              {toast.type === 'warning' && '⚠️'}
            </span>
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==============================
// 🔹 HELPER FUNCTIONS
// ==============================

// Shorten wallet address: 0x1234...5678
function shortenAddress(address: string | undefined): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Parse error message for user-friendly display
function parseError(error: unknown): { type: string; message: string } {
  const errorString = error?.toString() || '';
  const errorMessage = (error as Error)?.message || errorString;

  // User rejected the transaction
  if (
    errorMessage.includes('User rejected') ||
    errorMessage.includes('user rejected') ||
    errorMessage.includes('User denied') ||
    errorMessage.includes('ACTION_REJECTED')
  ) {
    return {
      type: 'rejected',
      message: 'Transaksi dibatalkan user',
    };
  }

  // Wrong network / Chain mismatch
  if (
    errorMessage.includes('chain') ||
    errorMessage.includes('network') ||
    errorMessage.includes('ChainMismatchError')
  ) {
    return {
      type: 'wrong_network',
      message: 'Please switch to Avalanche Fuji Testnet',
    };
  }

  // Transaction reverted
  if (
    errorMessage.includes('revert') ||
    errorMessage.includes('execution reverted') ||
    errorMessage.includes('CALL_EXCEPTION')
  ) {
    return {
      type: 'reverted',
      message: 'Transaction reverted by smart contract',
    };
  }

  // Insufficient funds
  if (
    errorMessage.includes('insufficient funds') ||
    errorMessage.includes('INSUFFICIENT_FUNDS')
  ) {
    return {
      type: 'insufficient_funds',
      message: 'saldo tidak cukup untuk melakukan transaksi',
    };
  }

  // Generic error
  return {
    type: 'unknown',
    message: errorMessage.slice(0, 100) || 'error tidak diketahui',
  };
}

export default function Page() {
  // ==============================
  // 🔹 WALLET STATE
  // ==============================
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  // ==============================
  // 🔹 LOCAL STATE
  // ==============================
  const [inputValue, setInputValue] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Check if on wrong network
  const isWrongNetwork = isConnected && chainId !== EXPECTED_CHAIN_ID;

  // ==============================
  // 🔹 TOAST HELPERS
  // ==============================
  const addToast = (message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // ==============================
  // 🔹 READ CONTRACT
  // ==============================
  const {
    data: value,
    isLoading: isReading,
    refetch,
    error: readError,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SIMPLE_STORAGE_ABI,
    functionName: 'getValue',
  });

  // ==============================
  // 🔹 WRITE CONTRACT
  // ==============================
  const {
    writeContract,
    isPending: isWriting,
    isSuccess: isWriteSuccess,
    isError: isWriteError,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  // Handle write success - refresh value and show toast
  useEffect(() => {
    if (isWriteSuccess) {
      addToast('Transaksi berhasil! Nilai di update.', 'berhasil');
      // Refresh the contract value after successful write
      setTimeout(() => {
        refetch();
      }, 2000); // Wait 2s for tx to be mined
      setInputValue('');
      resetWrite();
    }
  }, [isWriteSuccess, refetch, resetWrite]);

  // Handle write error
  useEffect(() => {
    if (isWriteError && writeError) {
      const { message } = parseError(writeError);
      addToast(message, 'gagal');
      resetWrite();
    }
  }, [isWriteError, writeError, resetWrite]);

  // Handle connect error
  useEffect(() => {
    if (connectError) {
      const { message } = parseError(connectError);
      addToast(message, 'gagal');
    }
  }, [connectError]);

  // Handle wrong network warning
  useEffect(() => {
    if (isWrongNetwork) {
      addToast('Wrong network detected! Please switch to Avalanche Fuji', 'warning');
    }
  }, [isWrongNetwork]);

  const handleSetValue = async () => {
    if (!inputValue) {
      addToast('Please enter a value', 'warning');
      return;
    }

    if (isWrongNetwork) {
      addToast('Please switch to the correct network first', 'warning');
      return;
    }

    addToast('Sending transaction...', 'status');

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SIMPLE_STORAGE_ABI,
      functionName: 'setValue',
      args: [BigInt(inputValue)],
    });
  };

  const handleSwitchNetwork = () => {
    switchChain({ chainId: EXPECTED_CHAIN_ID });
  };

  // ==============================
  // 🔹 UI
  // ==============================
  return (
    <>
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>

      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="w-full max-w-md border border-gray-700 rounded-lg p-6 space-y-6">

          <h1 className="text-xl font-bold">
            Day 3 – Frontend dApp (Avalanche)
          </h1>

          {/* ==========================
              WRONG NETWORK WARNING
          ========================== */}
          {isWrongNetwork && (
            <div className="bg-yellow-900/50 border border-yellow-500 rounded-lg p-4">
              <p className="text-yellow-200 text-sm mb-2">
                ⚠️ Wrong network detected!
              </p>
              <p className="text-yellow-300 text-xs mb-3">
                Please switch to Avalanche Fuji Testnet
              </p>
              <button
                onClick={handleSwitchNetwork}
                disabled={isSwitchingChain}
                className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-800 disabled:cursor-not-allowed text-black py-2 rounded text-sm font-medium transition-colors"
              >
                {isSwitchingChain ? 'Switching...' : 'Switch Network'}
              </button>
            </div>
          )}

          {/* ==========================
              WALLET CONNECT
          ========================== */}
          {!isConnected ? (
            <button
              onClick={() => connect({ connector: injected() })}
              disabled={isConnecting}
              className="w-full bg-white hover:bg-gray-200 disabled:bg-gray-500 disabled:cursor-not-allowed text-black py-2 rounded font-medium transition-colors"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Connected Address</p>
              {/* Shortened address with copy functionality */}
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm bg-gray-800 px-3 py-1 rounded">
                  {shortenAddress(address)}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Full: {address}
              </p>

              <button
                onClick={() => disconnect()}
                className="text-red-400 hover:text-red-300 text-sm underline transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}

          {/* ==========================
              READ CONTRACT
          ========================== */}
          <div className="border-t border-gray-700 pt-4 space-y-2">
            <p className="text-sm text-gray-400">Contract Value (read)</p>

            {isReading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p>Loading...</p>
              </div>
            ) : readError ? (
              <p className="text-red-400 text-sm">Error reading value</p>
            ) : (
              <p className="text-2xl font-bold">{value?.toString() ?? 'N/A'}</p>
            )}

            <button
              onClick={() => {
                refetch();
                addToast('Refreshing value...', 'status');
              }}
              className="text-sm underline text-gray-300 hover:text-white transition-colors"
            >
              🔄 Refresh value
            </button>
          </div>

          {/* ==========================
              WRITE CONTRACT
          ========================== */}
          <div className="border-t border-gray-700 pt-4 space-y-3">
            <p className="text-sm text-gray-400">Update Contract Value</p>

            <input
              type="number"
              placeholder="New value"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isWriting || isWrongNetwork}
              className="w-full p-2 rounded bg-black border border-gray-600 disabled:bg-gray-900 disabled:cursor-not-allowed focus:border-blue-500 focus:outline-none transition-colors"
            />

            <button
              onClick={handleSetValue}
              disabled={isWriting || !isConnected || isWrongNetwork}
              className={`
                w-full py-2 rounded font-medium transition-all
                ${isWriting ? 'bg-blue-800 cursor-wait' : 'bg-blue-600 hover:bg-blue-500'}
                ${(!isConnected || isWrongNetwork) ? 'bg-gray-600 cursor-not-allowed' : ''}
                disabled:opacity-70
              `}
            >
              {isWriting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </span>
              ) : !isConnected ? (
                'Connect wallet first'
              ) : isWrongNetwork ? (
                'Switch network first'
              ) : (
                'Set Value'
              )}
            </button>

            {/* Transaction status hint */}
            {isWriting && (
              <p className="text-xs text-blue-400 text-center animate-pulse">
                Please confirm the transaction in your wallet...
              </p>
            )}
          </div>

          {/* ==========================
              FOOTNOTE
          ========================== */}
          <p className="text-xs text-gray-500 pt-2">
            Smart contract = single source of truth
          </p>

        </div>
      </main>
    </>
  );
}
