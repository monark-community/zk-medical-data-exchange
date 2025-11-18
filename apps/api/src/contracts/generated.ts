// Auto-generated contract ABIs
// Generated on 2025-11-18T00:13:41.063Z

// ABI type definitions
interface ABIInput {
  internalType: string;
  name: string;
  type: string;
  components?: ABIInput[];
  indexed?: boolean; // For event inputs
}

interface ABIOutput {
  internalType: string;
  name: string;
  type: string;
  components?: ABIOutput[];
}

interface ABIItem {
  type: 'function' | 'event' | 'constructor' | 'fallback' | 'receive' | 'error';
  name?: string;
  inputs?: ABIInput[];
  outputs?: ABIOutput[];
  stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable';
  anonymous?: boolean;
}

export type ABI = readonly ABIItem[];

export const STUDY_FACTORY_ABI: ABI = [
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "_openCreation",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bool",
        "name": "openCreation",
        "type": "bool"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "changedBy",
        "type": "address"
      }
    ],
    "name": "CreationModeChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "authorizedBy",
        "type": "address"
      }
    ],
    "name": "CreatorAuthorized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "revokedBy",
        "type": "address"
      }
    ],
    "name": "CreatorRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "studyId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "studyContract",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "principalInvestigator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      }
    ],
    "name": "StudyCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "studyId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "deactivatedBy",
        "type": "address"
      }
    ],
    "name": "StudyDeactivated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "activeStudyCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "studyId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "researcher",
        "type": "address"
      }
    ],
    "name": "addResearcherToStudy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "authorizeCreator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "authorizedCreators",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "canCreateStudies",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "maxParticipants",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "startDate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endDate",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "principalInvestigator",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "zkVerifierAddress",
        "type": "address"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "enableAge",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minAge",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxAge",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableCholesterol",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minCholesterol",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxCholesterol",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableBMI",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minBMI",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxBMI",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableBloodType",
            "type": "uint256"
          },
          {
            "internalType": "uint256[4]",
            "name": "allowedBloodTypes",
            "type": "uint256[4]"
          },
          {
            "internalType": "uint256",
            "name": "enableGender",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "allowedGender",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableLocation",
            "type": "uint256"
          },
          {
            "internalType": "uint256[4]",
            "name": "allowedRegions",
            "type": "uint256[4]"
          },
          {
            "internalType": "uint256",
            "name": "enableBloodPressure",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minSystolic",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxSystolic",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minDiastolic",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxDiastolic",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableHbA1c",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minHbA1c",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxHbA1c",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableSmoking",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "allowedSmoking",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableActivity",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minActivityLevel",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxActivityLevel",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableDiabetes",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "allowedDiabetes",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableHeartDisease",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "allowedHeartDisease",
            "type": "uint256"
          }
        ],
        "internalType": "struct Study.StudyCriteria",
        "name": "customCriteria",
        "type": "tuple"
      }
    ],
    "name": "createStudy",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "studyId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "studyAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "studyId",
        "type": "uint256"
      }
    ],
    "name": "deactivateStudy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getActiveStudies",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "studyIds",
        "type": "uint256[]"
      },
      {
        "internalType": "bool",
        "name": "hasMore",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getStatistics",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalStudies",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "activeStudies",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalPIs",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "pi",
        "type": "address"
      }
    ],
    "name": "getStudiesByPI",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "researcher",
        "type": "address"
      }
    ],
    "name": "getStudiesByResearcher",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "studyId",
        "type": "uint256"
      }
    ],
    "name": "getStudy",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "studyContract",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "title",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "principalInvestigator",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "maxParticipants",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "startDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "endDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          }
        ],
        "internalType": "struct StudyFactory.StudyRegistry",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "studyId",
        "type": "uint256"
      }
    ],
    "name": "getStudyContract",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "openCreation",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "revokeCreator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "searchTerm",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "searchStudiesByTitle",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "_openCreation",
        "type": "bool"
      }
    ],
    "name": "setCreationMode",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "studies",
    "outputs": [
      {
        "internalType": "address",
        "name": "studyContract",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "principalInvestigator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "maxParticipants",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "startDate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endDate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "active",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "studiesByPI",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "studiesByResearcher",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "studyCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "studyToId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const STUDY_ABI: ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_title",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_maxParticipants",
        "type": "uint256"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "enableAge",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minAge",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxAge",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableCholesterol",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minCholesterol",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxCholesterol",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableBMI",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minBMI",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxBMI",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableBloodType",
            "type": "uint256"
          },
          {
            "internalType": "uint256[4]",
            "name": "allowedBloodTypes",
            "type": "uint256[4]"
          },
          {
            "internalType": "uint256",
            "name": "enableGender",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "allowedGender",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableLocation",
            "type": "uint256"
          },
          {
            "internalType": "uint256[4]",
            "name": "allowedRegions",
            "type": "uint256[4]"
          },
          {
            "internalType": "uint256",
            "name": "enableBloodPressure",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minSystolic",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxSystolic",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minDiastolic",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxDiastolic",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableHbA1c",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minHbA1c",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxHbA1c",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableSmoking",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "allowedSmoking",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableActivity",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minActivityLevel",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxActivityLevel",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableDiabetes",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "allowedDiabetes",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableHeartDisease",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "allowedHeartDisease",
            "type": "uint256"
          }
        ],
        "internalType": "struct Study.StudyCriteria",
        "name": "_criteria",
        "type": "tuple"
      },
      {
        "internalType": "address",
        "name": "_zkVerifierAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "binId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newCount",
        "type": "uint256"
      }
    ],
    "name": "BinCountUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "binCount",
        "type": "uint256"
      }
    ],
    "name": "BinsConfigured",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "participant",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "commitmentHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "CommitmentRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "participant",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ConsentGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "participant",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ConsentRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "participant",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "eligible",
        "type": "bool"
      }
    ],
    "name": "EligibilityVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "participant",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "dataCommitment",
        "type": "uint256"
      }
    ],
    "name": "ParticipantJoined",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "activeParticipants",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "areBinsConfigured",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "binCounts",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "bins",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "binId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "criteriaField",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "binType",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "label",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "minValue",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxValue",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "includeMin",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "includeMax",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "categoriesBitmap",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "commitmentTimestamps",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "binId",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "criteriaField",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "binType",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "label",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "minValue",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxValue",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "includeMin",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "includeMax",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "categoriesBitmap",
            "type": "uint256"
          }
        ],
        "internalType": "struct Study.DataBin[]",
        "name": "_bins",
        "type": "tuple[]"
      },
      {
        "internalType": "address",
        "name": "caller",
        "type": "address"
      }
    ],
    "name": "configureBins",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "criteria",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "enableAge",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minAge",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxAge",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "enableCholesterol",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minCholesterol",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxCholesterol",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "enableBMI",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minBMI",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxBMI",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "enableBloodType",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "enableGender",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "allowedGender",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "enableLocation",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "enableBloodPressure",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minSystolic",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxSystolic",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minDiastolic",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxDiastolic",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "enableHbA1c",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minHbA1c",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxHbA1c",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "enableSmoking",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "allowedSmoking",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "enableActivity",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minActivityLevel",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxActivityLevel",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "enableDiabetes",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "allowedDiabetes",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "enableHeartDisease",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "allowedHeartDisease",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentParticipants",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllBinCounts",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "binId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "count",
            "type": "uint256"
          }
        ],
        "internalType": "struct Study.BinCount[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "binId",
        "type": "uint256"
      }
    ],
    "name": "getBinCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBins",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "binId",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "criteriaField",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "binType",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "label",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "minValue",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxValue",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "includeMin",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "includeMax",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "categoriesBitmap",
            "type": "uint256"
          }
        ],
        "internalType": "struct Study.DataBin[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getConsentedParticipants",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getParticipantCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "addr",
        "type": "address"
      }
    ],
    "name": "getParticipantDataCommitment",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "addr",
        "type": "address"
      }
    ],
    "name": "getRegisteredCommitment",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "commitmentHash",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getStudyCriteria",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "enableAge",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minAge",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxAge",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableCholesterol",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minCholesterol",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxCholesterol",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableBMI",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minBMI",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxBMI",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableBloodType",
            "type": "uint256"
          },
          {
            "internalType": "uint256[4]",
            "name": "allowedBloodTypes",
            "type": "uint256[4]"
          },
          {
            "internalType": "uint256",
            "name": "enableGender",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "allowedGender",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableLocation",
            "type": "uint256"
          },
          {
            "internalType": "uint256[4]",
            "name": "allowedRegions",
            "type": "uint256[4]"
          },
          {
            "internalType": "uint256",
            "name": "enableBloodPressure",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minSystolic",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxSystolic",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minDiastolic",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxDiastolic",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableHbA1c",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minHbA1c",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxHbA1c",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableSmoking",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "allowedSmoking",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableActivity",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minActivityLevel",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxActivityLevel",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableDiabetes",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "allowedDiabetes",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "enableHeartDisease",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "allowedHeartDisease",
            "type": "uint256"
          }
        ],
        "internalType": "struct Study.StudyCriteria",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalEnrolled",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "participant",
        "type": "address"
      }
    ],
    "name": "grantConsent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "addr",
        "type": "address"
      }
    ],
    "name": "hasActiveConsent",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasConsented",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "addr",
        "type": "address"
      }
    ],
    "name": "isParticipant",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[2]",
        "name": "_pA",
        "type": "uint256[2]"
      },
      {
        "internalType": "uint256[2][2]",
        "name": "_pB",
        "type": "uint256[2][2]"
      },
      {
        "internalType": "uint256[2]",
        "name": "_pC",
        "type": "uint256[2]"
      },
      {
        "internalType": "uint256",
        "name": "dataCommitment",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "challenge",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "participant",
        "type": "address"
      },
      {
        "internalType": "uint256[]",
        "name": "binIds",
        "type": "uint256[]"
      }
    ],
    "name": "joinStudy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxParticipants",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "participantDataCommitments",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "participantList",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "participants",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "dataCommitment",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "challenge",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "participant",
        "type": "address"
      }
    ],
    "name": "registerCommitment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "registeredCommitments",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "participant",
        "type": "address"
      }
    ],
    "name": "revokeConsent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "studyCreator",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "studyTitle",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "addr",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "dataCommitment",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "challenge",
        "type": "bytes32"
      }
    ],
    "name": "verifyCommitmentMatch",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "zkVerifier",
    "outputs": [
      {
        "internalType": "contract Groth16Verifier",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const MEDICAL_ELIGIBILITY_VERIFIER_ABI: ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256[2]",
        "name": "_pA",
        "type": "uint256[2]"
      },
      {
        "internalType": "uint256[2][2]",
        "name": "_pB",
        "type": "uint256[2][2]"
      },
      {
        "internalType": "uint256[2]",
        "name": "_pC",
        "type": "uint256[2]"
      },
      {
        "internalType": "uint256[51]",
        "name": "_pubSignals",
        "type": "uint256[51]"
      }
    ],
    "name": "verifyProof",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const AUDIT_TRAIL_ABI: ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "recordId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "enum AuditTrail.ActionType",
        "name": "actionType",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "resource",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "AuditRecordCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "logger",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "authorizedBy",
        "type": "address"
      }
    ],
    "name": "LoggerAuthorized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "logger",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "revokedBy",
        "type": "address"
      }
    ],
    "name": "LoggerRevoked",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "enum AuditTrail.ActionType",
        "name": "",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "actionsByType",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "auditManager",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "auditRecords",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "blockNumber",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "enum AuditTrail.UserProfile",
        "name": "userProfile",
        "type": "uint8"
      },
      {
        "internalType": "enum AuditTrail.ActionType",
        "name": "actionType",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "resource",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "action",
        "type": "string"
      },
      {
        "internalType": "bytes32",
        "name": "dataHash",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "metadata",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "logger",
        "type": "address"
      }
    ],
    "name": "authorizeLogger",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "authorizedLoggers",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum AuditTrail.ActionType",
        "name": "actionType",
        "type": "uint8"
      }
    ],
    "name": "getActionsByType",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum AuditTrail.ActionType",
        "name": "actionType",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "latestFirst",
        "type": "bool"
      }
    ],
    "name": "getActionsByTypePaginated",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "records",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getAuditRecords",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "blockNumber",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "internalType": "enum AuditTrail.UserProfile",
            "name": "userProfile",
            "type": "uint8"
          },
          {
            "internalType": "enum AuditTrail.ActionType",
            "name": "actionType",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "resource",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "action",
            "type": "string"
          },
          {
            "internalType": "bytes32",
            "name": "dataHash",
            "type": "bytes32"
          },
          {
            "internalType": "bool",
            "name": "success",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "metadata",
            "type": "string"
          }
        ],
        "internalType": "struct AuditTrail.AuditRecord[]",
        "name": "records",
        "type": "tuple[]"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum AuditTrail.UserProfile",
        "name": "userProfile",
        "type": "uint8"
      }
    ],
    "name": "getProfileActions",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "resource",
        "type": "string"
      }
    ],
    "name": "getResourceActions",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "resource",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "latestFirst",
        "type": "bool"
      }
    ],
    "name": "getResourceActionsPaginated",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "records",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserActions",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "enum AuditTrail.UserProfile",
        "name": "userProfile",
        "type": "uint8"
      }
    ],
    "name": "getUserActionsForProfile",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "enum AuditTrail.UserProfile",
        "name": "userProfile",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "latestFirst",
        "type": "bool"
      }
    ],
    "name": "getUserActionsForProfilePaginated",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "records",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "latestFirst",
        "type": "bool"
      }
    ],
    "name": "getUserActionsPaginated",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "records",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "enum AuditTrail.UserProfile",
        "name": "userProfile",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getUserLatestActions",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "records",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "enum AuditTrail.UserProfile",
        "name": "userProfile",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "latestFirst",
        "type": "bool"
      }
    ],
    "name": "getUserProfileActionsPaginated",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "records",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "enum AuditTrail.UserProfile",
        "name": "userProfile",
        "type": "uint8"
      },
      {
        "internalType": "enum AuditTrail.ActionType",
        "name": "actionType",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "resource",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "action",
        "type": "string"
      },
      {
        "internalType": "bytes32",
        "name": "dataHash",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "metadata",
        "type": "string"
      }
    ],
    "name": "logAction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "participants",
        "type": "address[]"
      },
      {
        "internalType": "enum AuditTrail.UserProfile",
        "name": "userProfile",
        "type": "uint8"
      },
      {
        "internalType": "enum AuditTrail.ActionType",
        "name": "actionType",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "resource",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "action",
        "type": "string"
      },
      {
        "internalType": "bytes32",
        "name": "dataHash",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "metadata",
        "type": "string"
      }
    ],
    "name": "logActionForParticipants",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum AuditTrail.UserProfile",
        "name": "",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "profileActions",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "resourceActions",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "logger",
        "type": "address"
      }
    ],
    "name": "revokeLogger",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalRecords",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "userActions",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "enum AuditTrail.UserProfile",
        "name": "",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "userProfileActions",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const GOVERNANCE_FACTORY_ABI: ABI = [
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "_openCreation",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bool",
        "name": "openCreation",
        "type": "bool"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "changedBy",
        "type": "address"
      }
    ],
    "name": "CreationModeChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "authorizedBy",
        "type": "address"
      }
    ],
    "name": "CreatorAuthorized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "revokedBy",
        "type": "address"
      }
    ],
    "name": "CreatorRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "proposalId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "proposalContract",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "proposer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      }
    ],
    "name": "ProposalCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "proposalId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "deactivatedBy",
        "type": "address"
      }
    ],
    "name": "ProposalDeactivated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "authorizeCreator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "authorizedCreators",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "enum Proposal.ProposalCategory",
        "name": "category",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "duration",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "proposer",
        "type": "address"
      }
    ],
    "name": "createProposal",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "proposalId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "proposalAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "proposalId",
        "type": "uint256"
      }
    ],
    "name": "deactivateProposal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "openCreation",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "proposalAddressToId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "proposalCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "proposals",
    "outputs": [
      {
        "internalType": "address",
        "name": "proposalContract",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "enum Proposal.ProposalCategory",
        "name": "category",
        "type": "uint8"
      },
      {
        "internalType": "address",
        "name": "proposer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "active",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "proposalsByProposer",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "revokeCreator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "_openCreation",
        "type": "bool"
      }
    ],
    "name": "setCreationMode",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const PROPOSAL_ABI: ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "enum Proposal.ProposalCategory",
        "name": "_category",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "_duration",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_proposer",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "updatedBy",
        "type": "address"
      }
    ],
    "name": "DescriptionUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newEndTime",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "updatedBy",
        "type": "address"
      }
    ],
    "name": "DurationExtended",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "enum Proposal.ProposalState",
        "name": "newState",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ProposalStateChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "newTitle",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "updatedBy",
        "type": "address"
      }
    ],
    "name": "TitleUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "voter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum Proposal.VoteChoice",
        "name": "choice",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "VoteCast",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "category",
    "outputs": [
      {
        "internalType": "enum Proposal.ProposalCategory",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "description",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "endTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "extraSeconds",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "caller",
        "type": "address"
      }
    ],
    "name": "extendDuration",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "finalize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getState",
    "outputs": [
      {
        "internalType": "enum Proposal.ProposalState",
        "name": "_currentState",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "_votesFor",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_votesAgainst",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_totalVoters",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasVoted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "startTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "state",
    "outputs": [
      {
        "internalType": "enum Proposal.ProposalState",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "title",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalVoters",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "newDescription",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "caller",
        "type": "address"
      }
    ],
    "name": "updateDescription",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "newTitle",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "caller",
        "type": "address"
      }
    ],
    "name": "updateTitle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum Proposal.VoteChoice",
        "name": "choice",
        "type": "uint8"
      },
      {
        "internalType": "address",
        "name": "voter",
        "type": "address"
      }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "votes",
    "outputs": [
      {
        "internalType": "enum Proposal.VoteChoice",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "votesAgainst",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "votesFor",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const DISPERSE_ABI: ABI = [
  {
    "inputs": [],
    "name": "EmptyArray",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InsufficientAllowance",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InsufficientAmount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "LengthMismatch",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TransferFailed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ValueMismatch",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "count",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "name": "DisperseETH",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "count",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "name": "DisperseToken",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "RescueETH",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "RescueToken",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "recipients",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      }
    ],
    "name": "disperseETH",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "recipients",
        "type": "address[]"
      },
      {
        "internalType": "uint256",
        "name": "amountEach",
        "type": "uint256"
      }
    ],
    "name": "disperseETHEqual",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IERC20",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "address[]",
        "name": "recipients",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      }
    ],
    "name": "disperseToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IERC20",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "address[]",
        "name": "recipients",
        "type": "address[]"
      },
      {
        "internalType": "uint256",
        "name": "amountEach",
        "type": "uint256"
      }
    ],
    "name": "disperseTokenEqual",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "rescueETH",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IERC20",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "rescueToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
] as const;

