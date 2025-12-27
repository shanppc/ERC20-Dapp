// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ZToken{
string public name = "Zeeshan";
string public symbol = "Z";
uint8 public decimals = 18;
uint256 public totalSupply;
uint256 public constant maxSupply = 20000 * 10**18; 
address owner;
bool public paused;
bool public mintingFinished;
uint256 private pauseStartTime;
uint256 private lastUnpauseTime;

uint256 public constant maxPauseDuration = 7 days;
uint256 public constant pauseCooldown = 30 days;

mapping (address => uint256) public balances;
mapping (address => mapping(address => uint256)) public allowances;

event Transfer(address indexed from, address indexed to, uint256 value);
event Approval(address indexed owner, address indexed spender, uint256 value);
event MintFinished();

  modifier onlyOwner() {
    require(msg.sender==owner,"Not Owner");
    _;
  }

  modifier whenNotPaused(){
    require(!paused,"Token is Paused");
    _;
  }
constructor(uint256 _totalSupply){
    owner = msg.sender;
    _mint(msg.sender, _totalSupply * 10**18);}

    function _transfer(address _from, address _to, uint _amount) internal {
      require(_from != address(0), "From zero address");
      require(_to != address(0),"Can't send to zero address");
      require(balances[_from]>= _amount,"Not enough balance");
  
      balances[_from] -= _amount;
      balances[_to] += _amount;
      
      emit Transfer(_from, _to, _amount);
    }

   function transfer(address _to, uint256 _amount) external whenNotPaused returns(bool){
         _transfer(msg.sender, _to, _amount);
            return true;}

function balanceOf(address _address) external  view returns(uint256){
    return balances[_address];
}

    function _approve(address TokenOwner, address spender, uint256 amount) internal {
    require(TokenOwner != address(0), "can't Approve from zero");
    require(spender != address(0), "can't Approve to zero");

    allowances[TokenOwner][spender] = amount;
    emit Approval(TokenOwner, spender, amount);}

    function allowance(address _from, address spender) external view returns (uint256) {
    return allowances[_from][spender];
}


function approve(address _spender, uint256 _amount) external returns(bool){
    _approve(msg.sender, _spender, _amount);
          return true;}

     function increaseAllowance(address spender, uint256 addedValue) external {
      require(spender!= address(0), "Zero address");
      uint256 newAllowance = allowances[msg.sender][spender] + addedValue;
      allowances[msg.sender][spender] = newAllowance;

      emit Approval(msg.sender, spender, newAllowance);
     }      

     function decreaseAllowance(address spender, uint256 subtractedValue) external {
      require(spender != address(0),"Zero Address");

      uint256 currentAllowance = allowances[msg.sender][spender];
      require(currentAllowance>=subtractedValue,"Decreased below zero");

      uint256 newAllowance = currentAllowance - subtractedValue; 
      allowances[msg.sender][spender] = newAllowance;

      emit Approval(msg.sender, spender, newAllowance);}
   
    function transferFrom(address _from, address _to, uint256 _amount) external whenNotPaused returns(bool) {
      require(allowances[_from][msg.sender]>= _amount,"You don't have permission");
        allowances[_from][msg.sender] -= _amount;
        _transfer(_from, _to, _amount);

          return true;}

    function _mint(address _to, uint _amount) internal  {
      require(_to != address(0),"Cannot mint to zero address");
      require(totalSupply + _amount <= maxSupply,"Exceeds max supply");
      require(!mintingFinished,"Minting is finished");

      totalSupply += _amount;
      balances[_to] +=_amount;

        emit Transfer(address(0),_to, _amount);}
    

    function mint(address _to, uint256 _amount) external whenNotPaused onlyOwner {
          _mint(_to, _amount*10**18);}

    function finishMinting() external onlyOwner{
      mintingFinished =  true;

      emit MintFinished();} 


   function _burn(address from, uint256 amount) internal {
    require(from != address(0), "Burn from zero");
    require(balances[from] >= amount, "Burn exceeds balance");

    balances[from] -= amount;
    totalSupply -= amount;

    emit Transfer(from, address(0), amount);}

        function burn(uint256 _amount) external returns(bool){
          _burn(msg.sender, _amount);
          return true;}

  function pause() external onlyOwner whenNotPaused{
    require(block.timestamp>= lastUnpauseTime + pauseCooldown,"Cooldown period active");
    paused = true;
    pauseStartTime = block.timestamp;

  }  

  function unpause() external onlyOwner{
      require(paused, "Not paused");
    require(
        block.timestamp <= pauseStartTime + maxPauseDuration,
        "Pause expired"
    );
    paused = false;
    lastUnpauseTime = block.timestamp;
  }

 function transferOwnerShip(address newOwner) external {
   require(newOwner != address(0), "Zero address");
   owner = newOwner;}

  
}