/**
 * Smart Contract ABIs and Constants
 * 
 * This file contains ABIs for the smart contracts used in the ZK Medical Data Exchange platform.
 */

/**
 * Study.sol ABI - Contains the essential functions for interacting with Study contracts
 * Includes the new dynamic binning functions
 */
export const STUDY_ABI = [
  // Study status functions
  {
    inputs: [],
    name: 'getStudyStatus',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Participant management
  {
    inputs: [],
    name: 'getParticipantList',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'studyCreator',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Dynamic binning functions
  {
    inputs: [],
    name: 'getStudyBins',
    outputs: [
      {
        internalType: 'struct Study.StudyBins',
        name: '',
        type: 'tuple',
        components: [
          {
            internalType: 'struct Study.BinDefinition',
            name: 'age',
            type: 'tuple',
            components: [
              { internalType: 'bool', name: 'enabled', type: 'bool' },
              { internalType: 'uint256[10]', name: 'boundaries', type: 'uint256[10]' },
              { internalType: 'uint256', name: 'binCount', type: 'uint256' },
            ],
          },
          {
            internalType: 'struct Study.BinDefinition',
            name: 'cholesterol',
            type: 'tuple',
            components: [
              { internalType: 'bool', name: 'enabled', type: 'bool' },
              { internalType: 'uint256[10]', name: 'boundaries', type: 'uint256[10]' },
              { internalType: 'uint256', name: 'binCount', type: 'uint256' },
            ],
          },
          {
            internalType: 'struct Study.BinDefinition',
            name: 'bmi',
            type: 'tuple',
            components: [
              { internalType: 'bool', name: 'enabled', type: 'bool' },
              { internalType: 'uint256[10]', name: 'boundaries', type: 'uint256[10]' },
              { internalType: 'uint256', name: 'binCount', type: 'uint256' },
            ],
          },
          {
            internalType: 'struct Study.BinDefinition',
            name: 'hba1c',
            type: 'tuple',
            components: [
              { internalType: 'bool', name: 'enabled', type: 'bool' },
              { internalType: 'uint256[10]', name: 'boundaries', type: 'uint256[10]' },
              { internalType: 'uint256', name: 'binCount', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAgeBins',
    outputs: [
      {
        internalType: 'struct Study.BinDefinition',
        name: '',
        type: 'tuple',
        components: [
          { internalType: 'bool', name: 'enabled', type: 'bool' },
          { internalType: 'uint256[10]', name: 'boundaries', type: 'uint256[10]' },
          { internalType: 'uint256', name: 'binCount', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCholesterolBins',
    outputs: [
      {
        internalType: 'struct Study.BinDefinition',
        name: '',
        type: 'tuple',
        components: [
          { internalType: 'bool', name: 'enabled', type: 'bool' },
          { internalType: 'uint256[10]', name: 'boundaries', type: 'uint256[10]' },
          { internalType: 'uint256', name: 'binCount', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getBMIBins',
    outputs: [
      {
        internalType: 'struct Study.BinDefinition',
        name: '',
        type: 'tuple',
        components: [
          { internalType: 'bool', name: 'enabled', type: 'bool' },
          { internalType: 'uint256[10]', name: 'boundaries', type: 'uint256[10]' },
          { internalType: 'uint256', name: 'binCount', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getHbA1cBins',
    outputs: [
      {
        internalType: 'struct Study.BinDefinition',
        name: '',
        type: 'tuple',
        components: [
          { internalType: 'bool', name: 'enabled', type: 'bool' },
          { internalType: 'uint256[10]', name: 'boundaries', type: 'uint256[10]' },
          { internalType: 'uint256', name: 'binCount', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'field', type: 'string' },
      { internalType: 'uint256', name: 'binIndex', type: 'uint256' },
    ],
    name: 'isValidBinIndex',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Study Factory ABI - For creating new studies
 */
export const STUDY_FACTORY_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'title', type: 'string' },
      { internalType: 'string', name: 'description', type: 'string' },
      { internalType: 'string', name: 'ipfsHash', type: 'string' },
      { internalType: 'uint256', name: 'maxParticipants', type: 'uint256' },
      { internalType: 'uint256', name: 'endDate', type: 'uint256' },
      {
        internalType: 'struct Study.StudyBins',
        name: 'bins',
        type: 'tuple',
        components: [
          {
            internalType: 'struct Study.BinDefinition',
            name: 'age',
            type: 'tuple',
            components: [
              { internalType: 'bool', name: 'enabled', type: 'bool' },
              { internalType: 'uint256[10]', name: 'boundaries', type: 'uint256[10]' },
              { internalType: 'uint256', name: 'binCount', type: 'uint256' },
            ],
          },
          {
            internalType: 'struct Study.BinDefinition',
            name: 'cholesterol',
            type: 'tuple',
            components: [
              { internalType: 'bool', name: 'enabled', type: 'bool' },
              { internalType: 'uint256[10]', name: 'boundaries', type: 'uint256[10]' },
              { internalType: 'uint256', name: 'binCount', type: 'uint256' },
            ],
          },
          {
            internalType: 'struct Study.BinDefinition',
            name: 'bmi',
            type: 'tuple',
            components: [
              { internalType: 'bool', name: 'enabled', type: 'bool' },
              { internalType: 'uint256[10]', name: 'boundaries', type: 'uint256[10]' },
              { internalType: 'uint256', name: 'binCount', type: 'uint256' },
            ],
          },
          {
            internalType: 'struct Study.BinDefinition',
            name: 'hba1c',
            type: 'tuple',
            components: [
              { internalType: 'bool', name: 'enabled', type: 'bool' },
              { internalType: 'uint256[10]', name: 'boundaries', type: 'uint256[10]' },
              { internalType: 'uint256', name: 'binCount', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    name: 'createStudy',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
