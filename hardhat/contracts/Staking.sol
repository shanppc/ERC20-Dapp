// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
/*
* @title Staking contract
* @author Zeeshan  (x.com/zeeshanppc)
* @notice Manages ERC20 staking with linear reward distribution over time.
* @dev Uses the Synthetix algorithm to calculate rewards per token.
*/

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Staking is ReentrancyGuard{
    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;
    uint256 public rewardPerDay = 1e18; 
    uint256 public totalStakedTokens;
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;
    address public owner;

    mapping (address=> uint256) public stakeBalance;
    mapping (address=> uint256 ) public rewards;
    mapping (address=> uint256) public userRewardPerTokenPaid;

    event Stake(address indexed staker, uint256 amount);
    event UnStake(address indexed unStaker,uint256 amount);
    event RewardsClaimed(address indexed claimer, uint256 amount);

    constructor(address _stakingToken, address _rewardToken){
      owner = msg.sender;
       stakingToken = IERC20(_stakingToken);
       rewardToken = IERC20(_rewardToken);
       lastUpdateTime = block.timestamp;
       
    }

    modifier onlyOwner() {
      require(msg.sender==owner, "not Owner");
      _;
    }

    /*
    * @notice Calculates the total accumulated reward per 1 unit of staked token.
    * @return Cumulative reward per token based on time elapsed since last update.
    */ 
    function rewardPerToken() public view returns (uint256){
     if( totalStakedTokens == 0){
        return rewardPerTokenStored; }

        uint256 timeElapsed  = block.timestamp - lastUpdateTime;
       return rewardPerTokenStored + (timeElapsed * rewardPerDay * 1e18) / (1 days * totalStakedTokens);
       }

      /*
     * @notice Calculates the total rewards currently earned by a user.
     * @param account The address of the staker.
     */
       function earned(address account) public view returns(uint256){
       return  (stakeBalance[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18 + rewards[account];

       }

     /**
     * @dev Updates the global reward state and the specific user's reward balance.
     * Must be applied to all state-changing functions (stake, unstake, claim).
     */
       modifier updateReward(address account){
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        if(account != address(0)){
        rewards[account] = earned(account);
        userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
       }
     /*
     * @notice Deposits tokens into the contract to begin earning rewards
     * @param amount Quantity of tokens to stake.
     */
       function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount >0, "Can't stake 0");
        totalStakedTokens += amount;
        stakeBalance[msg.sender] += amount;
        
        bool success = stakingToken.transferFrom(msg.sender, address(this), amount);
        require(success,"transfer failed");

        emit Stake(msg.sender, amount);
        }
        
        function unStake(uint256 amount) external nonReentrant updateReward(msg.sender) {
            require(amount > 0, "Can't unStake 0");
            require(amount <=stakeBalance[msg.sender],"insufficient balance");
            totalStakedTokens -= amount;
            stakeBalance[msg.sender] -= amount;

            bool success = stakingToken.transfer(msg.sender, amount);
            require(success, "Transfer failed");

            emit UnStake(msg.sender, amount);
        } 

         // @notice Claims all pending reward tokens for the caller.
        function getReward() external nonReentrant updateReward(msg.sender) {
            uint256 reward = rewards[msg.sender];
            require(reward > 0, "No rewards to claim");
            rewards[msg.sender] = 0;

            bool success = rewardToken.transfer(msg.sender, reward);
            require(success, "Transfer failed");

            emit RewardsClaimed(msg.sender, reward);
            }

        /**
          * @notice Administrative function to change the daily reward emission.
          * @param _amount New daily reward rate. Must use _amounte18.
          */
        function setRewardPerDay(uint256 _amount) external onlyOwner updateReward(address(0)) {
          require(_amount > 0);
            rewardPerDay = _amount;
                }
        

}

