// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ZToken
 * @notice ERC20 token with pause functionality and minting controls
 * @dev Use ethers.parseUnits() in frontend - NO multiplication in contract
 */
contract ZToken {
    string public name = "Zeeshan";
    string public symbol = "Z";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    uint256 public constant maxSupply = 40000 * 10**18; 
    address public owner;
    bool public paused;
    bool public mintingFinished;
    uint256 private pauseStartTime;
    uint256 private lastUnpauseTime;

    uint256 public constant maxPauseDuration = 7 days;
    uint256 public constant pauseCooldown = 30 days;

    mapping (address => uint256) private balances;
    mapping (address => mapping(address => uint256)) private allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event MintFinished();
    event Paused(address indexed by, uint256 timestamp);
    event Unpaused(address indexed by, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not Owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Token is Paused");
        _;
    }

    // @dev Constructor - NO multiplication here
    constructor(uint256 _totalSupply) {
        owner = msg.sender;
        lastUnpauseTime = block.timestamp;
        _mint(msg.sender, _totalSupply); 
    }

    function _transfer(address _from, address _to, uint _amount) internal {
        require(_from != address(0), "From zero address");
        require(_to != address(0), "Can't send to zero address");
        require(_amount > 0, "Amount must be greater than zero");
        require(balances[_from] >= _amount, "Not enough balance");
  
        balances[_from] -= _amount;
        balances[_to] += _amount;
      
        emit Transfer(_from, _to, _amount);
    }


      //@dev Transfer tokens - NO multiplication
    function transfer(address _to, uint256 _amount) external whenNotPaused returns(bool) {
        _transfer(msg.sender, _to, _amount);
        return true;
    }

    function balanceOf(address _address) external view returns(uint256) {
        return balances[_address];
    }

    function _approve(address tokenOwner, address spender, uint256 amount) internal {
        require(tokenOwner != address(0), "Can't approve from zero");
        require(spender != address(0), "Can't approve to zero");

        allowances[tokenOwner][spender] = amount;
        emit Approval(tokenOwner, spender, amount);
    }

    function allowance(address _from, address spender) external view returns (uint256) {
        return allowances[_from][spender];
    }

    
     // @dev Approve tokens - NO multiplication
    function approve(address _spender, uint256 _amount) external returns(bool) {
        _approve(msg.sender, _spender, _amount);
        return true;
    }

    //@dev Increase allowance - NO multiplication
    function increaseAllowance(address spender, uint256 addedValue) external returns(bool) {
        require(spender != address(0), "Zero address");
        
        uint256 newAllowance = allowances[msg.sender][spender] + addedValue;
        _approve(msg.sender, spender, newAllowance);
        
        return true;
    }

    // @dev Decrease allowance - NO multiplication
    function decreaseAllowance(address spender, uint256 subtractedValue) external returns(bool) {
        require(spender != address(0), "Zero Address");

        uint256 currentAllowance = allowances[msg.sender][spender];
        require(currentAllowance >= subtractedValue, "Decreased below zero");

        uint256 newAllowance = currentAllowance - subtractedValue; 
        _approve(msg.sender, spender, newAllowance);
        
        return true;
    }

    // @dev Transfer from - NO multiplication
    function transferFrom(address _from, address _to, uint256 _amount) external whenNotPaused returns(bool) {
        require(_amount > 0, "Amount must be greater than zero");
        require(allowances[_from][msg.sender] >= _amount, "Insufficient allowance");
        
        allowances[_from][msg.sender] -= _amount;
        _transfer(_from, _to, _amount);

        return true;
    }

    function _mint(address _to, uint _amount) internal {
        require(_to != address(0), "Cannot mint to zero address");
        require(_amount > 0, "Amount must be greater than zero");
        require(totalSupply + _amount <= maxSupply, "Exceeds max supply");
        require(!mintingFinished, "Minting is finished");

        totalSupply += _amount;
        balances[_to] += _amount;

        emit Transfer(address(0), _to, _amount);
    }

    // @dev Mint tokens - NO multiplication
    function mint(address _to, uint256 _amount) external whenNotPaused onlyOwner {
        _mint(_to, _amount);
    }

    function finishMinting() external onlyOwner {
        require(!mintingFinished, "Minting already finished");
        mintingFinished = true;

        emit MintFinished();
    }

    function _burn(address from, uint256 amount) internal {
        require(from != address(0), "Burn from zero");
        require(amount > 0, "Amount must be greater than zero");
        require(balances[from] >= amount, "Burn exceeds balance");

        balances[from] -= amount;
        totalSupply -= amount;

        emit Transfer(from, address(0), amount);
    }

    // @dev Burn tokens - NO multiplication

    function burn(uint256 _amount) external whenNotPaused returns(bool) {
        _burn(msg.sender, _amount);
        return true;
    }

    function pause() external onlyOwner whenNotPaused {
        require(block.timestamp >= lastUnpauseTime + pauseCooldown, "Cooldown period active");
        
        paused = true;
        pauseStartTime = block.timestamp;
        
        emit Paused(msg.sender, block.timestamp);
    }

    function unpause() external onlyOwner {
        require(paused, "Not paused");
        
        paused = false;
        lastUnpauseTime = block.timestamp;
        
        emit Unpaused(msg.sender, block.timestamp);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        
        address previousOwner = owner;
        owner = newOwner;
        
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    function cooldownTimeRemaining() external view returns (uint256) {
        if (paused) return 0;
        
        uint256 nextPauseTime = lastUnpauseTime + pauseCooldown;
        if (block.timestamp >= nextPauseTime) return 0;
        
        return nextPauseTime - block.timestamp;
    }

    function pauseTimeRemaining() external view returns (uint256) {
        if (!paused) return 0;
        
        uint256 pauseEndTime = pauseStartTime + maxPauseDuration;
        if (block.timestamp >= pauseEndTime) return 0;
        
        return pauseEndTime - block.timestamp;
    }
}