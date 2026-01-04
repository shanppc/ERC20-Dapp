import { ERC20_ABI } from "./Erc20abi.js";
import { FauctContract_ABI } from "./FauctContractAbi.js";

let provider;
let signer;
let tokenContract;
let faucetContract;

const tokenAddress = "0xE44a188329Dd840c6c4aBe5646376FF2e67c091D";
const faucetAddress = "0xD232e9afC5931Fbf9026f9357EbDfadd05Eb22Aa";
const SEPOLIA_CHAIN_ID = '0xaa36a7';

let walletConnectProvider = null;

// ==================== WALLET CONNECTION ====================

async function connectWallet() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Check if MetaMask is available
    if (window.ethereum) {
        // Desktop or MetaMask mobile browser
        await connectWithMetaMask();
        return;
    }
    
    // Mobile without MetaMask extension detected
    if (isMobile) {
        // Show modal with options to open in MetaMask browser
        showMobileConnectionOptions();
        return;
    }
    
    // Desktop without MetaMask
    alert("Please install MetaMask extension to continue.");
    window.open("https://metamask.io/download/", "_blank");
}

function showMobileConnectionOptions() {
    const modal = document.createElement('div');
    modal.id = 'mobileModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.95);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    const currentUrl = window.location.href;
    const metamaskBrowserUrl = `https://metamask.app.link/dapp/${currentUrl.replace(/^https?:\/\//, '')}`;
    
    modal.innerHTML = `
        <div style="
            background: #1a1a1a;
            padding: 30px;
            border-radius: 20px;
            max-width: 400px;
            width: 100%;
            text-align: center;
            color: white;
        ">
            <div style="font-size: 60px; margin-bottom: 20px;">🦊</div>
            <h2 style="margin: 0 0 15px 0; font-size: 24px;">Connect with MetaMask</h2>
            <p style="color: #999; margin-bottom: 30px; font-size: 14px; line-height: 1.5;">
                Open this page in MetaMask's built-in browser to connect your wallet
            </p>
            
            <button onclick="openInMetaMask('${metamaskBrowserUrl}')" style="
                width: 100%;
                background: linear-gradient(135deg, #f6851b 0%, #e2761b 100%);
                color: white;
                padding: 18px;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                margin-bottom: 15px;
                box-shadow: 0 4px 15px rgba(246, 133, 27, 0.3);
            ">
                🚀 Open in MetaMask Browser
            </button>
            
            <div style="
                margin: 25px 0;
                padding: 20px;
                background: rgba(255,255,255,0.05);
                border-radius: 10px;
                font-size: 13px;
                line-height: 1.6;
                text-align: left;
                color: #ccc;
            ">
                <div style="font-weight: bold; margin-bottom: 10px; color: white;">📱 Manual Steps:</div>
                1. Open MetaMask app<br>
                2. Tap the menu (☰)<br>
                3. Tap "Browser"<br>
                4. Enter: <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-size: 11px; display: inline-block; margin-top: 5px;">${window.location.host}</code>
            </div>
            
            <button onclick="tryWalletConnect()" style="
                width: 100%;
                background: transparent;
                color: #037dd6;
                padding: 15px;
                border: 2px solid #037dd6;
                border-radius: 12px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                margin-bottom: 10px;
            ">
                🔗 Try WalletConnect Instead
            </button>
            
            <button onclick="document.getElementById('mobileModal').remove()" style="
                background: transparent;
                border: none;
                color: #666;
                padding: 10px;
                cursor: pointer;
                font-size: 14px;
            ">Cancel</button>
        </div>
    `;
    document.body.appendChild(modal);
}

window.openInMetaMask = function(url) {
    // Try to open in MetaMask browser
    window.location.href = url;
    
    // Show waiting message
    setTimeout(() => {
        const modal = document.getElementById('mobileModal');
        if (modal) {
            modal.querySelector('div').innerHTML = `
                <div style="font-size: 60px; margin-bottom: 20px;">🦊</div>
                <h2 style="margin: 0 0 15px 0; font-size: 24px; color: white;">Opening MetaMask...</h2>
                <p style="color: #999; margin-bottom: 30px; font-size: 14px;">
                    If MetaMask didn't open, please open it manually and use the browser feature
                </p>
                <div class="spinner" style="margin: 0 auto;"></div>
                <button onclick="document.getElementById('mobileModal').remove()" style="
                    margin-top: 30px;
                    background: transparent;
                    border: none;
                    color: #666;
                    padding: 10px;
                    cursor: pointer;
                    font-size: 14px;
                ">Close</button>
            `;
        }
    }, 1000);
};

