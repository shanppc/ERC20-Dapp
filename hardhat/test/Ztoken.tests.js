const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ZToken", function () {
  let zToken;
  let owner;
  let addr1;
  let addr2;

  const INITIAL_SUPPLY = ethers.parseUnits("6000", 18);
  const MAX_SUPPLY = ethers.parseUnits("40000", 18);

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const ZToken = await ethers.getContractFactory("ZToken");
    zToken = await ZToken.deploy(INITIAL_SUPPLY);
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await zToken.name()).to.equal("Zeeshan");
      expect(await zToken.symbol()).to.equal("Z");
    });

    it("Should set decimals to 18", async function () {
      expect(await zToken.decimals()).to.equal(18);
    });

    it("Should mint initial supply to owner", async function () {
      const ownerBalance = await zToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(INITIAL_SUPPLY);
    });

    it("Should set total supply correctly", async function () {
      expect(await zToken.totalSupply()).to.equal(INITIAL_SUPPLY);
    });

    it("Should set owner correctly", async function () {
      expect(await zToken.owner()).to.equal(owner.address);
    });
  });

  describe("Transfer", function () {
    it("Should transfer tokens between accounts", async function () {
      const amount = ethers.parseUnits("100", 18);

      await zToken.transfer(addr1.address, amount);
      expect(await zToken.balanceOf(addr1.address)).to.equal(amount);

      const ownerBalance = await zToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(INITIAL_SUPPLY - amount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const amount = ethers.parseUnits("1", 18);

      await expect(
        zToken.connect(addr1).transfer(owner.address, amount)
      ).to.be.revertedWith("Not enough balance");
    });

    it("Should fail transfer to zero address", async function () {
      const amount = ethers.parseUnits("100", 18);

      await expect(
        zToken.transfer(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("Can't send to zero address");
    });

    it("Should emit Transfer event", async function () {
      const amount = ethers.parseUnits("50", 18);

      await expect(zToken.transfer(addr1.address, amount))
        .to.emit(zToken, "Transfer")
        .withArgs(owner.address, addr1.address, amount);
    });
  });

  describe("Approve and TransferFrom", function () {
    it("Should approve tokens for delegation", async function () {
      const amount = ethers.parseUnits("100", 18);

      await zToken.approve(addr1.address, amount);
      expect(await zToken.allowance(owner.address, addr1.address)).to.equal(amount);
    });

    it("Should allow transferFrom with approval", async function () {
      const amount = ethers.parseUnits("100", 18);

      await zToken.approve(addr1.address, amount);
      await zToken.connect(addr1).transferFrom(owner.address, addr2.address, amount);

      expect(await zToken.balanceOf(addr2.address)).to.equal(amount);
      expect(await zToken.allowance(owner.address, addr1.address)).to.equal(0);
    });

    it("Should fail transferFrom without approval", async function () {
      const amount = ethers.parseUnits("100", 18);

      await expect(
        zToken.connect(addr1).transferFrom(owner.address, addr2.address, amount)
      ).to.be.revertedWith("Insufficient allowance");
    });

    it("Should emit Approval event", async function () {
      const amount = ethers.parseUnits("100", 18);

      await expect(zToken.approve(addr1.address, amount))
        .to.emit(zToken, "Approval")
        .withArgs(owner.address, addr1.address, amount);
    });
  });

  describe("IncreaseAllowance and DecreaseAllowance", function () {
    it("Should increase allowance", async function () {
      const initial = ethers.parseUnits("100", 18);
      const increase = ethers.parseUnits("50", 18);

      await zToken.approve(addr1.address, initial);
      await zToken.increaseAllowance(addr1.address, increase);

      expect(await zToken.allowance(owner.address, addr1.address)).to.equal(initial + increase);
    });

    it("Should decrease allowance", async function () {
      const initial = ethers.parseUnits("100", 18);
      const decrease = ethers.parseUnits("30", 18);

      await zToken.approve(addr1.address, initial);
      await zToken.decreaseAllowance(addr1.address, decrease);

      expect(await zToken.allowance(owner.address, addr1.address)).to.equal(initial - decrease);
    });

    it("Should fail to decrease allowance below zero", async function () {
      const initial = ethers.parseUnits("50", 18);
      const decrease = ethers.parseUnits("100", 18);

      await zToken.approve(addr1.address, initial);

      await expect(
        zToken.decreaseAllowance(addr1.address, decrease)
      ).to.be.revertedWith("Decreased below zero");
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const amount = ethers.parseUnits("1000", 18);

      await zToken.mint(addr1.address, amount);
      expect(await zToken.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should fail if non-owner tries to mint", async function () {
      const amount = ethers.parseUnits("1000", 18);

      await expect(
        zToken.connect(addr1).mint(addr2.address, amount)
      ).to.be.revertedWith("Not Owner");
    });

    it("Should fail if minting exceeds max supply", async function () {
      const amount = ethers.parseUnits("35000", 18); // Would exceed 40000 max

      await expect(
        zToken.mint(addr1.address, amount)
      ).to.be.revertedWith("Exceeds max supply");
    });

    it("Should fail if minting is finished", async function () {
      await zToken.finishMinting();
      const amount = ethers.parseUnits("100", 18);

      await expect(
        zToken.mint(addr1.address, amount)
      ).to.be.revertedWith("Minting is finished");
    });

    it("Should emit MintFinished event", async function () {
      await expect(zToken.finishMinting())
        .to.emit(zToken, "MintFinished");
    });
  });

  describe("Burning", function () {
    it("Should allow users to burn their tokens", async function () {
      const amount = ethers.parseUnits("100", 18);

      const initialSupply = await zToken.totalSupply();
      await zToken.burn(amount);

      expect(await zToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - amount);
      expect(await zToken.totalSupply()).to.equal(initialSupply - amount);
    });

    it("Should fail if user doesn't have enough tokens to burn", async function () {
      const amount = ethers.parseUnits("1", 18);

      await expect(
        zToken.connect(addr1).burn(amount)
      ).to.be.revertedWith("Burn exceeds balance");
    });

    it("Should emit Transfer event to zero address", async function () {
      const amount = ethers.parseUnits("100", 18);

      await expect(zToken.burn(amount))
        .to.emit(zToken, "Transfer")
        .withArgs(owner.address, ethers.ZeroAddress, amount);
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow owner to pause", async function () {
      await zToken.pause();
      expect(await zToken.paused()).to.equal(true);
    });

    it("Should emit Paused event", async function () {
      await expect(zToken.pause())
        .to.emit(zToken, "Paused");
    });

    it("Should block transfers when paused", async function () {
      await zToken.pause();
      const amount = ethers.parseUnits("100", 18);

      await expect(
        zToken.transfer(addr1.address, amount)
      ).to.be.revertedWith("Token is Paused");
    });

    it("Should allow owner to unpause", async function () {
      await zToken.pause();
      await zToken.unpause();
      expect(await zToken.paused()).to.equal(false);
    });

    it("Should emit Unpaused event", async function () {
      await zToken.pause();
      await expect(zToken.unpause())
        .to.emit(zToken, "Unpaused");
    });

    it("Should enforce cooldown period between pauses", async function () {
      await zToken.pause();
      await zToken.unpause();

      await expect(zToken.pause()).to.be.revertedWith("Cooldown period active");
    });

    it("Should allow pause after cooldown period", async function () {
      await zToken.pause();
      await zToken.unpause();

      // Advance time by 30 days + 1 second
      await time.increase(30 * 24 * 60 * 60 + 1);

      await expect(zToken.pause()).to.not.be.reverted;
    });

    it("Should fail if non-owner tries to pause", async function () {
      await expect(
        zToken.connect(addr1).pause()
      ).to.be.revertedWith("Not Owner");
    });
  });

  describe("Ownership", function () {
    it("Should transfer ownership", async function () {
      await zToken.transferOwnership(addr1.address);
      expect(await zToken.owner()).to.equal(addr1.address);
    });

    it("Should emit OwnershipTransferred event", async function () {
      await expect(zToken.transferOwnership(addr1.address))
        .to.emit(zToken, "OwnershipTransferred")
        .withArgs(owner.address, addr1.address);
    });

    it("Should fail to transfer to zero address", async function () {
      await expect(
        zToken.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("Zero address");
    });

    it("Should fail if non-owner tries to transfer ownership", async function () {
      await expect(
        zToken.connect(addr1).transferOwnership(addr2.address)
      ).to.be.revertedWith("Not Owner");
    });
  });

  describe("Helper Functions", function () {
    it("Should return correct cooldown time remaining", async function () {
      await zToken.pause();
      await zToken.unpause();

      const remaining = await zToken.cooldownTimeRemaining();
      expect(remaining).to.be.gt(0);
    });

    it("Should return 0 cooldown when paused", async function () {
      await zToken.pause();
      expect(await zToken.cooldownTimeRemaining()).to.equal(0);
    });

    it("Should return correct pause time remaining", async function () {
      await zToken.pause();
      const remaining = await zToken.pauseTimeRemaining();
      expect(remaining).to.be.gt(0);
    });

    it("Should return 0 pause time when not paused", async function () {
      expect(await zToken.pauseTimeRemaining()).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amount transfers", async function () {
      await expect(
        zToken.transfer(addr1.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should handle multiple sequential transfers", async function () {
      const amount = ethers.parseUnits("100", 18);

      await zToken.transfer(addr1.address, amount);
      await zToken.connect(addr1).transfer(addr2.address, amount);

      expect(await zToken.balanceOf(addr2.address)).to.equal(amount);
      expect(await zToken.balanceOf(addr1.address)).to.equal(0);
    });

    it("Should handle approve and transferFrom chain", async function () {
      const amount = ethers.parseUnits("100", 18);

      // Owner approves addr1
      await zToken.approve(addr1.address, amount);

      // addr1 transfers to addr2
      await zToken.connect(addr1).transferFrom(owner.address, addr2.address, amount);

      expect(await zToken.balanceOf(addr2.address)).to.equal(amount);
    });
  });
});