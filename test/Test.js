const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT Market", async function () {

  let address1;
  let address2;
  let marketplace;
  let nft;
  let marketplaceContract;
  let nftContract;

  let auctionPrice = ethers.utils.parseUnits('0.00001', 'ether')
  let tok = ethers.utils.parseUnits('10', 'ether')
  beforeEach(async function () {

    [address1, address2] = await ethers.getSigners();
    tokens = await ethers.getContractFactory("Token");
    tokenContract = await tokens.deploy();
    let addr = tokenContract.address
    marketplace = await ethers.getContractFactory("NFTMarket");
    marketplaceContract = await marketplace.deploy(addr);

    nft = await ethers.getContractFactory("NFT");
    nftContract = await nft.deploy();

    await tokenContract.connect(address1).mint(address2.address, tok)

  })

  describe("Deployment Test", async function () {
    it(`Coin symbol must be TKC`, async function () {
      expect(await tokenContract.symbol()).to.equal("TKC");
    })
    it(`Coin name must be equal to Trikon Coin`, async function () {
      expect(await tokenContract.name()).to.equal("Trikon Coin");
    })
    it(`NFT symbol must be TKNFT`, async function () {
      expect(await nftContract.symbol()).to.equal("NFT");
    })
    it(`NFT name must be equal to Trikon NFT`, async function () {
      expect(await nftContract.name()).to.equal("Trikon NFT");
    })

  })

  describe("Mint and List NFT", async function () {

    it(`List NFT in marketplace`, async function () {

      const listedNft = await marketplaceContract.connect(address1).sellItem("Token URI", auctionPrice, nftContract.address);

      const event = await listedNft.wait();
      expect(event.events.length).to.equal(4);
      expect(event.events[3].event).to.equal("Item");
      expect(event.events[3].args.nftContract).to.equal(nftContract.address);
      expect(event.events[3].args.owner).to.equal(marketplaceContract.address);
      expect(event.events[3].args.creator).to.equal(address1.address);
      expect(event.events[3].args.token).to.equal(1);
      expect(event.events[3].args.price).to.equal(auctionPrice);
    })

    it("Should fail if listing price less then equal to zero ", async () => {
      await expect(marketplaceContract.connect(address1).sellItem("Token URI", 0, nftContract.address)).to.be.revertedWith('Price must be at least 1 wei');
    })
  })

  describe("Cancel NFT sell & Buy NFT", async function () {
    it(`Buy NFT`, async function () {

      await marketplaceContract.connect(address1).sellItem("Token URI", auctionPrice, nftContract.address);
      await tokenContract.connect(address2).increaseAllowance(marketplaceContract.address, auctionPrice);
      let NFTSold = await marketplaceContract.connect(address2).buyItem(1)
      const event = await NFTSold.wait();

      expect(event.events.length).to.equal(4);
      expect(event.events[3].event).to.equal("Sold");
      expect(event.events[3].args.nftContract).to.equal(nftContract.address);
      expect(event.events[3].args.owner).to.equal(address2.address);
      expect(event.events[3].args.creator).to.equal(address1.address);
      expect(event.events[3].args.token).to.equal(1);
      expect(event.events[3].args.price).to.equal(auctionPrice);

    })

    it(`Cancel NFT`, async function () {
      await marketplaceContract.connect(address1).sellItem("Token URI", auctionPrice, nftContract.address);

      const getNft = await marketplaceContract.Items(1)

      let sellCancel = await marketplaceContract.connect(address1).cancelSell(1)
      const event = await sellCancel.wait();

      expect(event.events.length).to.equal(2);
      expect(event.events[1].event).to.equal("CancelSell");
      expect(event.events[1].args.token).to.equal(1);
      expect(event.events[1].args.owner).to.equal(getNft.owner);
    })

    it("Should fail if allowance is not greater than or equal to NFT price ", async () => {
      await marketplaceContract.connect(address1).sellItem("Token URI", auctionPrice, nftContract.address);

      await expect(marketplaceContract.connect(address2).buyItem(1)).to.be.revertedWith('insufficient balance');
    })

    it("Should fail if someone else cancel the sell ", async () => {
      await marketplaceContract.connect(address1).sellItem("Token URI", auctionPrice, nftContract.address);

      await expect(marketplaceContract.connect(address2).cancelSell(1)).to.be.revertedWith("Only owner can cancel listing");
    })

  })

  describe("Read Data", async function () {
    it(`Items count`, async function () {

      await marketplaceContract.connect(address1).sellItem("Token URI", auctionPrice, nftContract.address);
      await marketplaceContract.connect(address1).sellItem("Token URI", auctionPrice, nftContract.address);
      await marketplaceContract.connect(address1).sellItem("Token URI", auctionPrice, nftContract.address);
      await marketplaceContract.connect(address1).sellItem("Token URI", auctionPrice, nftContract.address);

      const list = await marketplaceContract.connect(address1).fetchMarketItems();
      // console.log(list)
      expect(list.length).to.equal(4);

    })

    it(`Is Item Active`, async function () {
      await marketplaceContract.connect(address1).sellItem("Token URI", auctionPrice, nftContract.address);
      const data = await marketplaceContract.connect(address1).isActive(1);
      // console.log(data)
      expect(data).to.equal(true);
    })

    it(`Is Item creator`, async function () {
      await marketplaceContract.connect(address1).sellItem("Token URI", auctionPrice, nftContract.address);
      const data = await marketplaceContract.connect(address1).isCreator(1, address1.address);
      // console.log(data)
      expect(data).to.equal(true);
    })

    it(`Check Item price is equal!`, async function () {
      await marketplaceContract.connect(address1).sellItem("Token URI", auctionPrice, nftContract.address);
      const data = await marketplaceContract.connect(address1).itemPrice(1);
      // console.log(data)
      expect(data).to.equal(auctionPrice);
    })
  })
});