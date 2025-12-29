export const ERC20_ABI = [
    "function name() view returns(string)",
    "function symbol() view returns(string)",
    "function decimals() view returns(uint8)",
    "function balanceOf(address) view returns(uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address _from, address spender) view returns(uint256)",
    "function transferFrom(address _from, address _to, uint256 amount) returns(bool)",
    "function burn(uint256) returns (bool)",
    "function mint(address _to, uint256 _amount)",
    "function pause() returns(bool)",
    "function unpause() returns(bool)",
    "function transferOwnerShip(address newOnwer)"
];