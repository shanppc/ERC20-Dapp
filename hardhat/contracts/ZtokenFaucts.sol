// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address _to, uint256 _value) external returns (bool success);
    function balanceOf(address _address) external view returns(uint256);
}

contract ZTokenFaucet { 
    IERC20 public immutable token; 
    address public immutable owner;
    uint256 public faucetAmount = 20 * (10**18); 
    bool public paused;

    mapping(address => uint256) public lastClaim;

    
    event TokensRequested(address indexed requester, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _ ;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _ ;
    }

    constructor(address tokenAdd) {
        owner = msg.sender;
        token = IERC20(tokenAdd);
    }

    function requestTokens() external whenNotPaused {
        require(block.timestamp >= lastClaim[msg.sender] + 1 days, "Wait 24 hours between claims");
        require(token.balanceOf(address(this)) >= faucetAmount, "Faucet is empty");

        lastClaim[msg.sender] = block.timestamp;
        
        bool success = token.transfer(msg.sender, faucetAmount);
        require(success, "Transfer failed");

        emit TokensRequested(msg.sender, faucetAmount);
    }

    
    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }

    function withdrawRemainingTokens() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        token.transfer(owner, balance);
    }

}