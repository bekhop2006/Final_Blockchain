// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RewardToken
 * @dev ERC20 бонусные токены за оплату доставки. Минтятся при contribute() в DeliveryCrowdfund.
 */
contract RewardToken is ERC20, Ownable {
    constructor() ERC20("Crypto Delivery Reward", "CDR") Ownable(msg.sender) {}

    /**
     * @dev Минт токенов награды (вызывается только контрактом доставки).
     * @param to получатель
     * @param amount количество токенов (пропорционально сумме оплаты)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
