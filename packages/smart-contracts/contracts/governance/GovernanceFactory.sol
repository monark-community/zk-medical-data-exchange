// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Proposal.sol";

/**
 * @title GovernanceFactory
 * @dev Factory for creating and tracking Proposal contracts
 * @notice Similar to StudyFactory, supports open creation and registry queries
 */
contract GovernanceFactory {
    struct ProposalRegistry {
        address proposalContract;
        string title;
        Proposal.ProposalCategory category;
        address proposer;
        uint256 startTime;
        uint256 endTime;
        uint256 createdAt;
        bool active; // True while underlying proposal is active
    }

    mapping(uint256 => ProposalRegistry) public proposals;
    mapping(address => uint256[]) public proposalsByProposer;
    mapping(address => uint256) public proposalAddressToId;
    uint256 public proposalCount;

    // Access control (like StudyFactory)
    address public owner;
    mapping(address => bool) public authorizedCreators;
    bool public openCreation; // If true, anyone can create proposals

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposalContract,
        address indexed proposer,
        string title
    );
    event ProposalDeactivated(uint256 indexed proposalId, address indexed deactivatedBy);
    event CreatorAuthorized(address indexed creator, address indexed authorizedBy);
    event CreatorRevoked(address indexed creator, address indexed revokedBy);
    event CreationModeChanged(bool openCreation, address indexed changedBy);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuthorizedCreator() {
        require(
            openCreation || authorizedCreators[msg.sender] || msg.sender == owner,
            "Not authorized to create proposals"
        );
        _;
    }

    modifier validProposalId(uint256 proposalId) {
        require(proposalId < proposalCount, "Invalid proposal ID");
        _;
    }

    constructor(bool _openCreation) {
        owner = msg.sender;
        openCreation = _openCreation;
        authorizedCreators[msg.sender] = true;
        emit CreationModeChanged(_openCreation, msg.sender);
    }

    /**
     * @dev Create a new proposal
     * @param title Proposal title
     * @param description Proposal description
     * @param category Proposal category
     * @param duration Voting duration in seconds
     * @param proposer Address of the proposer (proposal owner)
     */
    function createProposal(
        string memory title,
        string memory description,
        Proposal.ProposalCategory category,
        uint256 duration,
        address proposer
    ) external onlyAuthorizedCreator returns (uint256 proposalId, address proposalAddress) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(proposer != address(0), "Invalid proposer address");

        Proposal newProposal = new Proposal(
            title,
            description,
            category,
            duration,
            proposer
        );

        proposalId = proposalCount;
        proposalAddress = address(newProposal);

        // Read timings from the new proposal for registry
        (uint256 startTime, uint256 endTime) = (newProposal.startTime(), newProposal.endTime());

        proposals[proposalId] = ProposalRegistry({
            proposalContract: proposalAddress,
            title: title,
            category: category,
            proposer: proposer,
            startTime: startTime,
            endTime: endTime,
            createdAt: block.timestamp,
            active: true
        });

        proposalsByProposer[proposer].push(proposalId);
        proposalAddressToId[proposalAddress] = proposalId;

        proposalCount++;

        emit ProposalCreated(proposalId, proposalAddress, proposer, title);
        return (proposalId, proposalAddress);
    }

    /**
     * @dev Mark a proposal as deactivated in the registry (doesn't change Proposal contract state)
     */
    function deactivateProposal(uint256 proposalId) external validProposalId(proposalId) {
        ProposalRegistry storage pr = proposals[proposalId];
        require(pr.active, "Proposal already deactivated");
        // Only factory owner or the proposal owner can mark inactive in registry
        require(msg.sender == owner || msg.sender == pr.proposer, "Only owner or proposer");

        pr.active = false;
        emit ProposalDeactivated(proposalId, msg.sender);
    }

    // Admin controls mirroring StudyFactory
    function authorizeCreator(address creator) external onlyOwner {
        require(creator != address(0), "Invalid creator address");
        require(!authorizedCreators[creator], "Creator already authorized");
        authorizedCreators[creator] = true;
        emit CreatorAuthorized(creator, msg.sender);
    }

    function revokeCreator(address creator) external onlyOwner {
        require(authorizedCreators[creator], "Creator not authorized");
        require(creator != owner, "Cannot revoke owner");
        authorizedCreators[creator] = false;
        emit CreatorRevoked(creator, msg.sender);
    }

    function setCreationMode(bool _openCreation) external onlyOwner {
        openCreation = _openCreation;
        emit CreationModeChanged(_openCreation, msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner address");
        authorizedCreators[owner] = false;
        authorizedCreators[newOwner] = true;
        owner = newOwner;
    }
}