window.tryWalletConnect = async function() {
    document.getElementById('mobileModal').remove();
    await connectWithWalletConnect();
};

async function connectWithWalletConnect() {
    try {
        showConnectionStatus("Initializing WalletConnect...");
        
        // Check if WalletConnect is available
        if (!window.WalletConnectProvider) {
            throw new Error("WalletConnect library not loaded. Please refresh the page.");
        }

        const WalletConnectProvider = window.WalletConnectProvider.default;
        
        // Create new provider instance
        walletConnectProvider = new WalletConnectProvider({
            rpc: {
                11155111: "https://ethereum-sepolia-rpc.publicnode.com"
            },
            chainId: 11155111,
            qrcode: true, // Enable QR code as fallback
            qrcodeModalOptions: {
                mobileLinks: [
                    "metamask",
                    "trust",
                    "rainbow",
                ],
            }
        });

        console.log("WalletConnect provider created");

        // Set up event listeners
        walletConnectProvider.connector.on("display_uri", (err, payload) => {
            const uri = payload.params[0];
            console.log("WalletConnect URI:", uri);
            
            // Try to open MetaMask with the URI
            const metamaskLink = `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}`;
            updateConnectionStatus("Opening MetaMask...", metamaskLink, uri);
            
            // Automatically try to open MetaMask
            setTimeout(() => {
                window.location.href = metamaskLink;
            }, 500);
        });

        walletConnectProvider.connector.on("connect", async (error, payload) => {
            if (error) {
                console.error("Connection error:", error);
                hideConnectionStatus();
                alert("Connection failed: " + error.message);
                return;
            }
            console.log("Connected successfully!", payload);
            updateConnectionStatus("Connected! Setting up...");
            await finalizeConnection();
        });

        walletConnectProvider.connector.on("disconnect", (error, payload) => {
            console.log("Disconnected:", payload);
            disconnectWallet();
        });

        // Enable the provider
        updateConnectionStatus("Connecting to WalletConnect...");
        await walletConnectProvider.enable();
        
        console.log("WalletConnect enabled");

    } catch (error) {
        console.error("WalletConnect failed:", error);
        hideConnectionStatus();
        
        if (error.message.includes("User closed modal")) {
            // User cancelled, just close
            return;
        }
        
        alert("Connection failed: " + error.message + "\n\nTry opening this page in MetaMask's built-in browser instead.");
    }
}

async function connectWithMetaMask() {
    try {
        provider = new ethers.BrowserProvider(window.ethereum);
        
        // Request account access
        const accounts = await provider.send("eth_requestAccounts", []);
        
        if (!accounts || accounts.length === 0) {
            throw new Error("No accounts found");
        }

        // Check network
        const network = await provider.getNetwork();
        const currentChainId = "0x" + network.chainId.toString(16);

        if (currentChainId !== SEPOLIA_CHAIN_ID) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: SEPOLIA_CHAIN_ID }],
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    // Chain not added to MetaMask
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: SEPOLIA_CHAIN_ID,
                                chainName: 'Sepolia Testnet',
                                nativeCurrency: {
                                    name: 'Sepolia ETH',
                                    symbol: 'ETH',
                                    decimals: 18
                                },
                                rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
                                blockExplorerUrls: ['https://sepolia.etherscan.io']
                            }]
                        });
                    } catch (addError) {
                        console.error("Failed to add Sepolia network:", addError);
                        alert("Please add Sepolia network to MetaMask manually.");
                        return;
                    }
                } else {
                    throw switchError;
                }
            }
        }

        signer = await provider.getSigner();
        tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        faucetContract = new ethers.Contract(faucetAddress, FauctContract_ABI, signer);

        const address = await signer.getAddress();
        updateUIAfterConnection(address);

        // Set up event listeners
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());
  
    } catch (error) {
        console.error("MetaMask connection failed:", error);
        
        if (error.code === 4001) {
            alert("Connection rejected. Please approve the connection request.");
        } else if (error.code === -32002) {
            alert("Please check MetaMask - a connection request is already pending.");
        } else {
            alert("Connection failed: " + (error.message || "Unknown error"));
        }
    }
}

