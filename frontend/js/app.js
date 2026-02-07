import { ERC20_ABI } from "./Erc20abi.js";
import { FauctContract_ABI } from "./FauctContractAbi.js";

let provider;
let signer;
let tokenContract;
let faucetContract;
let icoContract;
let stakingContract;
let currentAccount;

const tokenAddress = "0xE44a188329Dd840c6c4aBe5646376FF2e67c091D";
const faucetAddress = "0xD232e9afC5931Fbf9026f9357EbDfadd05Eb22Aa";
const ICO_ADDRESS = "0x07F0a5F68CCc2Eb5198A5Bd4248e4a0b0e8397Af";
const STAKING_ADDRESS = "0xC3c313E4a43F218856264b50d47e5911635bc255";
const SEPOLIA_CHAIN_ID = '0xaa36a7';

const ICO_ABI = [
    "function buyTokens() external payable",
    "function rate() public view returns(uint256)"
];

const STAKING_ABI = [
    "function stake(uint256 amount)",
    "function unStake(uint256 amount)",
    "function getReward()",
    "function stakeBalance(address) view returns (uint256)",
    "function earned(address) view returns(uint256)",
    "function rewardPerDay() view returns (uint256)",
    "function totalStakedTokens() view returns (uint256)"
];

const TOKEN_IMAGE = "../assets/z-token-img.png"; // will add later

let icoRate = 0; 

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
        icoContract = new ethers.Contract(ICO_ADDRESS, ICO_ABI, signer);
        stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);

        const address = await signer.getAddress();
        currentAccount = address;
        
        await updateUIAfterConnection(address);

        // Set up event listeners
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());
  
    } catch (error) {
        console.error("Connection error:", error);
        alert("Failed to connect wallet. Please try again.");
    }
}

async function addTokenToWallet() {
    try {
        const wasAdded = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: tokenAddress,
                    symbol: 'Z',
                    decimals: 18,
                    image: TOKEN_IMAGE,
                },
            },
        });
        return wasAdded;
    } catch (error) {
        console.error("Error adding token to wallet:", error);
        return false;
    }
}

async function updateUIAfterConnection(address) {
    document.getElementById("connectBtn").style.display = "none";
    document.getElementById("accountDisplay").style.display = "block";
    document.getElementById("account").innerText = address.slice(0, 6) + '...' + address.slice(-4);
    
    await loadTokenData();
    await loadICOData(address);
    await checkAdminPermissions(address);
    await updateStakingUI();
}

async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        console.log("Please connect to MetaMask.");
        document.getElementById("connectBtn").style.display = "block";
        document.getElementById("accountDisplay").style.display = "none";
    } else {
        signer = await provider.getSigner();
        tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        faucetContract = new ethers.Contract(faucetAddress, FauctContract_ABI, signer);
        icoContract = new ethers.Contract(ICO_ADDRESS, ICO_ABI, signer);
        stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
        
        const address = await signer.getAddress();
        currentAccount = address;
        await updateUIAfterConnection(address);
    }
}

// ==================== UI UPDATES ====================

async function loadTokenData() {
    try {
        const name = await tokenContract.name();
        const symbol = await tokenContract.symbol();
        const decimals = await tokenContract.decimals();
        const balance = await tokenContract.balanceOf(await signer.getAddress());

        document.getElementById("tokenName").innerText = name;
        document.getElementById("tokenSymbol").innerText = symbol;
        document.getElementById("tokenDecimals").innerText = decimals;
        document.getElementById("balance").innerText = parseFloat(ethers.formatEther(balance)).toFixed(4);
    } catch (error) {
        console.error("Error loading token data:", error);
    }
}

function showStatus(elementId, message, type) {
    const statusElement = document.getElementById(elementId);
    statusElement.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
    
    if (type === "success" || type === "error") {
        setTimeout(() => {
            statusElement.innerHTML = "";
        }, 5000);
    }
}

// ==================== HOME PAGE FUNCTIONS ====================

async function transfer() {
    const toAddress = document.getElementById("address").value;
    const amountInTokens = document.getElementById("amount").value;

    if (!toAddress || !amountInTokens) {
        alert("Please enter both address and amount");
        return;
    }

    const amountInBaseUnits = ethers.parseUnits(amountInTokens, 18);
    try {
        showStatus("txStatus", "⏳ Sending transaction...", "pending");
        const tx = await tokenContract.transfer(toAddress, amountInBaseUnits);
        showStatus("txStatus", "⏳ Waiting for confirmation...", "pending");
        await tx.wait();
        showStatus("txStatus", "✅ Transfer successful!", "success");
        await loadTokenData();
        document.getElementById("address").value = "";
        document.getElementById("amount").value = "";
    } catch (error) {
        console.error("Transfer failed:", error);
        showStatus("txStatus", "❌ Transfer failed. Check console.", "error");
    }
}

