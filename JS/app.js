import {ERC20_ABI} from "./abi.js";
let provider;
let signer;
let tokenContract;

const tokenAddress = "0xE44a188329Dd840c6c4aBe5646376FF2e67c091D";
const SEPOLIA_CHAIN_ID = '0xaa36a7';

//Wallet Connection
async function connectWallet() {
    if(!window.ethereum){
        alert ("Metamask not found");
        return;
    }
     
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
        loadTokenData();

    } catch (error) {
        console.error("Connection failed", error);
    }
}
        
async function loadTokenData(){ 

   document.getElementById("tokenName").innerText = await tokenContract.name();
   document.getElementById("tokenSymbol").innerText = await tokenContract.symbol();
   document.getElementById("tokenDecimals").innerText = (await tokenContract.decimals()).toString();

   const balance = await tokenContract.balanceOf(await signer.getAddress());
   document.getElementById("balance").innerText = 
   ethers.formatEther(balance);
}
     document.getElementById("connectBtn").onclick = connectWallet;
    
async function transfer() {
    const amountInTokens  = document.getElementById("amount").value;
    const address = document.getElementById("address").value ;

    const amountInBaseUnits  = ethers.parseUnits(amountInTokens, 18);
    try{
        const tx = await tokenContract.transfer(address, amountInBaseUnits);
        document.getElementById("txStatus").innerText =  "Sending Transaction....";
        await tx.wait();
        document.getElementById("txStatus").innerText = 
        `Transaction submitted: ${tx.hash}`;
        await loadTokenData()
        } catch (error){
           console.error("Transfer failed:", error);
           document.getElementById("txStatus").innerText = 
           "Transaction Failed. Check console for details.";

        }
} 
     document.getElementById("sendTxBtn").onclick = transfer;

   async function Approve() {
    const amountInTokens = document.getElementById("amountforSpender").value;
    const address = document.getElementById("spenderAddr").value;

    const amountInBaseUnits = ethers.parseUnits(amountInTokens, 18)
    try{
         const tx = await tokenContract.approve(address, amountInBaseUnits);
         console.log("Approved", tx.hash);    

     } catch(error){
        console.error(error);
     } 
    
    }  
 document.getElementById("approveBtn").onclick = Approve;
   
  async function checkAllowance() {
    const approverAddr = document.getElementById("approver").value;
    const spenderAdr = document.getElementById("spender").value;
try{
    const allowanceInBaseUnits = await tokenContract.allowance(approverAddr, spenderAdr);
    document.getElementById("allowance").innerText = ethers.formatUnits(allowanceInBaseUnits, 18);
    } catch (error){
        console.error(error);
    }
    }
    document.getElementById("allowanceBtn").onclick = checkAllowance;
    
    async function transferFrom() {
    const fromAddr = document.getElementById("_from").value;
    const toAddr = document.getElementById("_to").value;
    const amountInTokens = document.getElementById("_amount").value;

    const amountInBaseUnits = ethers.parseUnits(amountInTokens, 18);
   try{
    const tx = await tokenContract.transferFrom(fromAddr, toAddr, amountInBaseUnits);
    await tx.wait();
    console.log("Transaction Confirmed: ",tx.hash);
   } catch (error){
    console.error(error);
   }
}

document.getElementById("transferFromBtn").onclick = transferFrom;

async function Burn() {
    const amountInTokens = document.getElementById("burningAmount").value;
    const amountInBaseUnits = ethers.parseUnits(amountInTokens,18);
    try{
    const tx = await tokenContract.burn(amountInBaseUnits);
    tx.wait();
    console.log(`Burned: ${tx.hash}`);
     await loadTokenData(); // Update Burner balance
    }catch(error) {
        console.error(error);
    }
}
   document.getElementById("burnBTn").onclick = Burn;