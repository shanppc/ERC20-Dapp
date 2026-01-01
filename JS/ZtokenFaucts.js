{FauctContract_ABI} from "./FauctContractAbi.js";
let provider;
let signer;
let FauctContract;

const ContractAddress = "0xD232e9afC5931Fbf9026f9357EbDfadd05Eb22Aa";
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
        FauctContract = new ethers.Contract(ContractAddress, FauctContract_ABI, signer);

        const address = await signer.getAddress();
        document.getElementById("account").innerText = address;
        
  
    } catch (error) {
        console.error("Connection failed", error);
        alert("Connection failed. Check console for details.");
    }
}

document.getElementById("connectBtn").onclick = connectWallet;

async function requestTokens() {
    const tx = await FauctContract.requestTokens()
    await tx.wait();
    console.log("Claimed", tx.hash);
    
} document.getElementById("claimBtn").onclick = requestTokens;