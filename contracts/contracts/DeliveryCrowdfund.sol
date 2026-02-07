// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RewardToken.sol";
import "./CashbackNFT.sol";

/**
 * @title DeliveryCrowdfund
 * @dev Основной контракт: кампания = заказ на доставку. contribute() = оплата, начисление ERC20 и минт NFT кэшбека.
 */
contract DeliveryCrowdfund {
    RewardToken public rewardToken;
    CashbackNFT public cashbackNFT;

    enum CampaignStatus {
        Active,
        Ended,
        Success,
        Failed
    }

    struct Campaign {
        uint256 id;
        string title;
        uint256 goal;           // цель в wei (сумма заказа)
        uint256 deadline;
        uint256 totalContributed;
        CampaignStatus status;
        address creator;
        mapping(address => uint256) contributions;
    }

    Campaign[] private campaigns;
    mapping(uint256 => address) public campaignCreator;

    event CampaignCreated(uint256 indexed campaignId, string title, uint256 goal, uint256 deadline, address creator);
    event Contributed(uint256 indexed campaignId, address contributor, uint256 amount, uint256 rewardMinted, uint256 nftTokenId);
    event CampaignFinalized(uint256 indexed campaignId, CampaignStatus status);
    event Refunded(uint256 indexed campaignId, address contributor, uint256 amount);

    constructor(address _rewardToken, address _cashbackNFT) {
        rewardToken = RewardToken(_rewardToken);
        cashbackNFT = CashbackNFT(_cashbackNFT);
    }

    function createCampaign(string calldata title, uint256 goal, uint256 deadline) external returns (uint256) {
        require(deadline > block.timestamp, "Deadline must be in future");
        require(goal > 0, "Goal must be > 0");

        uint256 id = campaigns.length;
        campaigns.push();
        Campaign storage c = campaigns[id];
        c.id = id;
        c.title = title;
        c.goal = goal;
        c.deadline = deadline;
        c.totalContributed = 0;
        c.status = CampaignStatus.Active;
        c.creator = msg.sender;
        campaignCreator[id] = msg.sender;

        emit CampaignCreated(id, title, goal, deadline, msg.sender);
        return id;
    }

    function contribute(uint256 campaignId) external payable {
        Campaign storage c = campaigns[campaignId];
        require(c.status == CampaignStatus.Active, "Campaign not active");
        require(block.timestamp < c.deadline, "Campaign ended");
        require(msg.value > 0, "Must send ETH");

        c.contributions[msg.sender] += msg.value;
        c.totalContributed += msg.value;

        // Начисление бонусных токенов CDR: 15% от суммы заказа
        uint256 rewardAmount = (msg.value * 15) / 100;
        rewardToken.mint(msg.sender, rewardAmount);

        // NFT кэшбек: < 0.1 ETH -> 1%, >= 0.1 ETH -> 3%, >= 0.5 ETH -> 5%
        uint8 percent = 1;
        if (msg.value >= 0.5 ether) percent = 5;
        else if (msg.value >= 0.1 ether) percent = 3;
        uint256 nftId = cashbackNFT.mint(msg.sender, percent);

        emit Contributed(campaignId, msg.sender, msg.value, rewardAmount, nftId);
    }

    function finalize(uint256 campaignId) external {
        Campaign storage c = campaigns[campaignId];
        require(c.status == CampaignStatus.Active, "Already finalized");
        require(block.timestamp >= c.deadline, "Deadline not reached");
        require(msg.sender == c.creator, "Only creator");

        if (c.totalContributed >= c.goal) {
            c.status = CampaignStatus.Success;
            (bool sent,) = c.creator.call{value: c.totalContributed}("");
            require(sent, "Transfer failed");
        } else {
            c.status = CampaignStatus.Failed;
        }
        emit CampaignFinalized(campaignId, c.status);
    }

    function refund(uint256 campaignId) external {
        Campaign storage c = campaigns[campaignId];
        require(c.status == CampaignStatus.Failed, "Not failed");
        uint256 amount = c.contributions[msg.sender];
        require(amount > 0, "Nothing to refund");

        c.contributions[msg.sender] = 0;
        (bool sent,) = msg.sender.call{value: amount}("");
        require(sent, "Refund failed");
        emit Refunded(campaignId, msg.sender, amount);
    }

    function getCampaign(uint256 campaignId) external view returns (
        uint256 id,
        string memory title,
        uint256 goal,
        uint256 deadline,
        uint256 totalContributed,
        CampaignStatus status,
        address creator
    ) {
        Campaign storage c = campaigns[campaignId];
        return (c.id, c.title, c.goal, c.deadline, c.totalContributed, c.status, c.creator);
    }

    function getContribution(uint256 campaignId, address user) external view returns (uint256) {
        return campaigns[campaignId].contributions[user];
    }

    function getCampaignCount() external view returns (uint256) {
        return campaigns.length;
    }
}
