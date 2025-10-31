// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract GovernanceDAO {
    
    enum VoteChoice { 
        None,
        For,
        Against,
        Abstain
    }
    
    enum ProposalState {
        Pending,
        Active,
        Passed,
        Failed,
        Executed
    }
    
    enum ProposalCategory {
        Economics,
        Privacy,
        Governance,
        Policy
    }
    
    struct Proposal {
        uint256 id;
        string title;
        string description;
        ProposalCategory category;
        address proposer;
        uint256 startTime;
        uint256 endTime;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        uint256 totalVoters;
        bool executed;
        ProposalState state;
    }
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => VoteChoice)) public votes;
    
    mapping(address => uint256[]) public userProposals;
    mapping(address => uint256[]) public userVotes;
    
    uint256 public votingPeriod = 7 days;
    address public owner;
    
    uint256 public totalVotesCast;
    mapping(address => uint256) public userVoteCount;
    
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        ProposalCategory category,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteChoice choice,
        uint256 timestamp
    );
    
    event ProposalStateChanged(
        uint256 indexed proposalId,
        ProposalState newState,
        uint256 timestamp
    );
    
    event ProposalExecuted(
        uint256 indexed proposalId,
        address indexed executor,
        uint256 timestamp
    );
    
    event VotingPeriodUpdated(
        uint256 oldPeriod,
        uint256 newPeriod,
        address indexed updatedBy
    );

}
    