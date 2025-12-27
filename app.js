import {ERC20_ABI} from "./abi.js";
let provider;
let signer;
const tokenAddress = "0x71B0Cf1Fa252787818F692e136bc91C99855a059";

async function connectWallet() {
    if(!window.ethereum){
        alert ("Metamask not found");
        return;
    }
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();

    const address = await signer.getAddress();
    document.getElementById("account").innerText = address;
        loadTokenData();}
        

async function loadTokenData(){ 
let token = new ethers.Contract(tokenAddress, ERC20_ABI, provider); 

   document.getElementById("tokenName").innerText = await token.name();
   document.getElementById("tokenSymbol").innerText = await token.symbol();
   document.getElementById("tokenDecimals").innerText = (await token.decimals()).toString();

   const balance = await token.balanceOf(await signer.getAddress());
   document.getElementById("balance").innerText = 
   ethers.formatEther(balance);
}
     document.getElementById("connectBtn").onclick = connectWallet;
    
async function transfer() {
    const amountToTransfer  = document.getElementById("amount").value;
    const address =document.getElementById("address").value ;
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI,signer);

    const amount = ethers.parseUnits(amountToTransfer, 18);
    try{
        const tx = await tokenContract.transfer(address, amount);
        document.getElementById("txStatus").innerText =  "Sending Transaction....";
        await tx.wait();
        document.getElementById("txStatus").innerText = 
        `Transaction submitted: ${tx.hash}`;
        } catch (error){
           console.error("Transfer failed:", error);
           document.getElementById("txStatus").innerText = 
           "Transaction Failed. Check console for details.";

        }
} 
     document.getElementById("sendTxBtn").onclick = transfer;

   async function Approve() {
    const amountToApprove = document.getElementById("amountforSpender").value;
    const address = document.getElementById("spenderAddr").value;
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI,signer);

    const amount = ethers.parseUnits(amountToApprove, 18)
    try{
         const tx = await tokenContract.approve(address, amount);
         console.log("Approved", tx.hash);    
     } catch(error){
        console.error(error);
     } 
    
    }  
 document.getElementById("approveBtn").onclick = Approve;
   
  async function checkAllowance() {
     let token = new ethers.Contract(tokenAddress, ERC20_ABI, provider); 
    const approverAddr = document.getElementById("approver").value;
    const spenderAdr = document.getElementById("spender").value;
try{
    const allowanceAmount = await token.allowance(approverAddr, spenderAdr);
    document.getElementById("allowance").innerText = ethers.formatUnits(allowanceAmount, 18);
    } catch (error){
        console.error(error);
    }
    }
    document.getElementById("allowanceBtn").onclick = checkAllowance;