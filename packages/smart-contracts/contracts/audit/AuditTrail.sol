// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title AuditTrail
 * @dev Comprehensive audit logging for all system actions
 * @notice Stores immutable audit records on blockchain for regulatory compliance
 */
contract AuditTrail {
    
    // User profile types
    enum UserProfile {
        RESEARCHER,     // Researcher profile
        DATA_SELLER,    // Data seller (patient) profile
        ADMIN,          // Admin profile (for admin actions)
        COMMON          // Common actions available to all profiles
    }
    
    // Action types for categorization
    enum ActionType {
        // COMMON
        USER_AUTHENTICATION,     // Login/logout events
        PROPOSAL_CREATION,       // Governance proposal created
        VOTE_CAST,                // Vote cast on proposal
        PROPOSAL_REMOVAL,         // Governance proposal removed
        USERNAME_CHANGE,        // User changes username/display name
        // RESEARCHER ACTIONS
        STUDY_CREATION,          // New study created
        STUDY_STATUS_CHANGE,     // Study activated/deactivated
        STUDY_AGGREGATED_DATA_ACCESS, // Access to aggregated study data
        PERMISSION_CHANGE,       // Permission granted/revoked
        // DATA SELLER ACTIONS
        STUDY_PARTICIPATION,     // Patient joins study
        STUDY_CONSENT_REVOKED,   // Patient revokes consent
        STUDY_CONSENT_GRANTED,   // Patient grants consent
        DATA_UPLOAD,             // Data uploaded to vault
        DATA_ACCESS,             // Data accessed/viewed
        DATA_DELETED,            // Data deleted from vault
        // ADMIN
        ADMIN_ACTION,            // Administrative actions
        SYSTEM_CONFIG,           // System configuration changes
        // REWARDS
        SENT_COMPENSATION,         // Compensation sent to data sellers
        RECEIVED_COMPENSATION      // Compensation received by data sellers
    }
    
    // Comprehensive audit record
    struct AuditRecord {
        uint256 timestamp;       // Block timestamp
        uint256 blockNumber;     // Block number for reference
        address user;            // User who performed action
        UserProfile userProfile; // User profile (RESEARCHER/DATA_SELLER/ADMIN)
        ActionType actionType;   // Type of action performed
        string resource;         // Resource affected (study ID, contract address, etc.)
        string action;           // Specific action description
        bytes32 dataHash;        // Hash of action parameters (for privacy)
        bool success;            // Whether action was successful
        string metadata;         // Additional context (JSON string)
    }
    
    // Storage
    mapping(uint256 => AuditRecord) public auditRecords;
    mapping(address => uint256[]) public userActions;        // Actions by user (all profiles)
    mapping(string => uint256[]) public resourceActions;     // Actions on resource
    mapping(ActionType => uint256[]) public actionsByType;   // Actions by type
    
    // New profile-based indexing
    mapping(address => mapping(UserProfile => uint256[])) public userProfileActions; // Actions by user + profile
    mapping(UserProfile => uint256[]) public profileActions; // Actions by profile only
    
    uint256 public totalRecords;
    
    // Access control
    address public auditManager;
    mapping(address => bool) public authorizedLoggers;
    
    // Events
    event AuditRecordCreated(
        uint256 indexed recordId,
        address indexed user,
        ActionType indexed actionType,
        string resource,
        uint256 timestamp
    );
    
    event LoggerAuthorized(address indexed logger, address indexed authorizedBy);
    event LoggerRevoked(address indexed logger, address indexed revokedBy);
    
    modifier onlyAuthorized() {
        require(
            authorizedLoggers[msg.sender] || msg.sender == auditManager,
            "Not authorized to log audit records"
        );
        _;
    }
    
    modifier onlyAuditManager() {
        require(msg.sender == auditManager, "Only audit manager can call this");
        _;
    }
    
    constructor() {
        auditManager = msg.sender;
        authorizedLoggers[msg.sender] = true;
        
        // Log contract creation
        _logAction(
            msg.sender,
            UserProfile.ADMIN,
            ActionType.SYSTEM_CONFIG,
            "AuditTrail",
            "Contract deployed",
            bytes32(0),
            true,
            "{\"version\":\"1.0\",\"deployedBy\":\"system\"}"
        );
    }
    
    /**
     * @dev Log an audit action
     * @param user Address of user performing action
     * @param userProfile User profile (RESEARCHER/DATA_SELLER/ADMIN)
     * @param actionType Type of action
     * @param resource Resource identifier
     * @param action Description of action
     * @param dataHash Hash of sensitive parameters
     * @param success Whether action succeeded
     * @param metadata Additional context as JSON string
     */
    function logAction(
        address user,
        UserProfile userProfile,
        ActionType actionType,
        string memory resource,
        string memory action,
        bytes32 dataHash,
        bool success,
        string memory metadata
    ) external onlyAuthorized {
        _logAction(user, userProfile, actionType, resource, action, dataHash, success, metadata);
    }

    /**
     * @dev Log the same audit action for multiple participants
     * @param participants Array of participant addresses
     * @param userProfile User profile for all participants (RESEARCHER/DATA_SELLER/ADMIN)
     * @param actionType Type of action
     * @param resource Resource identifier
     * @param action Description of action
     * @param dataHash Hash of sensitive parameters
     * @param success Whether action succeeded
     * @param metadata Additional context as JSON string
     */
    function logActionForParticipants(
        address[] memory participants,
        UserProfile userProfile,
        ActionType actionType,
        string memory resource,
        string memory action,
        bytes32 dataHash,
        bool success,
        string memory metadata
    ) external onlyAuthorized {
        require(participants.length > 0, "Participants array cannot be empty");
        require(participants.length <= 10000, "Too many participants, maximum 10000 allowed");

        for (uint256 i = 0; i < participants.length; i++) {
            require(participants[i] != address(0), "Invalid participant address");
            _logAction(participants[i], userProfile, actionType, resource, action, dataHash, success, metadata);
        }
    }
    
    /**
     * @dev Internal logging function
     */
    function _logAction(
        address user,
        UserProfile userProfile,
        ActionType actionType,
        string memory resource,
        string memory action,
        bytes32 dataHash,
        bool success,
        string memory metadata
    ) internal {
        uint256 recordId = totalRecords++;
        
        auditRecords[recordId] = AuditRecord({
            timestamp: block.timestamp,
            blockNumber: block.number,
            user: user,
            userProfile: userProfile,
            actionType: actionType,
            resource: resource,
            action: action,
            dataHash: dataHash,
            success: success,
            metadata: metadata
        });
        
        // Add to indexes
        userActions[user].push(recordId);
        userProfileActions[user][userProfile].push(recordId); // New profile-based index
        profileActions[userProfile].push(recordId); // Profile-only index
        resourceActions[resource].push(recordId);
        actionsByType[actionType].push(recordId);
        
        emit AuditRecordCreated(recordId, user, actionType, resource, block.timestamp);
    }
    
    /**
     * @dev Get audit records for a user (all records - use with caution for large datasets)
     */
    function getUserActions(address user) external view returns (uint256[] memory) {
        return userActions[user];
    }

    /**
     * @dev Get paginated user actions with latest-first option
     * @param user User address
     * @param offset Number of records to skip
     * @param limit Maximum number of records to return
     * @param latestFirst If true, returns newest records first
     * @return records Array of record IDs
     * @return total Total number of records for this user
     */
    function getUserActionsPaginated(
        address user,
        uint256 offset,
        uint256 limit,
        bool latestFirst
    ) external view returns (uint256[] memory records, uint256 total) {
        uint256[] storage userRecords = userActions[user];
        total = userRecords.length;
        
        if (total == 0 || offset >= total) {
            return (new uint256[](0), total);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        uint256 length = end - offset;
        records = new uint256[](length);
        
        if (latestFirst) {
            // Return newest records first (reverse order)
            for (uint256 i = 0; i < length; i++) {
                records[i] = userRecords[total - 1 - offset - i];
            }
        } else {
            // Return oldest records first (normal order)
            for (uint256 i = 0; i < length; i++) {
                records[i] = userRecords[offset + i];
            }
        }
        
        return (records, total);
    }

    /**
     * @dev Get latest N actions for a user with specific profile (convenience function)
     * @param user User address
     * @param userProfile User profile to filter by
     * @param limit Maximum number of latest records to return
     * @return records Array of latest record IDs for user+profile
     */
    function getUserLatestActions(address user, UserProfile userProfile, uint256 limit) external view returns (uint256[] memory records) {
        (records, ) = this.getUserProfileActionsPaginated(user, userProfile, 0, limit, true);
        return records;
    }

    /**
     * @dev Get paginated user actions by profile with latest-first option
     * @param user User address
     * @param userProfile User profile to filter by
     * @param offset Number of records to skip
     * @param limit Maximum number of records to return
     * @param latestFirst If true, returns newest records first
     * @return records Array of record IDs
     * @return total Total number of records for this user+profile
     */
    function getUserProfileActionsPaginated(
        address user,
        UserProfile userProfile,
        uint256 offset,
        uint256 limit,
        bool latestFirst
    ) external view returns (uint256[] memory records, uint256 total) {
        uint256[] storage userProfileRecords = userProfileActions[user][userProfile];
        total = userProfileRecords.length;
        
        if (total == 0 || offset >= total) {
            return (new uint256[](0), total);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        uint256 length = end - offset;
        records = new uint256[](length);
        
        if (latestFirst) {
            // Return newest records first (reverse order)
            for (uint256 i = 0; i < length; i++) {
                records[i] = userProfileRecords[total - 1 - offset - i];
            }
        } else {
            // Return oldest records first (normal order)
            for (uint256 i = 0; i < length; i++) {
                records[i] = userProfileRecords[offset + i];
            }
        }
        
        return (records, total);
    }

    /**
     * @dev Get all actions for a user profile (all users)
     * @param userProfile Profile to filter by
     * @return records Array of all record IDs for this profile
     */
    function getProfileActions(UserProfile userProfile) external view returns (uint256[] memory) {
        return profileActions[userProfile];
    }

    /**
     * @dev Get user actions for a specific profile, including COMMON actions
     * @param user User address
     * @param userProfile User profile to get actions for (COMMON actions are always included)
     * @return records Array of record IDs including both profile-specific and common actions, ordered by timestamp
     */
    function getUserActionsForProfile(address user, UserProfile userProfile) external view returns (uint256[] memory) {
        uint256[] storage profileRecords = userProfileActions[user][userProfile];
        uint256[] storage commonRecords = userProfileActions[user][UserProfile.COMMON];
        
        uint256 totalLength = profileRecords.length + commonRecords.length;
        if (totalLength == 0) {
            return new uint256[](0);
        }
        
        // Create a combined array with timestamps for sorting
        uint256[] memory allRecords = new uint256[](totalLength);
        uint256[] memory timestamps = new uint256[](totalLength);
        
        // Copy profile-specific records
        for (uint256 i = 0; i < profileRecords.length; i++) {
            allRecords[i] = profileRecords[i];
            timestamps[i] = auditRecords[profileRecords[i]].timestamp;
        }
        
        // Copy common records
        for (uint256 i = 0; i < commonRecords.length; i++) {
            uint256 idx = profileRecords.length + i;
            allRecords[idx] = commonRecords[i];
            timestamps[idx] = auditRecords[commonRecords[i]].timestamp;
        }
        
        // Simple bubble sort by timestamp (ascending order - oldest first)
        for (uint256 i = 0; i < totalLength - 1; i++) {
            for (uint256 j = 0; j < totalLength - i - 1; j++) {
                if (timestamps[j] > timestamps[j + 1]) {
                    // Swap timestamps
                    uint256 tempTime = timestamps[j];
                    timestamps[j] = timestamps[j + 1];
                    timestamps[j + 1] = tempTime;
                    
                    // Swap record IDs
                    uint256 tempRecord = allRecords[j];
                    allRecords[j] = allRecords[j + 1];
                    allRecords[j + 1] = tempRecord;
                }
            }
        }
        
        return allRecords;
    }

    /**
     * @dev Get paginated user actions for a specific profile, including COMMON actions
     * @param user User address
     * @param userProfile User profile to get actions for (COMMON actions are always included)
     * @param offset Number of records to skip
     * @param limit Maximum number of records to return
     * @param latestFirst If true, returns newest records first
     * @return records Array of record IDs
     * @return total Total number of matching records
     */
    function getUserActionsForProfilePaginated(
        address user,
        UserProfile userProfile,
        uint256 offset,
        uint256 limit,
        bool latestFirst
    ) external view returns (uint256[] memory records, uint256 total) {
        uint256[] storage profileRecords = userProfileActions[user][userProfile];
        uint256[] storage commonRecords = userProfileActions[user][UserProfile.COMMON];
        
        total = profileRecords.length + commonRecords.length;
        
        if (total == 0 || offset >= total) {
            return (new uint256[](0), total);
        }
        
        // Create a combined array with timestamps for sorting
        uint256[] memory allRecords = new uint256[](total);
        uint256[] memory timestamps = new uint256[](total);
        
        // Copy profile-specific records
        for (uint256 i = 0; i < profileRecords.length; i++) {
            allRecords[i] = profileRecords[i];
            timestamps[i] = auditRecords[profileRecords[i]].timestamp;
        }
        
        // Copy common records
        for (uint256 i = 0; i < commonRecords.length; i++) {
            uint256 idx = profileRecords.length + i;
            allRecords[idx] = commonRecords[i];
            timestamps[idx] = auditRecords[commonRecords[i]].timestamp;
        }
        
        // Simple bubble sort by timestamp
        for (uint256 i = 0; i < total - 1; i++) {
            for (uint256 j = 0; j < total - i - 1; j++) {
                bool shouldSwap = latestFirst ? 
                    timestamps[j] < timestamps[j + 1] : // For latest first, sort descending
                    timestamps[j] > timestamps[j + 1];  // For oldest first, sort ascending
                
                if (shouldSwap) {
                    // Swap timestamps
                    uint256 tempTime = timestamps[j];
                    timestamps[j] = timestamps[j + 1];
                    timestamps[j + 1] = tempTime;
                    
                    // Swap record IDs
                    uint256 tempRecord = allRecords[j];
                    allRecords[j] = allRecords[j + 1];
                    allRecords[j + 1] = tempRecord;
                }
            }
        }
        
        // Apply pagination after sorting
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        uint256 length = end - offset;
        records = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            records[i] = allRecords[offset + i];
        }
        
        return (records, total);
    }
 
    /**
     * @dev Get audit records for a resource
     */
    function getResourceActions(string memory resource) external view returns (uint256[] memory) {
        return resourceActions[resource];
    }

    /**
     * @dev Get paginated resource actions with latest-first option
     */
    function getResourceActionsPaginated(
        string memory resource,
        uint256 offset,
        uint256 limit,
        bool latestFirst
    ) external view returns (uint256[] memory records, uint256 total) {
        uint256[] storage resourceRecords = resourceActions[resource];
        total = resourceRecords.length;
        
        if (total == 0 || offset >= total) {
            return (new uint256[](0), total);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        uint256 length = end - offset;
        records = new uint256[](length);
        
        if (latestFirst) {
            for (uint256 i = 0; i < length; i++) {
                records[i] = resourceRecords[total - 1 - offset - i];
            }
        } else {
            for (uint256 i = 0; i < length; i++) {
                records[i] = resourceRecords[offset + i];
            }
        }
        
        return (records, total);
    }

    /**
     * @dev Get audit records by action type
     */
    function getActionsByType(ActionType actionType) external view returns (uint256[] memory) {
        return actionsByType[actionType];
    }

    /**
     * @dev Get paginated actions by type with latest-first option
     */
    function getActionsByTypePaginated(
        ActionType actionType,
        uint256 offset,
        uint256 limit,
        bool latestFirst
    ) external view returns (uint256[] memory records, uint256 total) {
        uint256[] storage typeRecords = actionsByType[actionType];
        total = typeRecords.length;
        
        if (total == 0 || offset >= total) {
            return (new uint256[](0), total);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        uint256 length = end - offset;
        records = new uint256[](length);
        
        if (latestFirst) {
            for (uint256 i = 0; i < length; i++) {
                records[i] = typeRecords[total - 1 - offset - i];
            }
        } else {
            for (uint256 i = 0; i < length; i++) {
                records[i] = typeRecords[offset + i];
            }
        }
        
        return (records, total);
    }

    /**
     * @dev Get paginated audit records
     */
    function getAuditRecords(
        uint256 offset,
        uint256 limit
    ) external view returns (AuditRecord[] memory records, uint256 total) {
        require(offset < totalRecords, "Offset exceeds total records");
        
        uint256 end = offset + limit;
        if (end > totalRecords) {
            end = totalRecords;
        }
        
        uint256 length = end - offset;
        records = new AuditRecord[](length);
        
        for (uint256 i = 0; i < length; i++) {
            records[i] = auditRecords[offset + i];
        }
        
        return (records, totalRecords);
    }
    
    /**
     * @dev Authorize a logger
     */
    function authorizeLogger(address logger) external onlyAuditManager {
        authorizedLoggers[logger] = true;
        emit LoggerAuthorized(logger, msg.sender);
        
        _logAction(
            msg.sender,
            UserProfile.ADMIN,
            ActionType.ADMIN_ACTION,
            "AuditTrail",
            "Logger authorized",
            keccak256(abi.encodePacked(logger)),
            true,
            string(abi.encodePacked("{\"authorizedLogger\":\"", toHexString(logger), "\"}"))
        );
    }
    
    /**
     * @dev Revoke logger authorization
     */
    function revokeLogger(address logger) external onlyAuditManager {
        authorizedLoggers[logger] = false;
        emit LoggerRevoked(logger, msg.sender);
        
        _logAction(
            msg.sender,
            UserProfile.ADMIN,
            ActionType.ADMIN_ACTION,
            "AuditTrail",
            "Logger revoked",
            keccak256(abi.encodePacked(logger)),
            true,
            string(abi.encodePacked("{\"revokedLogger\":\"", toHexString(logger), "\"}"))
        );
    }
    
    /**
     * @dev Convert address to hex string
     */
    function toHexString(address addr) internal pure returns (string memory) {
        bytes memory buffer = new bytes(42);
        buffer[0] = '0';
        buffer[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            uint8 byteValue = uint8(uint160(addr) >> (8 * (19 - i)));
            buffer[2 + i * 2] = bytes1(byteValue >> 4 < 10 ? byteValue >> 4 + 48 : byteValue >> 4 + 87);
            buffer[3 + i * 2] = bytes1(byteValue & 0x0f < 10 ? byteValue & 0x0f + 48 : byteValue & 0x0f + 87);
        }
        return string(buffer);
    }
}