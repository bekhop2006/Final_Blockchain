// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CashbackNFT
 * @dev ERC721 NFT-кэшбек. Выдаётся при каждом заказе, хранит процент кэшбека.
 */
contract CashbackNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    // tokenId => cashback percent (1 = 1%, 3 = 3%, 5 = 5%)
    mapping(uint256 => uint8) public cashbackPercent;

    event Minted(address indexed to, uint256 indexed tokenId, uint8 percent);

    constructor() ERC721("Crypto Delivery Cashback", "CDCB") Ownable(msg.sender) {}

    /**
     * @dev Минт NFT кэшбека (вызывается только контрактом доставки).
     * @param to получатель
     * @param percent процент кэшбека (1, 3 или 5)
     */
    function mint(address to, uint8 percent) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        cashbackPercent[tokenId] = percent;
        _safeMint(to, tokenId);
        emit Minted(to, tokenId, percent);
        return tokenId;
    }
}