async function finalizeConnection() {
    try {
        provider = new ethers.BrowserProvider(walletConnectProvider);
        signer = await provider.getSigner();
        
        tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        faucetContract = new ethers.Contract(faucetAddress, FauctContract_ABI, signer);

        const address = await signer.getAddress();
        updateUIAfterConnection(address);
        hideConnectionStatus();

        // Subscribe to events
        walletConnectProvider.on("accountsChanged", (accounts) => {
            if (accounts.length === 0) {
                disconnectWallet();
            } else {
                window.location.reload();
            }
        });

        walletConnectProvider.on("chainChanged", () => {
            window.location.reload();
        });

        walletConnectProvider.on("disconnect", () => {
            disconnectWallet();
        });

    } catch (error) {
        console.error("Finalize connection failed:", error);
        hideConnectionStatus();
        alert("Failed to complete connection: " + error.message);
    }
}

function showConnectionStatus(message) {
    hideConnectionStatus();
    
    const statusDiv = document.createElement('div');
    statusDiv.id = 'connectionStatus';
    statusDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.95);
        color: white;
        padding: 30px;
        border-radius: 15px;
        z-index: 10000;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        min-width: 300px;
        max-width: 90%;
    `;
    statusDiv.innerHTML = `
        <div style="font-size: 50px; margin-bottom: 15px;">🦊</div>
        <div id="statusMessage" style="font-size: 16px; margin-bottom: 20px; font-weight: bold;">${message}</div>
        <div class="spinner"></div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .spinner {
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(statusDiv);
}

function updateConnectionStatus(message, metamaskLink, uri) {
    const statusDiv = document.getElementById('connectionStatus');
    if (!statusDiv) {
        showConnectionStatus(message);
        return;
    }
    
    const messageDiv = document.getElementById('statusMessage');
    if (messageDiv) {
        messageDiv.textContent = message;
    }
    
    if (metamaskLink && uri) {
        // Add manual connection button and QR info
        statusDiv.querySelector('div').innerHTML = `
            <div style="font-size: 50px; margin-bottom: 15px;">🦊</div>
            <div style="font-size: 16px; margin-bottom: 15px; font-weight: bold;">${message}</div>
            <div style="font-size: 13px; opacity: 0.8; margin-bottom: 20px;">
                Approve the connection in MetaMask
            </div>
            <button onclick="window.location.href='${metamaskLink}'" style="
                padding: 12px 24px;
                background: #f6851b;
                border: none;
                border-radius: 8px;
                color: white;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 15px;
            ">Open MetaMask Again</button>
            <br>
            <button onclick="window.hideConnectionStatus()" style="
                padding: 10px 20px;
                background: transparent;
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 8px;
                color: white;
                cursor: pointer;
                font-size: 12px;
            ">Cancel</button>
        `;
    }
}

function hideConnectionStatus() {
    const statusDiv = document.getElementById('connectionStatus');
    if (statusDiv) {
        statusDiv.remove();
    }
}

async function updateUIAfterConnection(address) {
    document.getElementById("account").innerText = address.slice(0, 6) + '...' + address.slice(-4);
    document.getElementById("accountDisplay").style.display = 'block';
    document.getElementById("connectBtn").style.display = 'none';
    
    await loadTokenData();
    await checkAdminPermissions(address);
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        disconnectWallet();
    } else {
        window.location.reload();
    }
}

function disconnectWallet() {
    if (walletConnectProvider) {
        try {
            walletConnectProvider.disconnect();
        } catch (error) {
            console.error("Error disconnecting WalletConnect:", error);
        }
        walletConnectProvider = null;
    }
    
    provider = null;
    signer = null;
    tokenContract = null;
    faucetContract = null;
    
    document.getElementById("account").innerText = "";
    document.getElementById("accountDisplay").style.display = 'none';
    document.getElementById("connectBtn").style.display = 'block';
    
    document.getElementById("tokenName").innerText = "-";
    document.getElementById("tokenSymbol").innerText = "-";
    document.getElementById("tokenDecimals").innerText = "-";
    document.getElementById("balance").innerText = "-";
}

