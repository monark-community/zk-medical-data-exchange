/* eslint-disable no-unused-vars */
// Enums matching Solidity contract
export enum VoteChoice {
  None = 0,
  For = 1,
  Against = 2,
}

export enum ProposalState {
  Active = 0,
  Passed = 1,
  Failed = 2,
  Executed = 3,
}

export enum ProposalCategory {
  Economics = 0,
  Privacy = 1,
  Governance = 2,
  Policy = 3,
  Other = 4,
}

export interface Proposal {
  id: number;
  title: string;
  description: string;
  category: ProposalCategory;
  proposer: string;
  startTime: number;
  endTime: number;
  votesFor: number;
  votesAgainst: number;
  totalVoters: number;
  executed: boolean;
  state: ProposalState;
  timeRemaining?: number;
  hasVoted?: boolean;
  userVote?: VoteChoice;
}
