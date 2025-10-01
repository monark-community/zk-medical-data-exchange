// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MedicalEligibilityVerifier.sol";

contract Study {
    // Study criteria that EXACTLY match our enhanced Circom circuit public inputs
    // ALL criteria are optional with enable flags for maximum flexibility
    struct StudyCriteria {
        // Basic demographic & health criteria (all optional)
        uint256 enableAge;            // 0=disabled, 1=enabled
        uint256 minAge;
        uint256 maxAge;
        uint256 enableCholesterol;    // 0=disabled, 1=enabled
        uint256 minCholesterol;
        uint256 maxCholesterol;
        uint256 enableBMI;            // 0=disabled, 1=enabled
        uint256 minBMI;
        uint256 maxBMI;
        uint256 enableBloodType;      // 0=disabled, 1=enabled
        uint256[4] allowedBloodTypes;
        
        // Advanced conditional criteria
        uint256 enableGender;         // 0=disabled, 1=enabled
        uint256 allowedGender;        // 0=any, 1=male, 2=female
        uint256 enableLocation;       // 0=disabled, 1=enabled
        uint256[4] allowedRegions;    // Region codes
        uint256 enableBloodPressure;  // 0=disabled, 1=enabled
        uint256 minSystolic;
        uint256 maxSystolic;
        uint256 minDiastolic;
        uint256 maxDiastolic;
        uint256 enableHbA1c;          // 0=disabled, 1=enabled
        uint256 minHbA1c;             // HbA1c * 10 (e.g., 5.7% = 57)
        uint256 maxHbA1c;
        uint256 enableSmoking;        // 0=disabled, 1=enabled
        uint256 allowedSmoking;       // 0=non-smoker, 1=smoker, 2=former, 3=any
        uint256 enableActivity;       // 0=disabled, 1=enabled
        uint256 minActivityLevel;     // Minutes per week
        uint256 maxActivityLevel;
        uint256 enableDiabetes;       // 0=disabled, 1=enabled
        uint256 allowedDiabetes;      // 0=no diabetes, 1=type1, 2=type2, 3=any
        uint256 enableHeartDisease;   // 0=disabled, 1=enabled
        uint256 allowedHeartDisease;  // 0=no history, 1=has history, 2=any
    }
    
    // Study metadata
    string public studyTitle;
    address public studyCreator;
    uint256 public maxParticipants;
    uint256 public currentParticipants;
    
    StudyCriteria public criteria;
    Groth16Verifier public immutable zkVerifier;

    // Participant tracking (NO private medical data stored on-chain!)
    mapping(address => bool) public participants;
    mapping(address => uint256) public participantDataCommitments; // Hash of their private data
    address[] public participantList;
    
    // Events
    event ParticipantJoined(address indexed participant, uint256 dataCommitment);
    event EligibilityVerified(address indexed participant, bool eligible);
    
    constructor(
        string memory _title,
        uint256 _maxParticipants,
        StudyCriteria memory _criteria,
        address _zkVerifierAddress
    ) {
        studyTitle = _title;
        studyCreator = msg.sender;
        maxParticipants = _maxParticipants;
        criteria = _criteria;
        zkVerifier = Groth16Verifier(_zkVerifierAddress);
    }
    
    /**
     * @dev Main function for patients to join the study using ZK proof
     * @param _pA Groth16 proof point A (G1)
     * @param _pB Groth16 proof point B (G2) 
     * @param _pC Groth16 proof point C (G1)
     * @param dataCommitment Poseidon hash of the patient's private medical data
     */
    function joinStudy(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint256 dataCommitment
    ) external {
        require(currentParticipants < maxParticipants, "Study is full");
        require(!participants[msg.sender], "Already participating");
        
        // Verify the ZK proof - only checks that patient proved they are eligible
        // The study criteria were used during proof generation (client-side)
        // Only the eligibility result (1 = eligible, 0 = not eligible) is public
        uint[1] memory pubSignals = [uint256(1)]; // Expected: eligible = 1
        bool isEligible = zkVerifier.verifyProof(_pA, _pB, _pC, pubSignals);
        
        emit EligibilityVerified(msg.sender, isEligible);
        require(isEligible, "ZK proof verification failed - not eligible");
        
        // Add participant to study
        participants[msg.sender] = true;
        participantDataCommitments[msg.sender] = dataCommitment;
        participantList.push(msg.sender);
        currentParticipants++;
        
        emit ParticipantJoined(msg.sender, dataCommitment);
    }
    
    
    
    // View functions
    function getParticipantCount() external view returns (uint256) {
        return currentParticipants;
    }
    
    function getStudyCriteria() external view returns (StudyCriteria memory) {
        return criteria;
    }
    
    function isParticipant(address addr) external view returns (bool) {
        return participants[addr];
    }
    
    function getParticipantDataCommitment(address addr) external view returns (uint256) {
        require(participants[addr], "Not a participant");
        return participantDataCommitments[addr];
    }
}