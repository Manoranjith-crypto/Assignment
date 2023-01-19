//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./NFT.sol";

interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `from` to `to` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}

contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemId;
    Counters.Counter private _itemsSold;

    address owner;
    address PayToken;
    uint256 public mintingCost = 0.0001 ether;

    constructor(address _payToken) {
        owner = msg.sender;
        PayToken = _payToken;
    }

    enum ListingStatus {
        Active,
        Sold,
        Cancelled
    }

    struct _Item {
        ListingStatus status;
        address nftContract;
        address owner;
        address creator;
        uint256 token;
        uint256 price;
    }

    event Item(
        address nftContract,
        address owner,
        address creator,
        uint256 token,
        uint256 price
    );

    event CancelSell(uint256 token, address owner);

    event Sold(
        address nftContract,
        address owner,
        address creator,
        uint256 token,
        uint256 price
    );

    mapping(uint => _Item) public Items;

    function sellItem(
        string memory uri,
        uint256 _price,
        address _nftContract
    ) public nonReentrant {
        require(_price > 0, "Price must be at least 1 wei");

        _itemId.increment();
        uint256 itemId = _itemId.current();

        uint256 _tokenId = NFT(_nftContract).safeMint(
            uri,
            address(this),
            msg.sender
        );

        Items[itemId] = _Item(
            ListingStatus.Active,
            _nftContract,
            address(this),
            msg.sender,
            _tokenId,
            _price
        );

        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);

        emit Item(_nftContract, address(this), msg.sender, _tokenId, _price);
    }

    function cancelSell(uint256 __itemId) public {
        _Item storage listedItem = Items[__itemId];
        require(
            msg.sender == listedItem.owner || msg.sender == listedItem.creator,
            "Only owner can cancel listing"
        );
        require(
            listedItem.status == ListingStatus.Active,
            "Listing is not active"
        );

        listedItem.status = ListingStatus.Cancelled;
        IERC721(listedItem.nftContract).transferFrom(
            address(this),
            msg.sender,
            listedItem.token
        );

        emit CancelSell(listedItem.token, listedItem.owner);
    }

    function buyItem(uint256 __itemId) public nonReentrant {
        _Item storage listedItem = Items[__itemId];
        uint _tokenBalance = IERC20(PayToken).allowance(
            msg.sender,
            address(this)
        );
        require(
            listedItem.status == ListingStatus.Active,
            "Listing is not active"
        );
        require(listedItem.price <= _tokenBalance, "insufficient balance");

        //Update the owner & status
        listedItem.owner = msg.sender;
        listedItem.status = ListingStatus.Sold;

        //Pay owner of the NFT
        address ownerAddress = listedItem.creator;
        if (listedItem.owner == address(0)) {
            ownerAddress = listedItem.owner;
        }

        IERC20(PayToken).transferFrom(
            msg.sender,
            ownerAddress,
            listedItem.price
        );

        //Tranfer NFT to the new owner
        _itemsSold.increment();
        IERC721(listedItem.nftContract).transferFrom(
            address(this),
            msg.sender,
            listedItem.token
        );

        emit Sold(
            listedItem.nftContract,
            msg.sender,
            listedItem.creator,
            listedItem.token,
            listedItem.price
        );
    }

    function fetchMarketItems() public view returns (_Item[] memory) {
      uint itemCount = _itemId.current();
      uint unsoldItemCount = _itemId.current() - _itemsSold.current();
      uint currentIndex = 0;

      _Item[] memory items = new _Item[](unsoldItemCount);
      for (uint i = 0; i < itemCount; i++) {
        if (Items[i + 1].owner == address(this)) {
          uint currentId = i + 1;
          _Item storage currentItem = Items[currentId];
          items[currentIndex] = currentItem;
          currentIndex += 1;
        }
      }
      return items;
    }

    function isActive(uint256 __itemId) public view returns (bool result){
        _Item memory listedItem = Items[__itemId]; 
        if(listedItem.status == ListingStatus.Active){
            result = true;
        }
        return result;
    }

    function isCreator(uint256 __itemId, address user) public view returns (bool result){
        _Item memory listedItem = Items[__itemId]; 
        if(listedItem.creator == user){
            result = true;
        }
        return result;
    }

    function itemPrice(uint256 __itemId) public view returns (uint){
        _Item memory listedItem = Items[__itemId]; 
        return listedItem.price;
    }
}