window.hideConnectionStatus = hideConnectionStatus;

document.getElementById("connectBtn").onclick = connectWallet;

// ==================== HOME PAGE FUNCTIONS ====================

async function loadTokenData() {
    try {
        document.getElementById("tokenName").innerText = await tokenContract.name();
        document.getElementById("tokenSymbol").innerText = await tokenContract.symbol();
        document.getElementById("tokenDecimals").innerText = (await tokenContract.decimals()).toString();

        const balance = await tokenContract.balanceOf(await signer.getAddress());
        document.getElementById("balance").innerText = parseFloat(ethers.formatEther(balance)).toFixed(4);
    } catch (error) {
        console.error("Error loading token data:", error);
    }
}

function showStatus(elementId, message, type) {
    const el = document.getElementById(elementId);
    el.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
}

async function transfer() {
    const amountInTokens = document.getElementById("amount").value;
    const address = document.getElementById("address").value;

    if (!amountInTokens || !address) {
        alert("Please enter both address and amount");
        return;
    }

    const amountInBaseUnits = ethers.parseUnits(amountInTokens, 18);
    try {
        showStatus("txStatus", "⏳ Sending transaction...", "pending");
        const tx = await tokenContract.transfer(address, amountInBaseUnits);
        showStatus("txStatus", "⏳ Waiting for confirmation...", "pending");
        await tx.wait();
        showStatus("txStatus", `✅ Success! TX: ${tx.hash.slice(0, 10)}...`, "success");
        await loadTokenData();
        document.getElementById("amount").value = "";
        document.getElementById("address").value = "";
    } catch (error) {
        console.error("Transfer failed:", error);
        showStatus("txStatus", "❌ Transaction failed. Check console.", "error");
    }
}

async function approve() {
    const amountInTokens = document.getElementById("amountforSpender").value;
    const address = document.getElementById("spenderAddr").value;

    if (!amountInTokens || !address) {
        alert("Please enter both spender address and amount");
        return;
    }

    const amountInBaseUnits = ethers.parseUnits(amountInTokens, 18);
    try {
        const tx = await tokenContract.approve(address, amountInBaseUnits);
        await tx.wait();
        alert("✅ Approval successful!");
        document.getElementById("amountforSpender").value = "";
        document.getElementById("spenderAddr").value = "";
    } catch (error) {
        console.error("Approval failed:", error);
        alert("❌ Approval failed. Check console.");
    }
}

async function checkAllowance() {
    const approverAddr = document.getElementById("approver").value;
    const spenderAddr = document.getElementById("spender").value;

    if (!approverAddr || !spenderAddr) {
        alert("Please enter both addresses");
        return;
    }

    try {
        const allowanceInBaseUnits = await tokenContract.allowance(approverAddr, spenderAddr);
        document.getElementById("allowance").innerText = ethers.formatUnits(allowanceInBaseUnits, 18);
    } catch (error) {
        console.error("Error checking allowance:", error);
        document.getElementById("allowance").innerText = "Error";
    }
}

async function transferFrom() {
    const fromAddr = document.getElementById("_from").value;
    const toAddr = document.getElementById("_to").value;
    const amountInTokens = document.getElementById("_amount").value;

    if (!fromAddr || !toAddr || !amountInTokens) {
        alert("Please enter all fields");
        return;
    }

    const amountInBaseUnits = ethers.parseUnits(amountInTokens, 18);
    try {
        const tx = await tokenContract.transferFrom(fromAddr, toAddr, amountInBaseUnits);
        await tx.wait();
        alert("✅ Transfer from successful!");
        await loadTokenData();
        document.getElementById("_from").value = "";
        document.getElementById("_to").value = "";
        document.getElementById("_amount").value = "";
    } catch (error) {
        console.error("TransferFrom failed:", error);
        alert("❌ Transfer failed. Check console.");
    }
}