async function approve() {
    const spender = document.getElementById("spenderAddr").value;
    const amountInTokens = document.getElementById("amountforSpender").value;

    if (!spender || !amountInTokens) {
        alert("Please enter both spender address and amount");
        return;
    }

    const amountInBaseUnits = ethers.parseUnits(amountInTokens, 18);
    try {
        const tx = await tokenContract.approve(spender, amountInBaseUnits);
        await tx.wait();
        alert("✅ Approval successful!");
        document.getElementById("spenderAddr").value = "";
        document.getElementById("amountforSpender").value = "";
    } catch (error) {
        console.error("Approve failed:", error);
        alert("❌ Approval failed. Check console.");
    }
}

async function checkAllowance() {
    const owner = document.getElementById("approver").value;
    const spender = document.getElementById("spender").value;

    if (!owner || !spender) {
        alert("Please enter both owner and spender addresses");
        return;
    }

    try {
        const allowance = await tokenContract.allowance(owner, spender);
        document.getElementById("allowance").innerText = parseFloat(ethers.formatEther(allowance)).toFixed(4);
    } catch (error) {
        console.error("Check allowance failed:", error);
        alert("❌ Failed to check allowance. Check console.");
    }
}

async function transferFrom() {
    const from = document.getElementById("_from").value;
    const to = document.getElementById("_to").value;
    const amountInTokens = document.getElementById("_amount").value;

    if (!from || !to || !amountInTokens) {
        alert("Please fill all fields");
        return;
    }

    const amountInBaseUnits = ethers.parseUnits(amountInTokens, 18);
    try {
        const tx = await tokenContract.transferFrom(from, to, amountInBaseUnits);
        await tx.wait();
        alert("✅ Transfer From successful!");
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

// ==================== ICO FUNCTIONS ====================

async function loadICOData(address) {
    try {
        document.getElementById("ico-account").innerText = address.slice(0, 6) + '...' + address.slice(-4);
        
        // Fetch and display rate
        const rawRate = await icoContract.rate();
        icoRate = Number(rawRate);
        document.getElementById("ico-rate").innerText = `${icoRate} Z = 1 ETH`;
    } catch (error) {
        console.error("Error loading ICO data:", error);
        document.getElementById("ico-rate").innerText = "Error loading rate";
    }
}

// Real-time calculation for ICO
document.getElementById("ico-eth-amount").addEventListener("input", function() {
    const ethAmount = this.value;
    const display = document.getElementById("ico-z-amount");

    if (!icoContract || icoRate === 0) {
        display.innerText = "0";
        return;
    }

    if (ethAmount && ethAmount > 0) {
        const calculated = parseFloat(ethAmount) * icoRate;
        display.innerText = calculated.toLocaleString();
    } else {
        display.innerText = "0";
    }
});

async function buyTokens() {
    if (!icoContract) {
        alert("Please connect your wallet first");
        return;
    }

    const ethAmount = document.getElementById("ico-eth-amount").value;
    
    if (!ethAmount || ethAmount <= 0) {
        alert("Please enter a valid ETH amount");
        return;
    }

    try {
        showStatus("ico-status", "⏳ Sending transaction...", "pending");
        
        const tx = await icoContract.buyTokens({
            value: ethers.parseEther(ethAmount)
        });

        showStatus("ico-status", "⏳ Waiting for confirmation...", "pending");
        await tx.wait();
        
        showStatus("ico-status", "🎉 Tokens purchased successfully!", "success");
     
        await loadTokenData();
        
        document.getElementById("ico-eth-amount").value = "";
        document.getElementById("ico-z-amount").innerText = "0";
        
    } catch (error) {
        console.error("Buy tokens failed:", error);
        showStatus("ico-status", "❌ Transaction failed. Check console.", "error");
    }
}

// ==================== STAKING FUNCTIONS ====================

async function updateStakingUI() {
    if (!stakingContract || !currentAccount) {
        return;
    }

    try {
        // Update account display
        document.getElementById("stake-account").innerText = currentAccount.slice(0, 6) + '...' + currentAccount.slice(-4);
        
        // Get Staked Balance
        const staked = await stakingContract.stakeBalance(currentAccount);
        document.getElementById("stakedDisplay").innerText = parseFloat(ethers.formatEther(staked)).toFixed(3);

        // Get Pending Rewards
        const rewards = await stakingContract.earned(currentAccount);
        document.getElementById("rewardsDisplay").innerText = parseFloat(ethers.formatEther(rewards)).toFixed(3);
           
        // APY Calculation
        const rawRewardPerDay = await stakingContract.rewardPerDay();
        const rawTotalStaked = await stakingContract.totalStakedTokens();
        
        if (rawTotalStaked > 0n) {
            // Formula: ( (Daily Reward / Total Staked) * 365 days ) * 100
            const annualRewards = rawRewardPerDay * 365n;
            
            // To get percentage with decimal places, multiply by 10000 then divide by 100 later
            const apy = (annualRewards * 10000n) / rawTotalStaked;
            
            // Convert back to readable percentage
            const apyPercentage = Number(apy) / 100;
            document.getElementById("apyDisplay").innerText = apyPercentage.toFixed(2);
        } else {
            document.getElementById("apyDisplay").innerText = "0.00";
        }
    } catch (error) {
        console.error("Error updating staking UI:", error);
    }
}

async function approveStaking() {
    if (!stakingContract) {
        alert("Please connect your wallet first");
        return;
    }

    const amountInTokens = document.getElementById("amountToApprove").value;
    if (!amountInTokens || amountInTokens <= 0) {
        alert("Please enter a valid amount to approve");
        return;
    }

    const amountInBaseUnits = ethers.parseUnits(amountInTokens, 18);
    try {
        showStatus("stake-status", "⏳ Approving tokens...", "pending");
        const tx = await tokenContract.approve(STAKING_ADDRESS, amountInBaseUnits);
        showStatus("stake-status", "⏳ Waiting for confirmation...", "pending");
        await tx.wait();
        showStatus("stake-status", "✅ Tokens approved successfully!", "success");
        document.getElementById("amountToApprove").value = "";
    } catch (error) {
        console.error("Approve failed:", error);
        showStatus("stake-status", "❌ Approval failed. Check console.", "error");
    }
}

async function stake() {
    if (!stakingContract) {
        alert("Please connect your wallet first");
        return;
    }

    const amountToStake = document.getElementById("amountToStake").value;
    if (!amountToStake || amountToStake <= 0) {
        alert("Please enter a valid amount to stake");
        return;
    }

    const amountInBaseUnits = ethers.parseUnits(amountToStake, 18);
    try {
        showStatus("stake-status", "⏳ Staking tokens...", "pending");
        const tx = await stakingContract.stake(amountInBaseUnits);
        showStatus("stake-status", "⏳ Waiting for confirmation...", "pending");
        await tx.wait();
        showStatus("stake-status", "🎉 Tokens staked successfully!", "success");
        await updateStakingUI();
        await loadTokenData();
        document.getElementById("amountToStake").value = "";
    } catch (error) {
        console.error("Stake failed:", error);
        showStatus("stake-status", "❌ Staking failed. Check console.", "error");
    }
}

async function getReward() {
    if (!stakingContract) {
        alert("Please connect your wallet first");
        return;
    }

    try {
        showStatus("stake-status", "⏳ Claiming rewards...", "pending");
        const tx = await stakingContract.getReward();
        showStatus("stake-status", "⏳ Waiting for confirmation...", "pending");
        await tx.wait();
        showStatus("stake-status", "🎉 Rewards claimed successfully!", "success");
        await updateStakingUI();
        await loadTokenData();
    } catch (error) {
        console.error("Claim reward failed:", error);
        showStatus("stake-status", "❌ Claim failed. Check console.", "error");
    }
}

async function unStake() {
    if (!stakingContract) {
        alert("Please connect your wallet first");
        return;
    }

    const amountToUnStake = document.getElementById("amountToUnStake").value;
    if (!amountToUnStake || amountToUnStake <= 0) {
        alert("Please enter a valid amount to unstake");
        return;
    }

    const amountInBaseUnits = ethers.parseUnits(amountToUnStake, 18);
    try {
        showStatus("stake-status", "⏳ Unstaking tokens...", "pending");
        const tx = await stakingContract.unStake(amountInBaseUnits);
        showStatus("stake-status", "⏳ Waiting for confirmation...", "pending");
        await tx.wait();
        showStatus("stake-status", "✅ Tokens unstaked successfully!", "success");
        await updateStakingUI();
        await loadTokenData();
        document.getElementById("amountToUnStake").value = "";
    } catch (error) {
        console.error("Unstake failed:", error);
        showStatus("stake-status", "❌ Unstaking failed. Check console.", "error");
    }
}

// ==================== EVENT LISTENERS ====================

document.getElementById("connectBtn").onclick = connectWallet;
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
document.getElementById("ico-buy-btn").onclick = buyTokens;

// Staking event listeners
document.getElementById("staking-approveBtn").onclick = approveStaking;
document.getElementById("stakeBtn").onclick = stake;
document.getElementById("getRewardBtn").onclick = getReward;
document.getElementById("unStakeBtn").onclick = unStake;

// Add token button listener
document.getElementById("addTokenBtn").onclick = async () => {
    const added = await addTokenToWallet();
    if (added) {
        alert("✅ Token added to MetaMask!");
    }
};

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
        
        // Update staking UI when navigating to stake page
        if (targetPage === 'stake' && stakingContract) {
            updateStakingUI();
        }
    });
});