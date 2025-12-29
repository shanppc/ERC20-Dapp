import {ERC20_ABI} from "./abi.js";
let provider;
let signer;
let tokenContract;

const tokenAddress = "0x71B0Cf1Fa252787818F692e136bc91C99855a059";

async function connectWallet() {
    if(!window.ethereum){
        alert ("Metamask not found");
        return;
    }
    const SEPOLIA_CHAIN_ID = '0xaa36a7'; 
    try{
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const network = await provider.getNetwork();
    const currentChainId = "0x" + network.chainId.toString(16);

 if (currentChainId !== SEPOLIA_CHAIN_ID) {
            try {
                // 3. Request switch to Sepolia
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: SEPOLIA_CHAIN_ID }],
                });
            } catch (switchError) {
                // Error 4902 means Sepolia isn't added to their MetaMask
                if (switchError.code === 4902) {
                    await addSepoliaNetwork();
                } else {
                    throw switchError;
                }
            }
        }

         signer = await provider.getSigner();
        tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

      const address = await signer.getAddress();
      document.getElementById("account").innerText = address;

    } catch (error) {
        console.error("Connection failed", error);
    }
}
  document.getElementById("connectBtn").onclick = connectWallet;
 
async function mint() {
    const address = document.getElementById("addrToMint").value;
    const amountToMint = document.getElementById("amutToMint").value;
    const amount = ethers.parseUnits(amountToMint, 18);
    try{
    const tx = tokenContract.mint(address, amount);
    await tx.wait();
    console.log("Minted", tx.hash);
    } catch(error){
        console.error(error);
    }
}  document.getElementById("mintBtn").onclick = mint;

async function pause() {
    try{
    const tx = await tokenContract.pause();
     await tx.wait();
    console.log("Paused:", tx.hash);
    }catch(error){
        console.error(error);
    }
} document.getElementById("pauseBtn").onclick = pause;

async function Unpause() {
    try{
    const tx = await tokenContract.unpause();
    await tx.wait();
    console.log("Unpaused:", tx.hash);
    }catch(error){
        console.error(error);
    }
} 
 document.getElementById("unPauseBtn").onclick = Unpause;

async function changeOwner() {
    
    const newOnwer = document.getElementById("newOwnerAddr").value;
    try{
    const tx = await tokenContract.transferOwnerShip(newOnwer);
    await tx.wait();
    console.log("Owner Changed", tx.hash);
    } catch(error){
        console.error(error);
    }
    
} document.getElementById("newOwnerBtn").onclick = changeOwner;