// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Study.sol";

/**
 * @title StudyFactory
 * @dev Factory contract for creating and managing multiple Study instances
 * @notice This contract allows researchers to create new studies and provides discovery mechanisms
 */
contract StudyFactory {
    // Study registry entry
    struct StudyRegistry {
        address studyContract;
        string title;
        address principalInvestigator;
        uint256 createdAt;
        bool active;
    }

    // State variables
    mapping(uint256 => StudyRegistry) public studies;
    mapping(address => uint256[]) public studiesByPI;           // Studies by Principal Investigator
    mapping(address => uint256[]) public studiesByResearcher;   // Studies where address is authorized researcher
    mapping(address => uint256) public studyToId;              // Study contract address to study ID
    
    uint256 public studyCount;
    uint256 public activeStudyCount;
    
    // Access control
    address public owner;
    mapping(address => bool) public authorizedCreators;
    bool public openCreation; // If true, anyone can create studies
    
    // Events
    event StudyCreated(
        uint256 indexed studyId,
        address indexed studyContract,
        address indexed principalInvestigator,
        string title
    );
    event StudyDeactivated(uint256 indexed studyId, address indexed deactivatedBy);
    event CreatorAuthorized(address indexed creator, address indexed authorizedBy);
    event CreatorRevoked(address indexed creator, address indexed revokedBy);
    event CreationModeChanged(bool openCreation, address indexed changedBy);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuthorizedCreator() {
        require(
            openCreation || authorizedCreators[msg.sender] || msg.sender == owner,
            "Not authorized to create studies"
        );
        _;
    }

    modifier validStudyId(uint256 studyId) {
        require(studyId < studyCount, "Invalid study ID");
        _;
    }

    /**
     * @dev Constructor
     * @param _openCreation Whether anyone can create studies initially
     */
    constructor(bool _openCreation) {
        owner = msg.sender;
        openCreation = _openCreation;
        authorizedCreators[msg.sender] = true;
        
        emit CreationModeChanged(_openCreation, msg.sender);
    }

    /**
     * @dev Create a new study
     * @param title Study title
     * @param maxParticipants Maximum number of participants
     * @param principalInvestigator Address of the principal investigator
     * @param zkVerifierAddress Address of the deployed ZK verifier contract
     * @param customCriteria Custom eligibility criteria for the study
     * @return studyId The ID of the newly created study
     * @return studyAddress The address of the deployed Study contract
     */
    function createStudy(
        string memory title,
        string memory /* description */,
        uint256 maxParticipants,
        uint256 /* startDate */,
        uint256 /* endDate */,
        address principalInvestigator,
        address zkVerifierAddress,
        Study.StudyCriteria memory customCriteria
    ) external onlyAuthorizedCreator returns (uint256 studyId, address studyAddress) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(principalInvestigator != address(0), "Invalid PI address");
        
        // Validate custom criteria ranges
        require(customCriteria.minAge < customCriteria.maxAge, "Invalid age range");
        require(customCriteria.minCholesterol < customCriteria.maxCholesterol, "Invalid cholesterol range");
        require(customCriteria.minBMI < customCriteria.maxBMI, "Invalid BMI range");

        // Deploy new Study contract with custom criteria
        Study newStudy = new Study(
            title,
            maxParticipants,
            customCriteria,
            zkVerifierAddress
        );

        studyId = studyCount;
        studyAddress = address(newStudy);

        // Register the study
        studies[studyId] = StudyRegistry({
            studyContract: studyAddress,
            title: title,
            principalInvestigator: principalInvestigator,
            createdAt: block.timestamp,
            active: true
        });

        // Update mappings
        studiesByPI[principalInvestigator].push(studyId);
        studiesByResearcher[principalInvestigator].push(studyId);
        studyToId[studyAddress] = studyId;

        studyCount++;
        activeStudyCount++;

        emit StudyCreated(studyId, studyAddress, principalInvestigator, title);

        return (studyId, studyAddress);
    }

    /**
     * @dev Deactivate a study in the registry (doesn't affect the study contract itself)
     * @param studyId ID of the study to deactivate
     */
    function deactivateStudy(uint256 studyId) external validStudyId(studyId) {
        StudyRegistry storage study = studies[studyId];
        require(study.active, "Study already deactivated");
        require(
            msg.sender == owner || msg.sender == study.principalInvestigator,
            "Only owner or PI can deactivate"
        );

        study.active = false;
        activeStudyCount--;

        emit StudyDeactivated(studyId, msg.sender);
    }

    /**
     * @dev Authorize an address to create studies
     * @param creator Address to authorize
     */
    function authorizeCreator(address creator) external onlyOwner {
        require(creator != address(0), "Invalid creator address");
        require(!authorizedCreators[creator], "Creator already authorized");

        authorizedCreators[creator] = true;
        emit CreatorAuthorized(creator, msg.sender);
    }

    /**
     * @dev Revoke study creation authorization
     * @param creator Address to revoke
     */
    function revokeCreator(address creator) external onlyOwner {
        require(authorizedCreators[creator], "Creator not authorized");
        require(creator != owner, "Cannot revoke owner");

        authorizedCreators[creator] = false;
        emit CreatorRevoked(creator, msg.sender);
    }

    /**
     * @dev Change creation mode (open vs restricted)
     * @param _openCreation New creation mode
     */
    function setCreationMode(bool _openCreation) external onlyOwner {
        openCreation = _openCreation;
        emit CreationModeChanged(_openCreation, msg.sender);
    }

    /**
     * @dev Transfer ownership
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner address");
        
        // Revoke old owner's creator status and authorize new owner
        authorizedCreators[owner] = false;
        authorizedCreators[newOwner] = true;
        
        owner = newOwner;
    }

    /**
     * @dev Add a researcher to an existing study's authorized list
     * @param studyId ID of the study
     * @param researcher Address of the researcher to add
     */
    function addResearcherToStudy(uint256 studyId, address researcher) 
        external 
        validStudyId(studyId) 
    {
        StudyRegistry storage studyRegistry = studies[studyId];
        require(studyRegistry.active, "Study not active");
        
        // Only PI can add researchers through the factory
        require(msg.sender == studyRegistry.principalInvestigator, "Only PI can add researchers");
        
        // Update factory mappings (Study contract manages its own access)
        studiesByResearcher[researcher].push(studyId);
    }

    // View functions

    /**
     * @dev Get study information by ID
     * @param studyId Study ID
     * @return Study registry information
     */
    function getStudy(uint256 studyId) 
        external 
        view 
        validStudyId(studyId) 
        returns (StudyRegistry memory) 
    {
        return studies[studyId];
    }

    /**
     * @dev Get studies by Principal Investigator
     * @param pi Address of the principal investigator
     * @return Array of study IDs
     */
    function getStudiesByPI(address pi) external view returns (uint256[] memory) {
        return studiesByPI[pi];
    }

    /**
     * @dev Get studies where address is an authorized researcher
     * @param researcher Address of the researcher
     * @return Array of study IDs
     */
    function getStudiesByResearcher(address researcher) external view returns (uint256[] memory) {
        return studiesByResearcher[researcher];
    }

    /**
     * @dev Get all active studies (paginated)
     * @param offset Starting index
     * @param limit Number of studies to return
     * @return studyIds Array of study IDs
     * @return hasMore Whether there are more studies available
     */
    function getActiveStudies(uint256 offset, uint256 limit) 
        external 
        view 
        returns (uint256[] memory studyIds, bool hasMore) 
    {
        require(limit > 0 && limit <= 100, "Invalid limit (1-100)");
        
        uint256[] memory tempIds = new uint256[](limit);
        uint256 found = 0;
        uint256 checked = 0;
        
        for (uint256 i = 0; i < studyCount && found < limit; i++) {
            if (studies[i].active) {
                if (checked >= offset) {
                    tempIds[found] = i;
                    found++;
                }
                checked++;
            }
        }
        
        // Resize array to actual found count
        studyIds = new uint256[](found);
        for (uint256 i = 0; i < found; i++) {
            studyIds[i] = tempIds[i];
        }
        
        hasMore = (checked - offset) > limit;
        
        return (studyIds, hasMore);
    }

    /**
     * @dev Search studies by title (simple string matching)
     * @param searchTerm Term to search for in study titles
     * @param limit Maximum number of results to return
     * @return Array of matching study IDs
     */
    function searchStudiesByTitle(string memory searchTerm, uint256 limit) 
        external 
        view 
        returns (uint256[] memory) 
    {
        require(bytes(searchTerm).length > 0, "Search term cannot be empty");
        require(limit > 0 && limit <= 50, "Invalid limit (1-50)");
        
        uint256[] memory results = new uint256[](limit);
        uint256 found = 0;
        
        bytes memory searchBytes = bytes(searchTerm);
        
        for (uint256 i = 0; i < studyCount && found < limit; i++) {
            if (studies[i].active && _contains(bytes(studies[i].title), searchBytes)) {
                results[found] = i;
                found++;
            }
        }
        
        // Resize array to actual found count
        uint256[] memory finalResults = new uint256[](found);
        for (uint256 i = 0; i < found; i++) {
            finalResults[i] = results[i];
        }
        
        return finalResults;
    }

    /**
     * @dev Get study statistics
     * @return totalStudies Total number of studies created
     * @return activeStudies Number of currently active studies
     * @return totalPIs Number of unique principal investigators
     */
    function getStatistics() 
        external 
        view 
        returns (uint256 totalStudies, uint256 activeStudies, uint256 totalPIs) 
    {
        return (studyCount, activeStudyCount, _getUniquePICount());
    }

    /**
     * @dev Check if an address is authorized to create studies
     * @param creator Address to check
     * @return Whether the address can create studies
     */
    function canCreateStudies(address creator) external view returns (bool) {
        return openCreation || authorizedCreators[creator];
    }

    /**
     * @dev Get the Study contract address for a given study ID
     * @param studyId Study ID
     * @return Address of the Study contract
     */
    function getStudyContract(uint256 studyId) 
        external 
        view 
        validStudyId(studyId) 
        returns (address) 
    {
        return studies[studyId].studyContract;
    }

    // Internal functions

    /**
     * @dev Simple substring search (case-sensitive)
     * @param text Text to search in
     * @param pattern Pattern to search for
     * @return Whether pattern is found in text
     */
    function _contains(bytes memory text, bytes memory pattern) 
        internal 
        pure 
        returns (bool) 
    {
        if (pattern.length == 0) return true;
        if (text.length < pattern.length) return false;
        
        for (uint256 i = 0; i <= text.length - pattern.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < pattern.length; j++) {
                if (text[i + j] != pattern[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    }

    /**
     * @dev Count unique principal investigators
     * @return Number of unique PIs
     */
    function _getUniquePICount() internal view returns (uint256) {
        // This is a simplified version - in practice, you might want to maintain
        // a separate mapping for efficiency
        address[] memory uniquePIs = new address[](studyCount);
        uint256 uniqueCount = 0;
        
        for (uint256 i = 0; i < studyCount; i++) {
            address currentPI = studies[i].principalInvestigator;
            bool isUnique = true;
            
            for (uint256 j = 0; j < uniqueCount; j++) {
                if (uniquePIs[j] == currentPI) {
                    isUnique = false;
                    break;
                }
            }
            
            if (isUnique) {
                uniquePIs[uniqueCount] = currentPI;
                uniqueCount++;
            }
        }
        
        return uniqueCount;
    }
}
