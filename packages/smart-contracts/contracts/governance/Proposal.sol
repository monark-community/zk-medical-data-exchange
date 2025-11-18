// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Proposal {
    enum VoteChoice { 
        None,
        For,
        Against
    }

    enum ProposalState {
        Active,
        Passed,
        Failed
    }

    enum ProposalCategory {
        Economics,
        Privacy,
        Governance,
        Policy,
        Other
    }

    // Core metadata
    string public title;
    string public description;
    ProposalCategory public category;
    address public owner; // proposal owner (proposer)
    uint256 public startTime;
    uint256 public endTime;
    ProposalState public state;

    // Voting
    uint256 public votesFor;
    uint256 public votesAgainst;
    uint256 public totalVoters;
    mapping(address => bool) public hasVoted;
    mapping(address => VoteChoice) public votes;

    // Events
    event VoteCast(address indexed voter, VoteChoice choice, uint256 timestamp);
    event ProposalStateChanged(ProposalState newState, uint256 timestamp);
    event TitleUpdated(string newTitle, address indexed updatedBy);
    event DescriptionUpdated(address indexed updatedBy);
    event DurationExtended(uint256 newEndTime, address indexed updatedBy);

    modifier onlyOwner(address caller) {
        require(caller == owner, "Only owner can call this function");
        _;
    }

    modifier votingActive() {
        require(state == ProposalState.Active, "Voting is not active");
        require(block.timestamp >= startTime, "Voting hasn't started");
        require(block.timestamp <= endTime, "Voting has ended");
        _;
    }

    constructor(
        string memory _title,
        string memory _description,
        ProposalCategory _category,
        uint256 _duration,
        address _proposer
    ) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_proposer != address(0), "Invalid proposer address");
        require(_duration >= 1 days, "Duration must be at least 1 day");

        title = _title;
        description = _description;
        category = _category;
        owner = _proposer;
        startTime = block.timestamp;
        endTime = startTime + _duration;
        state = ProposalState.Active;
    }

    function vote(VoteChoice choice, address voter)
        external
        votingActive
    {
        require(choice != VoteChoice.None, "Invalid vote choice");
        require(!hasVoted[voter], "Already voted on this proposal");

        hasVoted[voter] = true;
        votes[voter] = choice;

        if (choice == VoteChoice.For) {
            votesFor++;
        } else if (choice == VoteChoice.Against) {
            votesAgainst++;
        }

        totalVoters++;
        emit VoteCast(voter, choice, block.timestamp);
    }

    function finalize() external {
        require(state == ProposalState.Active, "Proposal not active");
        require(block.timestamp > endTime, "Voting period not ended");

        ProposalState newState = votesFor > votesAgainst
            ? ProposalState.Passed
            : ProposalState.Failed;
        state = newState;
        emit ProposalStateChanged(newState, block.timestamp);
    }

    // Owner-managed updates while active voting window
    function updateTitle(string memory newTitle, address caller)
        external
        onlyOwner(caller)
    {
        require(state == ProposalState.Active, "Proposal not active");
        require(bytes(newTitle).length > 0, "Title cannot be empty");
        title = newTitle;
        emit TitleUpdated(newTitle, caller);
    }

    function updateDescription(string memory newDescription, address caller)
        external
        onlyOwner(caller)
    {
        require(state == ProposalState.Active, "Proposal not active");
        require(bytes(newDescription).length > 0, "Description cannot be empty");
        description = newDescription;
        emit DescriptionUpdated(caller);
    }

    function extendDuration(uint256 extraSeconds, address caller)
        external
        onlyOwner(caller)
    {
        require(state == ProposalState.Active, "Proposal not active");
        require(extraSeconds > 0, "Invalid extension");
        endTime += extraSeconds;
        emit DurationExtended(endTime, caller);
    }

    /**
     * @dev Returns the voting state of the proposal
     * @return _currentState Current proposal state (Active/Passed/Failed)
     * @return _votesFor Number of votes in favor
     * @return _votesAgainst Number of votes against
     * @return _totalVoters Total number of voters
     */
    function getState()
        external
        view
        returns (
            ProposalState _currentState,
            uint256 _votesFor,
            uint256 _votesAgainst,
            uint256 _totalVoters
        )
    {
        return (
            state,
            votesFor,
            votesAgainst,
            totalVoters
        );
    }
}
