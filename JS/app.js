import { ERC20_ABI } from "./Erc20abi.js";


let provider;
let signer;
let tokenContract;

const tokenAddress = "0xE44a188329Dd840c6c4aBe5646376FF2e67c091D";
const SEPOLIA_CHAIN_ID = '0xaa36a7';

// WALLET CONNECTION 

async function connectWallet() {
    if (!window.ethereum) {
        alert("Metamask not found");
        return;
    }

    try {
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const network = await provider.getNetwork();
        const currentChainId = "0x" + network.chainId.toString(16);

        // Check if on Sepolia network
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
            }
        }

        signer = await provider.getSigner();
        tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

        const address = await signer.getAddress();
        document.getElementById("account").innerText = address;
        
       await loadTokenData();
       await checkAdminPermissions(address);
  
    } catch (error) {
        console.error("Connection failed", error);
        alert("Connection failed. Check console for details.");
    }
}

document.getElementById("connectBtn").onclick = connectWallet;

// HOME PAGE FUNCTIONS //

async function loadTokenData() {
    try {
        document.getElementById("tokenName").innerText = await tokenContract.name();
        document.getElementById("tokenSymbol").innerText = await tokenContract.symbol();
        document.getElementById("tokenDecimals").innerText = (await tokenContract.decimals()).toString();

        const balance = await tokenContract.balanceOf(await signer.getAddress());
        document.getElementById("balance").innerText = ethers.formatEther(balance);
    } catch (error) {
        console.error("Error loading token data:", error);
    }
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
        const tx = await tokenContract.transfer(address, amountInBaseUnits);
        document.getElementById("txStatus").innerText = "Sending Transaction....";
        await tx.wait();
        document.getElementById("txStatus").innerText = `Transaction submitted: ${tx.hash}`;
        await loadTokenData();
    } catch (error) {
        console.error("Transfer failed:", error);
        document.getElementById("txStatus").innerText = "Transaction Failed. Check console for details.";
    }
}

document.getElementById("sendTxBtn").onclick = transfer;

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
        console.log("Approved:", tx.hash);
        alert("Approval successful!");
    } catch (error) {
        console.error("Approval failed:", error);
        alert("Approval failed. Check console for details.");
    }
}

document.getElementById("approveBtn").onclick = approve;

async function checkAllowance() {
    const approverAddr = document.getElementById("approver").value;
    const spenderAddr = document.getElementById("spender").value;

    if (!approverAddr || !spenderAddr) {
        alert("Please enter both approver and spender addresses");
        return;
    }

    try {
        const allowanceInBaseUnits = await tokenContract.allowance(approverAddr, spenderAddr);
        document.getElementById("allowance").innerText = ethers.formatUnits(allowanceInBaseUnits, 18);
    } catch (error) {
        console.error("Error checking allowance:", error);
        document.getElementById("allowance").innerText = "Error checking allowance";
    }
}

document.getElementById("allowanceBtn").onclick = checkAllowance;

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
        console.log("Transaction Confirmed:", tx.hash);
        alert("Transfer from successful!");
        await loadTokenData();
    } catch (error) {
        console.error("TransferFrom failed:", error);
        alert("Transfer from failed. Check console for details.");
    }
}

document.getElementById("transferFromBtn").onclick = transferFrom;

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
        console.log(`Burned: ${tx.hash}`);
        alert("Tokens burned successfully!");
        await loadTokenData();
    } catch (error) {
        console.error("Burn failed:", error);
        alert("Burn failed. Check console for details.");
    }
}

document.getElementById("burnBtn").onclick = burn;


// OWNER PAGE FUNCTIONS //
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
        console.log("Minted:", tx.hash);
        alert("Tokens minted successfully!");
    } catch (error) {
        console.error("Mint failed:", error);
        alert("Mint failed. Check console for details.");
    }
}

document.getElementById("mintBtn").onclick = mint;

async function pause() {
    try {
        const tx = await tokenContract.pause();
        await tx.wait();
        console.log("Paused:", tx.hash);
        alert("Contract paused successfully!");
    } catch (error) {
        console.error("Pause failed:", error);
        alert("Pause failed. Check console for details.");
    }
}

document.getElementById("pauseBtn").onclick = pause;

async function unpause() {
    try {
        const tx = await tokenContract.unpause();
        await tx.wait();
        console.log("Unpaused:", tx.hash);
        alert("Contract unpaused successfully!");
    } catch (error) {
        console.error("Unpause failed:", error);
        alert("Unpause failed. Check console for details.");
    }
}

document.getElementById("unPauseBtn").onclick = unpause;

async function changeOwner() {
    const newOwner = document.getElementById("newOwnerAddr").value;

    if (!newOwner) {
        alert("Please enter new owner address");
        return;
    }

    try {
        const tx = await tokenContract.transferOwnership(newOwner);
        await tx.wait();
        console.log("Owner Changed:", tx.hash);
        alert("Ownership transferred successfully!");
    } catch (error) {
        console.error("Transfer ownership failed:", error);
        alert("Transfer ownership failed. Check console for details.");
    }
}

document.getElementById("newOwnerBtn").onclick = changeOwner;