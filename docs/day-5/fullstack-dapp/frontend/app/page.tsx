"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useWriteContract,
  useChainId,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { simpleStorageABI } from "@/contracts/simpleStorage";
import {
  getValueFromBackend,
  getEventsFromBackend,
  type ValueResponse,
  type EventResponse,
} from "@/lib/api";
import { avalancheFuji } from "wagmi/chains";

// ==============================
// 🔹 CONFIG
// ==============================
const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0xCC33006367bB9d606d7afe5BfC3Ec3Ba6f0df960") as `0x${string}`;
const EXPECTED_CHAIN_ID = avalancheFuji.id;

// ==============================
// 🔹 TOAST SYSTEM
// ==============================
type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: number) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            p-4 rounded-xl shadow-2xl border backdrop-blur-md
            transform transition-all duration-300 ease-out
            animate-slide-in cursor-pointer hover:scale-[1.02]
            ${toast.type === "success"
              ? "bg-emerald-900/90 border-emerald-400 text-emerald-100"
              : ""
            }
            ${toast.type === "error"
              ? "bg-red-900/90 border-red-400 text-red-100"
              : ""
            }
            ${toast.type === "info"
              ? "bg-blue-900/90 border-blue-400 text-blue-100"
              : ""
            }
            ${toast.type === "warning"
              ? "bg-amber-900/90 border-amber-400 text-amber-100"
              : ""
            }
          `}
          onClick={() => removeToast(toast.id)}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">
              {toast.type === "success" && "✅"}
              {toast.type === "error" && "❌"}
              {toast.type === "info" && "ℹ️"}
              {toast.type === "warning" && "⚠️"}
            </span>
            <p className="text-sm font-medium leading-relaxed">
              {toast.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==============================
// 🔹 HELPER FUNCTIONS
// ==============================
function shortenAddress(address: string | undefined): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function parseError(error: unknown): string {
  const errorString = error?.toString() || "";
  const errorMessage = (error as Error)?.message || errorString;

  if (
    errorMessage.includes("User rejected") ||
    errorMessage.includes("user rejected") ||
    errorMessage.includes("ACTION_REJECTED")
  ) {
    return "Transaction cancelled by user";
  }

  if (
    errorMessage.includes("chain") ||
    errorMessage.includes("network") ||
    errorMessage.includes("ChainMismatchError")
  ) {
    return "Please change connection to avalanche fuji";
  }

  if (
    errorMessage.includes("insufficient funds") ||
    errorMessage.includes("INSUFFICIENT_FUNDS")
  ) {
    return "Insufficient funds for transaction";
  }

  return errorMessage.slice(0, 100) || "Unknown error occurred";
}

// ==============================
// 🔹 MAIN COMPONENT
// ==============================
export default function Home() {
  // Wallet State
  const { address, isConnected } = useAccount();
  const {
    connect,
    isPending: isConnecting,
    error: connectError,
  } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  // Local State
  const [inputValue, setInputValue] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [backendValue, setBackendValue] = useState<ValueResponse | null>(null);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Network Check
  const isWrongNetwork = isConnected && chainId !== EXPECTED_CHAIN_ID;

  // Write Contract
  const {
    writeContract,
    data: txHash,
    isPending: isWriting,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  // Wait for Transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // Toast Helpers
  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch data from Backend API
  const fetchFromBackend = useCallback(async () => {
    setIsLoadingBackend(true);
    setBackendError(null);
    try {
      const data = await getValueFromBackend();
      setBackendValue(data);
      addToast("Value fetched from backend successfully", "success");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to fetch from backend";
      setBackendError(errorMsg);
      addToast(errorMsg, "error");
    } finally {
      setIsLoadingBackend(false);
    }
  }, [addToast]);

  // Fetch events from Backend API
  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const data = await getEventsFromBackend();
      setEvents(data);
      addToast(`Fetched ${data.length} events from backend`, "info");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to fetch events",
        "error"
      );
    } finally {
      setIsLoadingEvents(false);
    }
  }, [addToast]);

  // Initial fetch
  useEffect(() => {
    fetchFromBackend();
    fetchEvents();
  }, [fetchFromBackend, fetchEvents]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      addToast("Transaction confirmed! Refreshing data...", "success");
      // Refresh data from backend after transaction
      setTimeout(() => {
        fetchFromBackend();
        fetchEvents();
      }, 3000);
      setInputValue("");
      resetWrite();
    }
  }, [isConfirmed, fetchFromBackend, fetchEvents, addToast, resetWrite]);

  // Handle write error
  useEffect(() => {
    if (writeError) {
      addToast(parseError(writeError), "error");
      resetWrite();
    }
  }, [writeError, addToast, resetWrite]);

  // Handle connect error
  useEffect(() => {
    if (connectError) {
      addToast(parseError(connectError), "error");
    }
  }, [connectError, addToast]);

  // Handle wrong network
  useEffect(() => {
    if (isWrongNetwork) {
      addToast("Please change connection to avalanche fuji", "warning");
    }
  }, [isWrongNetwork, addToast]);

  // Set Value Handler
  const handleSetValue = async () => {
    if (!inputValue) {
      addToast("Please enter a value", "warning");
      return;
    }

    if (isWrongNetwork) {
      addToast("Please switch to the correct network first", "warning");
      return;
    }

    addToast("Sending transaction to blockchain...", "info");

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: simpleStorageABI,
      functionName: "setValue",
      args: [BigInt(inputValue)],
    });
  };

  const handleSwitchNetwork = () => {
    switchChain({ chainId: EXPECTED_CHAIN_ID });
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

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
        @keyframes pulse-glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(139, 92, 246, 0.6);
          }
        }
        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
              Day 5 – Full Stack dApp
            </h1>
            <p className="text-gray-400 text-lg">
              Integration & Deployment on Avalanche Fuji
            </p>
            <div className="flex justify-center gap-4 mt-4 text-sm text-gray-500">
              <span className="px-3 py-1 bg-gray-800 rounded-full">
                Frontend: Next.js
              </span>
              <span className="px-3 py-1 bg-gray-800 rounded-full">
                Backend: NestJS
              </span>
              <span className="px-3 py-1 bg-gray-800 rounded-full">
                Blockchain: Avalanche
              </span>
            </div>
          </div>

          {/* Wrong Network Warning */}
          {isWrongNetwork && (
            <div className="mb-8 bg-amber-900/30 border border-amber-500/50 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-200 font-semibold">
                    ⚠️ Wrong Network Detected
                  </p>
                  <p className="text-amber-300/80 text-sm mt-1">
                    Please change connection to avalanche fuji to continue
                  </p>
                </div>
                <button
                  onClick={handleSwitchNetwork}
                  disabled={isSwitchingChain}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                  {isSwitchingChain ? "Switching..." : "Switch Network"}
                </button>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Wallet & Write */}
            <div className="space-y-6">
              {/* Wallet Connection Card */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 pulse-glow">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">🔗</span> Wallet Connection
                </h2>

                {!isConnected ? (
                  <button
                    onClick={() => connect({ connector: injected() })}
                    disabled={isConnecting}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isConnecting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Connecting...
                      </span>
                    ) : (
                      "Connect Wallet"
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-900/50 rounded-xl p-4">
                      <p className="text-gray-400 text-sm mb-1">
                        Connected Address
                      </p>
                      <p className="font-mono text-lg font-semibold text-purple-400">
                        {shortenAddress(address)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 break-all">
                        {address}
                      </p>
                    </div>
                    <button
                      onClick={() => disconnect()}
                      className="text-red-400 hover:text-red-300 text-sm underline transition-colors"
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                )}
              </div>

              {/* Write Contract Card */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">✍️</span> Update Value (Write)
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  Frontend → Wallet → Blockchain (User signs transaction)
                </p>

                <div className="space-y-4">
                  <input
                    type="number"
                    placeholder="Enter new value..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isWriting || isConfirming || isWrongNetwork}
                    className="w-full p-4 rounded-xl bg-gray-900 border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all disabled:opacity-50"
                  />

                  <button
                    onClick={handleSetValue}
                    disabled={
                      isWriting ||
                      isConfirming ||
                      !isConnected ||
                      isWrongNetwork
                    }
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isWriting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : isConfirming ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Confirming...
                      </span>
                    ) : !isConnected ? (
                      "Connect Wallet First"
                    ) : isWrongNetwork ? (
                      "Switch Network First"
                    ) : (
                      "Set Value"
                    )}
                  </button>

                  {txHash && (
                    <div className="text-sm text-gray-400 bg-gray-900/50 rounded-lg p-3">
                      <p className="mb-1">Transaction Hash:</p>
                      <a
                        href={`https://testnet.snowtrace.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 break-all underline"
                      >
                        {txHash.slice(0, 20)}...{txHash.slice(-10)}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Read from Backend */}
            <div className="space-y-6">
              {/* Backend Value Card */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">📡</span> Read Value (via Backend)
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  Frontend → Backend API → Blockchain
                </p>

                <div className="bg-gray-900/50 rounded-xl p-6 mb-4">
                  {isLoadingBackend ? (
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-400">
                        Loading from backend...
                      </span>
                    </div>
                  ) : backendError ? (
                    <div className="text-red-400">
                      <p className="font-semibold mb-1">Backend Error</p>
                      <p className="text-sm">{backendError}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-400 text-sm mb-2">
                        Current Value:
                      </p>
                      <p className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {backendValue?.value ?? "N/A"}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={fetchFromBackend}
                  disabled={isLoadingBackend}
                  className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                  {isLoadingBackend ? "Refreshing..." : "🔄 Refresh from Backend"}
                </button>
              </div>

              {/* Events Card */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">📜</span> Events Log
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  ValueUpdated events from Smart Contract (via Backend)
                </p>

                <div className="bg-gray-900/50 rounded-xl p-4 max-h-64 overflow-y-auto mb-4">
                  {isLoadingEvents ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-400">Loading events...</span>
                    </div>
                  ) : events.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No events found
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {events.slice(-10).map((event, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-800/50 rounded-lg p-3 border border-gray-700"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-purple-400 font-semibold">
                              Value: {event.value}
                            </span>
                            <span className="text-xs text-gray-500">
                              Block #{event.blockNumber}
                            </span>
                          </div>
                          <a
                            href={`https://testnet.snowtrace.io/tx/${event.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 break-all"
                          >
                            {event.txHash.slice(0, 30)}...
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={fetchEvents}
                  disabled={isLoadingEvents}
                  className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                  {isLoadingEvents ? "Loading..." : "🔄 Refresh Events"}
                </button>
              </div>
            </div>
          </div>

          {/* Architecture Info */}
          <div className="mt-12 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">
              🏗️ Full Stack Architecture
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-gray-900/50 rounded-xl p-6">
                <div className="text-4xl mb-3">🖥️</div>
                <h3 className="font-bold text-lg mb-2">Frontend</h3>
                <p className="text-gray-400 text-sm">
                  Next.js + wagmi
                  <br />
                  Wallet connection & UI
                </p>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6">
                <div className="text-4xl mb-3">⚙️</div>
                <h3 className="font-bold text-lg mb-2">Backend</h3>
                <p className="text-gray-400 text-sm">
                  NestJS + viem
                  <br />
                  API & blockchain reads
                </p>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6">
                <div className="text-4xl mb-3">⛓️</div>
                <h3 className="font-bold text-lg mb-2">Blockchain</h3>
                <p className="text-gray-400 text-sm">
                  Avalanche Fuji
                  <br />
                  Source of truth
                </p>
              </div>
            </div>
            <p className="text-center text-gray-500 text-sm mt-6">
              📌 User signs transactions via wallet | Backend only reads (no
              private keys) | Smart contract = source of truth
            </p>
          </div>

          {/* Footer */}
          <footer className="mt-12 text-center text-gray-500 text-sm">
            <p>
              Avalanche Indonesia Short Course – Day 5 | Full Stack dApp
              Integration
            </p>
            <p className="mt-2">
              <strong>TEGAR ANDRIYANSYAH</strong> | NIM: 231011402038
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
