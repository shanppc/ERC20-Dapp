// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract stZ is ERC20 {
    constructor(uint256 initialSupply) ERC20("stZeeshan", "stZ") {
        _mint(msg.sender, initialSupply);
    }
    function decimals() public view virtual override returns (uint8) {
  return 18;
}
    
} 