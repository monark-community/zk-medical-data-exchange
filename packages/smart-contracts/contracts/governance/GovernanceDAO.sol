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
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier proposalExists(uint256 proposalId) {
        require(proposalId < proposalCount, "Proposal does not exist");
        _;
    }
    
    modifier votingActive(uint256 proposalId) {
        require(proposals[proposalId].state == ProposalState.Active, "Voting is not active");
        require(block.timestamp >= proposals[proposalId].startTime, "Voting hasn't started");
        require(block.timestamp <= proposals[proposalId].endTime, "Voting has ended");
        _;
    }
    
    modifier hasNotVoted(uint256 proposalId) {
        require(!hasVoted[proposalId][msg.sender], "Already voted on this proposal");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }

    function createProposal(
        string memory title,
        string memory description,
        ProposalCategory category
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        
        uint256 proposalId = proposalCount;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + votingPeriod;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            title: title,
            description: description,
            category: category,
            proposer: msg.sender,
            startTime: startTime,
            endTime: endTime,
            votesFor: 0,
            votesAgainst: 0,
            votesAbstain: 0,
            totalVoters: 0,
            executed: false,
            state: ProposalState.Active
        });
        
        userProposals[msg.sender].push(proposalId);
        proposalCount++;
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            category,
            startTime,
            endTime
        );
        
        return proposalId;
    }

    function vote(uint256 proposalId, VoteChoice choice) 
        external
        proposalExists(proposalId)
        votingActive(proposalId)
        hasNotVoted(proposalId)
    {
        require(choice != VoteChoice.None, "Invalid vote choice");
        
        hasVoted[proposalId][msg.sender] = true;
        votes[proposalId][msg.sender] = choice;
        
        if (choice == VoteChoice.For) {
            proposals[proposalId].votesFor++;
        } else if (choice == VoteChoice.Against) {
            proposals[proposalId].votesAgainst++;
        } else if (choice == VoteChoice.Abstain) {
            proposals[proposalId].votesAbstain++;
        }
        
        proposals[proposalId].totalVoters++;
        
        userVotes[msg.sender].push(proposalId);
        userVoteCount[msg.sender]++;
        totalVotesCast++;
        
        emit VoteCast(proposalId, msg.sender, choice, block.timestamp);
    }

    function finalizeProposal(uint256 proposalId) 
        external 
        proposalExists(proposalId)
    {
        Proposal storage proposal = proposals[proposalId];
        
        require(proposal.state == ProposalState.Active, "Proposal not active");
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        
        ProposalState newState = proposal.votesFor > proposal.votesAgainst 
            ? ProposalState.Passed 
            : ProposalState.Failed;
        
        proposal.state = newState;
        
        emit ProposalStateChanged(proposalId, newState, block.timestamp);
    }
    
    function executeProposal(uint256 proposalId)
        external
        onlyOwner
        proposalExists(proposalId)
    {
        Proposal storage proposal = proposals[proposalId];
        
        require(proposal.state == ProposalState.Passed, "Proposal must be passed");
        require(!proposal.executed, "Already executed");
        
        proposal.executed = true;
        proposal.state = ProposalState.Executed;
        
        emit ProposalExecuted(proposalId, msg.sender, block.timestamp);
    }


}
    