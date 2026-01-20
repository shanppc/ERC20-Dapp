// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "ZToken.sol";


contract ZTokenSale{
address immutable owner;
uint256 public rate;
bool public isSaleActive;
ZToken public token;
uint256 public tokenSold;

constructor(address _token, uint256 _rate) {
  owner = msg.sender;
  token = ZToken(_token);
  rate = _rate;
  isSaleActive = true;
}

modifier onlyOwner(){
require(msg.sender== owner,"Not Owner");
_;
}
function buyTokens() payable external {
    require(isSaleActive,"Sale Ended");
    require(msg.value> 0, "Amount > 0");
    uint256 tokenAmount = msg.value * rate;

    require(token.balanceOf(address(this))>= tokenAmount, "Insufficient Token balance");
    tokenSold += tokenAmount;
    token.transfer(msg.sender, tokenAmount);
}

function endSale() onlyOwner external {
    isSaleActive = false;
}

 function withdraw() onlyOwner external{
   uint256 balance = address(this).balance;
   require(balance>0,"0 Eth");
    (bool success, ) = msg.sender.call{value: balance}("");
    require(success, "Transfer failed.");

 } 
}