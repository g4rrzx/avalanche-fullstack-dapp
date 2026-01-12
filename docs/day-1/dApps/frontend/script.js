const connectBtn = document.getElementById("connectBtn");
const statusEl = document.getElementById("status");
const addressEl = document.getElementById("address");
const networkEl = document.getElementById("network");
const balanceEl = document.getElementById("balance");
const errorEl = document.getElementById("error");

const AVALANCHE_FUJI_CHAIN_ID = "0xa869";

function formatAvaxBalance(balanceWei) {
  const balance = parseInt(balanceWei, 16);
  return (balance / 1e18).toFixed(4);
}

function shortenAddress(address) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function showError(message) {
  errorEl.textContent = message;
  setTimeout(() => {
    errorEl.textContent = "";
  }, 5000);
}

function resetUI() {
  statusEl.textContent = "Not Connected";
  statusEl.style.color = "inherit";
  addressEl.textContent = "-";
  networkEl.textContent = "-";
  balanceEl.textContent = "-";
  connectBtn.disabled = false;
  connectBtn.textContent = "Connect Wallet";
}

async function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    resetUI();
    showError("Please connect to MetaMask.");
  } else {
    await connectWallet();
  }
}

function handleChainChanged(_chainId) {
  window.location.reload();
}

async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    alert("Core Wallet tidak terdeteksi. Silakan install Core Wallet.");
    return;
  }

  try {
    statusEl.textContent = "Connecting...";
    connectBtn.disabled = true;
    connectBtn.textContent = "Connecting...";

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const address = accounts[0];
    addressEl.textContent = shortenAddress(address);

    const chainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    if (chainId === AVALANCHE_FUJI_CHAIN_ID) {
      networkEl.textContent = "Avalanche Fuji Testnet";
      statusEl.textContent = "Connected ✅";
      statusEl.style.color = "#4cd137";
      connectBtn.textContent = "Connected";

      const balanceWei = await window.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      });

      balanceEl.textContent = formatAvaxBalance(balanceWei);
    } else {
      networkEl.textContent = "Wrong Network ❌";
      statusEl.textContent = "Please switch to Avalanche Fuji";
      statusEl.style.color = "#fbc531";
      balanceEl.textContent = "-";
      showError("Please switch to Avalanche Fuji Testnet");

      connectBtn.disabled = false;
      connectBtn.textContent = "Connect Wallet";
    }
  } catch (error) {
    console.error(error);
    statusEl.textContent = "Connection Failed ❌";
    showError(error.message || "Connection failed");
    connectBtn.disabled = false;
    connectBtn.textContent = "Connect Wallet";
  }
}

if (window.ethereum) {
  window.ethereum.on('accountsChanged', handleAccountsChanged);
  window.ethereum.on('chainChanged', handleChainChanged);
}

connectBtn.addEventListener("click", connectWallet);
