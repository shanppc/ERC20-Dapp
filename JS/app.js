import { ERC20_ABI } from "./Erc20abi.js";
import { FauctContract_ABI } from "./FauctContractAbi.js";


let provider;
let signer;
let tokenContract;
let faucetContract;
let walletConnectProvider;
const tokenAddress = "0xE44a188329Dd840c6c4aBe5646376FF2e67c091D";
const faucetAddress = "0xD232e9afC5931Fbf9026f9357EbDfadd05Eb22Aa";
const SEPOLIA_CHAIN_ID = '0xaa36a7';

// ==================== WALLET CONNECTION ====================

// Modal functionality
const modal = document.getElementById('walletModal');
const closeBtn = document.querySelector('.close');
const connectBtn = document.getElementById('connectBtn');

connectBtn.onclick = () => {
    modal.style.display = 'block';
};

closeBtn.onclick = () => {
    modal.style.display = 'none';
};

window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// MetaMask connection
document.getElementById('metamaskOption').onclick = async () => {
    modal.style.display = 'none';
    await connectMetaMask();
};

// WalletConnect connection
document.getElementById('walletconnectOption').onclick = async () => {
    modal.style.display = 'none';
    await connectWalletConnect();
};

async function connectMetaMask() {
    if (!window.ethereum) {
        alert("MetaMask not found! Please install MetaMask.");
        return;
    }

    try {
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
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
                    alert("Please add Sepolia network to MetaMask");
                } else {
                    throw switchError;
                }
                return;
            }
        }

        await initializeContracts();
    } catch (error) {
        console.error("MetaMask connection failed:", error);
        alert("Connection failed. Check console for details.");
    }
}

async function connectWalletConnect() {
    try {
        walletConnectProvider = new WalletConnectProvider.default({
            rpc: {
                11155111: `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}` 
            },
            chainId: 11155111
        });

        await walletConnectProvider.enable();
        provider = new ethers.BrowserProvider(walletConnectProvider);
        await initializeContracts();
    } catch (error) {
        console.error("WalletConnect connection failed:", error);
        alert("WalletConnect connection failed. Check console for details.");
    }
}

async function initializeContracts() {
    signer = await provider.getSigner();
    tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    faucetContract = new ethers.Contract(faucetAddress, FauctContract_ABI, signer);

    const address = await signer.getAddress();
    document.getElementById("account").innerText = address.slice(0, 6) + '...' + address.slice(-4);
    document.getElementById("accountDisplay").style.display = 'block';
    document.getElementById("connectBtn").style.display = 'none';

    await loadTokenData();
    await checkAdminPermissions(address);
}

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
        alert(" Tokens minted successfully!");
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
        showStatus("claimStatus", "❌ Claim failed. wait for 24 hours", "error");
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