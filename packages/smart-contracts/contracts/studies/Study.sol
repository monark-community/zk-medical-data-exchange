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
    
    struct DataBin {
        uint256 binId;                 // Unique identifier (e.g., "age_bin_0")
        string criteriaField;         // Field name (e.g., "age", "bmi")
        uint8 binType;                // 0=RANGE, 1=CATEGORICAL
        string label;                 // Human-readable label

        uint256 minValue;             // Minimum value (inclusive by default)
        uint256 maxValue;             // Maximum value
        bool includeMin;              // Whether min is inclusive
        bool includeMax;              // Whether max is inclusive

        uint256 categoriesBitmap;     // Bitmap of allowed categories
    }
    
    struct BinCount {
        uint256 binId;                 // References DataBin.binId
        uint256 count;                // Number of participants in this bin
    }
    
    DataBin[] public bins;
    
    mapping(uint256 => uint256) public binCounts;
    
    mapping(address => uint256[]) private participantBins;
    
    // Study metadata
    string public studyTitle;
    address public studyCreator;
    uint256 public maxParticipants;
    uint256 public currentParticipants; // Total enrolled (regardless of consent)
    uint256 public activeParticipants;  // Only those with active consent
    
    StudyCriteria public criteria;
    Groth16Verifier public immutable zkVerifier;

    mapping(address => bool) public participants;
    mapping(address => bool) public hasConsented; // Tracks active consent status
    mapping(address => uint256) public participantDataCommitments; // Hash of their private data
    address[] public participantList;
    
    // Anti-Gaming: Store commitment hashes on-chain
    // Maps: wallet => studyId => commitmentHash
    // commitmentHash = keccak256(wallet, dataCommitment, challenge)
    mapping(address => bytes32) public registeredCommitments;
    mapping(address => uint256) public commitmentTimestamps;
    
    // Events
    event CommitmentRegistered(address indexed participant, bytes32 commitmentHash, uint256 timestamp);
    event ParticipantJoined(address indexed participant, uint256 dataCommitment);
    event EligibilityVerified(address indexed participant, bool eligible);
    event ConsentRevoked(address indexed participant, uint256 timestamp);
    event ConsentGranted(address indexed participant, uint256 timestamp);
    event BinCountUpdated(uint256 indexed binId, uint256 newCount);
    event BinsConfigured(uint256 binCount);
    
    // Detailed logging events for bin operations
    event BinConfigurationStarted(address indexed caller, uint256 binCount);
    event BinConfigured(uint256 indexed index, uint256 binId, string criteriaField, string label, uint8 binType);
    event BinUpdateStarted(address indexed participant, uint256 binCount, bool increment);
    event BinCountChanged(uint256 indexed binId, uint256 oldCount, uint256 newCount, address indexed participant);
    
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
    
    function configureBins(DataBin[] memory _bins, address caller) external {
        require(caller == studyCreator, "Only creator can configure bins");
        require(bins.length == 0, "Bins already configured");
        require(currentParticipants == 0, "Cannot configure bins after participants join");
        
        emit BinConfigurationStarted(caller, _bins.length);
        
        for (uint256 i = 0; i < _bins.length; i++) {
            bins.push(_bins[i]);
            emit BinConfigured(i, _bins[i].binId, _bins[i].criteriaField, _bins[i].label, _bins[i].binType);
        }
        
        emit BinsConfigured(_bins.length);
    }
    
    /**
     * @dev Register a commitment on-chain before proof generation
     * This creates an immutable record that ties wallet + dataCommitment + challenge
     * Called by backend after verifying the user's signature
     * 
     * @param dataCommitment Poseidon hash of medical data
     * @param challenge Random challenge from backend
     */
    function registerCommitment(
        uint256 dataCommitment,
        bytes32 challenge,
        address participant
    ) external {
        require(registeredCommitments[participant] == bytes32(0), "Commitment already registered");
        require(!participants[participant], "Already participating in study");
        
        bytes32 commitmentHash = keccak256(abi.encodePacked(
            participant,
            dataCommitment,
            challenge
        ));

        registeredCommitments[participant] = commitmentHash;
        commitmentTimestamps[participant] = block.timestamp;

        emit CommitmentRegistered(participant, commitmentHash, block.timestamp);
    }
    
    /**
     * @dev Main function for patients to join the study using ZK proof
     * @param _pA Groth16 proof point A (G1)
     * @param _pB Groth16 proof point B (G2) 
     * @param _pC Groth16 proof point C (G1)
     * @param dataCommitment Poseidon hash of the patient's private medical data
     * @param challenge Challenge that was issued during commitment registration
     * @param binIds Array of bin IDs this participant belongs to
     */
    function joinStudy(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint256 dataCommitment,
        bytes32 challenge,
        address participant,
        uint256[] memory binIds
    ) external {
        require(currentParticipants < maxParticipants, "Study is full");
        require(!participants[participant], "Already participating");
        
        bytes32 storedCommitmentHash = registeredCommitments[participant];
        require(storedCommitmentHash != bytes32(0), "No commitment registered");
        
        bytes32 recomputedHash = keccak256(abi.encodePacked(
            participant,
            dataCommitment,
            challenge
        ));
        require(recomputedHash == storedCommitmentHash, "Commitment mismatch - data tampering detected");
        
        uint[51] memory pubSignals;
        for (uint i=0; i<50; i++) pubSignals[i] = binIds[i];
        pubSignals[50] = dataCommitment;

        bool isEligible = zkVerifier.verifyProof(_pA,_pB,_pC,pubSignals);
        
        emit EligibilityVerified(participant, isEligible);
        require(isEligible, "ZK proof verification failed - not eligible");
        
        participants[participant] = true;
        hasConsented[participant] = true;
        participantDataCommitments[participant] = dataCommitment;
        participantList.push(participant);
        currentParticipants++;
        activeParticipants++;
        
        _updateBinCounts(participant, binIds, true);
        
        delete registeredCommitments[participant];
        
        emit ParticipantJoined(participant, dataCommitment);
        emit ConsentGranted(participant, block.timestamp);
    }
    
    function _updateBinCounts(
        address participant,
        uint256[] memory binIds,
        bool increment
    ) private {
        emit BinUpdateStarted(participant, binIds.length, increment);
        
        for (uint256 i = 0; i < binIds.length; i++) {
            uint256 binId = binIds[i];
            uint256 oldCount = binCounts[binId];
            
            if (increment) {
                binCounts[binId]++;
                participantBins[participant].push(binId);
                emit BinCountChanged(binId, oldCount, binCounts[binId], participant);
                emit BinCountUpdated(binId, binCounts[binId]);
            } else {
                if (binCounts[binId] > 0) {
                    binCounts[binId]--;
                    emit BinCountChanged(binId, oldCount, binCounts[binId], participant);
                    emit BinCountUpdated(binId, binCounts[binId]);
                }
            }
        }
    }
    
    /**
     * @dev Allow participants to revoke their consent for data usage
     * This does NOT remove them from the study, but marks their consent as revoked
     * and decrements bin counts
     * @param participant Address of the participant revoking consent
     */
    function revokeConsent(address participant) external {
        require(participants[participant], "Not a participant in this study");
        require(hasConsented[participant], "Consent already revoked");
        
        hasConsented[participant] = false;
        activeParticipants--;
        
        uint256[] memory binIds = participantBins[participant];
        _updateBinCounts(participant, binIds, false);
        
        emit ConsentRevoked(participant, block.timestamp);
    }
    
    /**
     * @dev Allow participants to grant consent again after revoking
     * Re-increments bin counts
     * @param participant Address of the participant granting consent
     */
    function grantConsent(address participant) external {
        require(participants[participant], "Not a participant in this study");
        require(!hasConsented[participant], "Consent already granted");
        require(activeParticipants < maxParticipants, "Study is full - cannot grant consent");
        
        hasConsented[participant] = true;
        activeParticipants++;
        
        uint256[] memory binIds = participantBins[participant];
        _updateBinCounts(participant, binIds, true);
        
        emit ConsentGranted(participant, block.timestamp);
    }
    
    // View functions
    function getParticipantCount() external view returns (uint256) {
        return activeParticipants; // Only count participants with active consent
    }
    
    function getTotalEnrolled() external view returns (uint256) {
        return currentParticipants; // Total enrolled regardless of consent status
    }
    
    function getStudyCriteria() external view returns (StudyCriteria memory) {
        return criteria;
    }
    
    function isParticipant(address addr) external view returns (bool) {
        return participants[addr];
    }
    
    function hasActiveConsent(address addr) external view returns (bool) {
        require(participants[addr], "Not a participant");
        return hasConsented[addr];
    }
    
    function getParticipantDataCommitment(address addr) external view returns (uint256) {
        require(participants[addr], "Not a participant");
        require(hasConsented[addr], "Participant has revoked consent");
        return participantDataCommitments[addr];
    }
    
    /**
     * @dev Check if a wallet has a registered commitment
     * @param addr Wallet address to check
     * @return commitmentHash The stored commitment hash (bytes32(0) if none)
     * @return timestamp When the commitment was registered
     */
    function getRegisteredCommitment(address addr) external view returns (bytes32 commitmentHash, uint256 timestamp) {
        return (registeredCommitments[addr], commitmentTimestamps[addr]);
    }
    
    /**
     * @dev Verify if provided data matches a registered commitment
     * Useful for frontend validation before submitting proof
     * @param addr Wallet address
     * @param dataCommitment Data commitment to verify
     * @param challenge Challenge to verify
     * @return bool True if matches, false otherwise
     */
    function verifyCommitmentMatch(
        address addr,
        uint256 dataCommitment,
        bytes32 challenge
    ) external view returns (bool) {
        bytes32 storedHash = registeredCommitments[addr];
        if (storedHash == bytes32(0)) {
            return false;
        }
        
        bytes32 recomputedHash = keccak256(abi.encodePacked(
            addr,
            dataCommitment,
            challenge
        ));
        
        return recomputedHash == storedHash;
    }
    
    /**
     * @dev Get list of all participants who have active consent
     * @return Array of addresses with active consent
     */
    function getConsentedParticipants() external view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < participantList.length; i++) {
            if (hasConsented[participantList[i]]) {
                count++;
            }
        }
        address[] memory consented = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < participantList.length; i++) {
            if (hasConsented[participantList[i]]) {
                consented[index] = participantList[i];
                index++;
            }
        }
        return consented;
    }
    
    function getBins() external view returns (DataBin[] memory) {
        return bins;
    }
    
    function getBinCount(uint256 binId) external view returns (uint256) {
        return binCounts[binId];
    }
    
    function getAllBinCounts() external view returns (BinCount[] memory) {
        BinCount[] memory counts = new BinCount[](bins.length);
        
        for (uint256 i = 0; i < bins.length; i++) {
            counts[i] = BinCount({
                binId: bins[i].binId,
                count: binCounts[bins[i].binId]
            });
        }
        
        return counts;
    }
    
    // function isParticipantInBin(address participant, string memory binId) external view returns (bool) {
    //     require(
    //         msg.sender == participant,
    //         "Only participant can view their own bins"
    //     );
    //     require(participants[participant], "Not a participant");
        
    //     uint256[] memory participantBinIds = participantBins[participant];
    //     for (uint256 i = 0; i < participantBinIds.length; i++) {
    //         if (keccak256(bytes(participantBinIds[i])) == keccak256(bytes(binId))) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }
    
    function areBinsConfigured() external view returns (bool) {
        return bins.length > 0;
    }
}
