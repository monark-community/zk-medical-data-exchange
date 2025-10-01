// Auto-generated contract ABIs
// Generated on 2025-09-30T16:38:09.555Z

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
        "internalType": "uint256[1]",
        "name": "_pubSignals",
        "type": "uint256[1]"
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