async function burn() {
    const amountInTokens = document.getElementById("burningAmount").value;

    if (!amountInTokens) {
        alert("Please enter amount to burn");
        return;
    }

    const amountInBaseUnits = ethers.parseUnits(amountInTokens, 18);
    try {
        const tx = await tokenContract.burn(amountInBaseUnits);
        await tx.wait();
        alert("🔥 Tokens burned successfully!");
        await loadTokenData();
        document.getElementById("burningAmount").value = "";
    } catch (error) {
        console.error("Burn failed:", error);
        alert("❌ Burn failed. Check console.");
    }
}

// ==================== OWNER PAGE FUNCTIONS ====================

async function checkAdminPermissions(userAddress) {
    try {
        const owner = await tokenContract.owner();
        
        if (userAddress.toLowerCase() !== owner.toLowerCase()) {
            const adminButtons = ["mintBtn", "pauseBtn", "unPauseBtn", "newOwnerBtn"];
            
            adminButtons.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.disabled = true;
                    btn.title = "Only the owner can use this function";
                }
            });
        }
    } catch (error) {
        console.error("Could not verify owner status:", error);
    }
}

async function mint() {
    const address = document.getElementById("addrToMint").value;
    const amountToMint = document.getElementById("amutToMint").value;

    if (!address || !amountToMint) {
        alert("Please enter both address and amount");
        return;
    }

    const amount = ethers.parseUnits(amountToMint, 18);
    try {
        const tx = await tokenContract.mint(address, amount);
        await tx.wait();
        alert("⛏️ Tokens minted successfully!");
        document.getElementById("addrToMint").value = "";
        document.getElementById("amutToMint").value = "";
    } catch (error) {
        console.error("Mint failed:", error);
        alert("❌ Mint failed. Check console.");
    }
}

async function pause() {
    try {
        const tx = await tokenContract.pause();
        await tx.wait();
        alert("⏸️ Contract paused successfully!");
    } catch (error) {
        console.error("Pause failed:", error);
        alert("❌ Pause failed. Check console.");
    }
}

async function unpause() {
    try {
        const tx = await tokenContract.unpause();
        await tx.wait();
        alert("▶️ Contract unpaused successfully!");
    } catch (error) {
        console.error("Unpause failed:", error);
        alert("❌ Unpause failed. Check console.");
    }
}

async function changeOwner() {
    const newOwner = document.getElementById("newOwnerAddr").value;

    if (!newOwner) {
        alert("Please enter new owner address");
        return;
    }

    try {
        const tx = await tokenContract.transferOwnership(newOwner);
        await tx.wait();
        alert("🔑 Ownership transferred successfully!");
        document.getElementById("newOwnerAddr").value = "";
    } catch (error) {
        console.error("Transfer ownership failed:", error);
        alert("❌ Transfer ownership failed. Check console.");
    }
}

// ==================== FAUCET FUNCTIONS ====================

async function claimTokens() {
    try {
        showStatus("claimStatus", "⏳ Claiming tokens...", "pending");
        const tx = await faucetContract.requestTokens();
        showStatus("claimStatus", "⏳ Waiting for confirmation...", "pending");
        await tx.wait();
        showStatus("claimStatus", "🎉 Successfully claimed 20 Z Tokens!", "success");
        await loadTokenData();
    } catch (error) {
        console.error("Claim failed:", error);
        showStatus("claimStatus", "❌ Claim failed.", "error");
    }
}

// ==================== EVENT LISTENERS ====================

document.getElementById("sendTxBtn").onclick = transfer;
document.getElementById("approveBtn").onclick = approve;
document.getElementById("allowanceBtn").onclick = checkAllowance;
document.getElementById("transferFromBtn").onclick = transferFrom;
document.getElementById("burnBtn").onclick = burn;
document.getElementById("mintBtn").onclick = mint;
document.getElementById("pauseBtn").onclick = pause;
document.getElementById("unPauseBtn").onclick = unpause;
document.getElementById("newOwnerBtn").onclick = changeOwner;
document.getElementById("claimBtn").onclick = claimTokens;

// ==================== NAVIGATION ====================

const navTabs = document.querySelectorAll('.nav-tab');
const pages = document.querySelectorAll('.page');

navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetPage = tab.getAttribute('data-page');
        
        navTabs.forEach(t => t.classList.remove('active'));
        pages.forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(targetPage + '-page').classList.add('active');
    });
});