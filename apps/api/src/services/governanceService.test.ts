import { describe, it, expect, mock, beforeEach, afterEach, beforeAll } from "bun:test";

(process.env as any).NODE_ENV = "test";

const mockPublicClient: any = {
  readContract: mock<() => Promise<any>>(() => Promise.resolve(BigInt(0))),
  waitForTransactionReceipt: mock<() => Promise<any>>(() =>
    Promise.resolve({
      logs: [],
      status: "success",
    })
  ),
};

const mockWalletClient: any = {
  writeContract: mock<() => Promise<string>>(() =>
    Promise.resolve("0x" + "a".repeat(64))
  ),
};

const mockDecodeEventLog = mock<() => any>(() => {
  throw new Error("No matching event");
});

mock.module("viem", () => ({
  createPublicClient: mock(() => mockPublicClient),
  createWalletClient: mock(() => mockWalletClient),
  http: mock(() => ({})),
  sepolia: {},
  decodeEventLog: mockDecodeEventLog,
}));

const mockAccount = {
  address: "0x" + "b".repeat(40),
};
mock.module("viem/accounts", () => ({
  privateKeyToAccount: mock(() => mockAccount),
}));

const mockLogger = {
  info: mock(() => {}),
  error: mock(() => {}),
  warn: mock(() => {}),
  debug: mock(() => {}),
};
mock.module("@/utils/logger", () => ({
  default: mockLogger,
}));

const mockSupabaseQuery: any = {
  select: mock(() => mockSupabaseQuery),
  eq: mock(() => mockSupabaseQuery),
  in: mock(() => mockSupabaseQuery),
  order: mock(() => mockSupabaseQuery),
  insert: mock(async () => ({ data: null, error: null })),
  update: mock(async () => ({ data: null, error: null })),
  single: mock(async () => ({ data: null, error: null })),
};

const mockSupabase = {
  from: mock((_table: string) => mockSupabaseQuery),
};

mock.module("@supabase/supabase-js", () => ({
  createClient: mock(() => mockSupabase),
}));

const mockConfig = {
  SEPOLIA_PRIVATE_KEY: "0x" + "1".repeat(64),
  SEPOLIA_RPC_URL: "https://sepolia.infura.io/v3/test",
  GOVERNANCE_DAO_ADDRESS: "0x" + "2".repeat(40),
  SUPABASE_URL: "https://supabase.test",
  SUPABASE_KEY: "supabase-key",
};
mock.module("@/config/config", () => ({
  Config: mockConfig,
}));

mock.module("@/contracts/generated", () => ({
  GOVERNANCE_FACTORY_ABI: [] as any[],
  PROPOSAL_ABI: [] as any[],
}));

mock.module("@/constants/db", () => ({
  TABLES: {
    USERS: {
      name: "users",
      columns: {},
    },
    PROPOSALS: {
      name: "proposals",
      columns: {
        id: "id",
        createdAt: "created_at",
        proposer: "proposer",
        state: "state",
        voterAddress: "voter_address",
        proposalId: "proposal_id",
      },
    },
    PROPOSAL_VOTES: {
      name: "proposal_votes",
      columns: {
        proposalId: "proposal_id",
        voterAddress: "voter_address",
      },
    },
  },
}));

let service: typeof import("./governanceService")["governanceService"];
let VoteChoice: typeof import("./governanceService")["VoteChoice"];
let ProposalState: typeof import("./governanceService")["ProposalState"];
let ProposalCategory: typeof import("./governanceService")["ProposalCategory"];
let originalGetProposalFromBlockchain: (
  proposalId: number,
  userAddress?: string
) => Promise<import("./governanceService").Proposal | null>;

beforeAll(async () => {
  const mod = await import("./governanceService");
  service = mod.governanceService;
  VoteChoice = mod.VoteChoice;
  ProposalState = mod.ProposalState;
  ProposalCategory = mod.ProposalCategory;
  originalGetProposalFromBlockchain = (service as any).getProposalFromBlockchain;
});

describe("GovernanceService", () => {
  beforeEach(() => {
    (service as any).getProposalFromBlockchain =
      originalGetProposalFromBlockchain;

    mockPublicClient.readContract = mock<() => Promise<any>>(
      () => Promise.resolve(BigInt(0))
    );
    mockPublicClient.waitForTransactionReceipt = mock<() => Promise<any>>(
      () =>
        Promise.resolve({
          logs: [],
          status: "success",
        })
    );
    mockWalletClient.writeContract = mock<() => Promise<string>>(
      () => Promise.resolve("0x" + "a".repeat(64))
    );
    mockDecodeEventLog.mockClear();

    mockSupabase.from.mockClear();
    mockSupabaseQuery.select.mockClear();
    mockSupabaseQuery.eq.mockClear();
    mockSupabaseQuery.in.mockClear();
    mockSupabaseQuery.order.mockClear();
    mockSupabaseQuery.insert.mockClear();
    mockSupabaseQuery.update.mockClear();
    mockSupabaseQuery.single.mockClear();

    (service as any).supabase = mockSupabase;

    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.debug.mockClear();

    (process.env as any).NODE_ENV = "test";
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = "test";
  });

  describe("createProposal", () => {
    it("returns error when title is empty", async () => {
      const res = await service.createProposal({
        title: "",
        description: "desc",
        category: ProposalCategory.Other,
        walletAddress: "0x" + "3".repeat(40),
        duration: 86400,
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Title cannot be empty");
      expect(mockWalletClient.writeContract).not.toHaveBeenCalled();
    });

    it("returns error when description is empty", async () => {
      const res = await service.createProposal({
        title: "Test",
        description: "",
        category: ProposalCategory.Other,
        walletAddress: "0x" + "3".repeat(40),
        duration: 86400,
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Description cannot be empty");
      expect(mockWalletClient.writeContract).not.toHaveBeenCalled();
    });

    it("returns error when no ProposalCreated event is found", async () => {
      mockPublicClient.waitForTransactionReceipt.mockResolvedValueOnce({
        logs: [],
        status: "success",
      });

      const res = await service.createProposal({
        title: "Test",
        description: "Desc",
        category: ProposalCategory.Other,
        walletAddress: "0x" + "3".repeat(40),
        duration: 86400,
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe(
        "Proposal created on blockchain but ID extraction failed"
      );
      expect(mockDecodeEventLog).not.toHaveBeenCalled();
    });

    it("creates proposal successfully and stores it in database", async () => {
      const txHash = "0x" + "a".repeat(64);
      mockWalletClient.writeContract.mockResolvedValueOnce(txHash);

      mockPublicClient.waitForTransactionReceipt.mockResolvedValueOnce({
        logs: [{ data: "0x", topics: [] }],
        status: "success",
      });

      mockDecodeEventLog.mockReturnValueOnce({
        eventName: "ProposalCreated",
        args: {
          proposalId: 1,
          proposalContract: "0x" + "4".repeat(40),
        },
      });

      mockPublicClient.readContract
        .mockResolvedValueOnce(BigInt(1000)) // startTime
        .mockResolvedValueOnce(BigInt(2000)) // endTime
        .mockResolvedValueOnce(BigInt(1)) // votesFor
        .mockResolvedValueOnce(BigInt(2)) // votesAgainst
        .mockResolvedValueOnce(BigInt(3)) // totalVoters
        .mockResolvedValueOnce(BigInt(0)); // state = Active

      const res = await service.createProposal({
        title: "Test",
        description: "Desc",
        category: ProposalCategory.Other,
        walletAddress: "0x" + "3".repeat(40),
        duration: 86400,
      });

      expect(res.success).toBe(true);
      expect(res.data?.proposalId).toBe(1);
      expect(res.transactionHash).toBe(txHash);
      expect(mockWalletClient.writeContract).toHaveBeenCalledTimes(1);
      expect(mockPublicClient.waitForTransactionReceipt).toHaveBeenCalledTimes(
        1
      );
      expect(mockSupabase.from).toHaveBeenCalledWith("proposals");
      expect(mockSupabaseQuery.insert).toHaveBeenCalledTimes(1);
    });
  });

  describe("vote", () => {
    it("returns error on VoteChoice.None", async () => {
      const res = await service.vote({
        proposalId: 1,
        choice: VoteChoice.None,
        walletAddress: "0x" + "3".repeat(40),
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Invalid vote choice");
      expect(mockSupabase.from).not.toHaveBeenCalled();
      expect(mockWalletClient.writeContract).not.toHaveBeenCalled();
    });

    it("returns error when user already voted", async () => {
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: { id: 1, proposal_id: 1, voter_address: "0x" + "3".repeat(40) },
        error: null,
      });

      const res = await service.vote({
        proposalId: 1,
        choice: VoteChoice.For,
        walletAddress: "0x" + "3".repeat(40),
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Already voted on this proposal");
      expect(mockWalletClient.writeContract).not.toHaveBeenCalled();
    });
  });

  describe("getProposal", () => {
    it("returns proposal from database with timeRemaining and no blockchain call when not expired", async () => {
      const now = Math.floor(Date.now() / 1000);
      const futureEnd = now + 3600;

      // DB proposal
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: {
          id: 1,
          title: "DB Title",
          description: "DB Desc",
          category: ProposalCategory.Other,
          proposer: "0x" + "3".repeat(40),
          start_time: now - 100,
          end_time: futureEnd,
          votes_for: 1,
          votes_against: 0,
          total_voters: 1,
          state: ProposalState.Active,
        },
        error: null,
      });

      const proposal = await service.getProposal(1);

      expect(proposal).not.toBeNull();
      expect(proposal!.id).toBe(1);
      expect(proposal!.title).toBe("DB Title");
      expect(proposal!.timeRemaining).toBeGreaterThan(0);
      // Should not hit blockchain for state in this case
      expect(mockPublicClient.readContract).not.toHaveBeenCalled();
    });

    it("falls back to blockchain when not found in DB", async () => {
      // First DB call: not found
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      const blockchainProposal = {
        id: 1,
        title: "Chain Title",
        description: "Chain Desc",
        category: ProposalCategory.Other,
        proposer: "0x" + "3".repeat(40),
        startTime: 1000,
        endTime: 2000,
        votesFor: 1,
        votesAgainst: 0,
        totalVoters: 1,
        state: ProposalState.Passed,
        timeRemaining: 0,
      };

      (service as any).getProposalFromBlockchain = mock(() =>
        Promise.resolve(blockchainProposal)
      );

      const proposal = await service.getProposal(1);

      expect(proposal).not.toBeNull();
      expect(proposal!.title).toBe("Chain Title");
      expect((service as any).getProposalFromBlockchain).toHaveBeenCalledWith(
        1,
        undefined
      );
    });
  });

  describe("getProposalFromBlockchain (internal)", () => {
    it("builds proposal from on-chain data including user vote", async () => {
      const registry = {
        proposalContract: "0x" + "4".repeat(40),
        title: "On-chain Title",
        category: ProposalCategory.Other,
        proposer: "0x" + "3".repeat(40),
        startTime: 1000,
        endTime: 2000,
      };

      // order of calls:
      // 1) factory.proposals(id) -> registry
      // 2) proposal.description()
      // 3-6) votesFor, votesAgainst, totalVoters, getState()
      // 7) hasVoted(user)
      // 8) votes(user)
      mockPublicClient.readContract
        .mockResolvedValueOnce(registry)
        .mockResolvedValueOnce("On-chain description")
        .mockResolvedValueOnce(BigInt(10)) // votesFor
        .mockResolvedValueOnce(BigInt(2)) // votesAgainst
        .mockResolvedValueOnce(BigInt(12)) // totalVoters
        .mockResolvedValueOnce(BigInt(ProposalState.Passed)) // state
        .mockResolvedValueOnce(true) // hasVoted
        .mockResolvedValueOnce(BigInt(VoteChoice.For)); // user vote

      const userAddress = "0x" + "5".repeat(40);

      const proposal = await (service as any).getProposalFromBlockchain(
        1,
        userAddress
      );

      expect(proposal).not.toBeNull();
      expect(proposal!.id).toBe(1);
      expect(proposal!.title).toBe("On-chain Title");
      expect(proposal!.description).toBe("On-chain description");
      expect(proposal!.votesFor).toBe(10);
      expect(proposal!.votesAgainst).toBe(2);
      expect(proposal!.totalVoters).toBe(12);
      expect(proposal!.state).toBe(ProposalState.Passed);
      expect(proposal!.hasVoted).toBe(true);
      expect(proposal!.userVote).toBe(VoteChoice.For);
    });
  });

  describe("getAllProposals", () => {
    it("returns proposals and syncs expired active ones from blockchain", async () => {
      const now = Math.floor(Date.now() / 1000);

      const dbProposals: any[] = [
        {
          id: 1,
          title: "DB P1",
          description: "Desc",
          category: ProposalCategory.Other,
          proposer: "0x" + "3".repeat(40),
          start_time: now - 1000,
          end_time: now - 10, // expired
          votes_for: 1,
          votes_against: 0,
          total_voters: 1,
          state: ProposalState.Active,
        },
      ];

      const proposalContract = "0x" + "4".repeat(40);

      const allSupabase = {
        from: (table: string) => {
          if (table === "proposals") {
            return {
              select: (_cols: string) => ({
                order: (_col: string, _opts: any) =>
                  Promise.resolve({ data: dbProposals, error: null }),
              }),
              update: (_vals: any) => ({
                eq: (_col: string, _id: any) =>
                  Promise.resolve({ data: null, error: null }),
              }),
            };
          }

          if (table === "proposal_votes") {
            return {
              select: (_cols: string) => ({
                eq: (_col: string, _val: any) => ({
                  in: (_col2: string, _ids: any) =>
                    Promise.resolve({ data: [], error: null }),
                }),
              }),
            };
          }

          return { select: () => ({}) };
        },
      };

      (service as any).supabase = allSupabase;

      const registry = {
        proposalContract,
        title: "Chain Title",
        category: ProposalCategory.Other,
        proposer: "0x" + "3".repeat(40),
        startTime: now - 1000,
        endTime: now - 10,
      };

      // getProposalRegistryEntry -> factory.proposals()
      // sync block -> proposal.getState()
      mockPublicClient.readContract
        .mockResolvedValueOnce(registry)
        .mockResolvedValueOnce(BigInt(ProposalState.Passed));

      const proposals = (await service.getAllProposals())!;
      expect(proposals).toHaveLength(1);

      expect(proposals).toHaveLength(1);
      expect(proposals[0]!.id).toBe(1);
      expect(proposals[0]!.state).toBe(ProposalState.Passed);
      expect(proposals[0]!.timeRemaining).toBe(0);
    });
  });

  describe("getUserProposals", () => {
    it("returns user's proposals with vote flags", async () => {
      const now = Math.floor(Date.now() / 1000);
      const userAddress = "0x" + "3".repeat(40);

      const dbProposals: any[] = [
        {
          id: 1,
          title: "P1",
          description: "Desc 1",
          category: ProposalCategory.Other,
          proposer: userAddress,
          start_time: now - 100,
          end_time: now + 100,
          votes_for: 1,
          votes_against: 0,
          total_voters: 1,
          state: ProposalState.Active,
        },
        {
          id: 2,
          title: "P2",
          description: "Desc 2",
          category: ProposalCategory.Economics,
          proposer: userAddress,
          start_time: now - 200,
          end_time: now + 200,
          votes_for: 0,
          votes_against: 1,
          total_voters: 1,
          state: ProposalState.Failed,
        },
      ];

      const userVotes = [{ proposal_id: 1, choice: VoteChoice.For }];

      const userProposalsSupabase = {
        from: (table: string) => {
          if (table === "proposals") {
            return {
              select: (_cols: string) => ({
                eq: (_col: string, _val: any) => ({
                  order: (_col2: string, _opts: any) =>
                    Promise.resolve({ data: dbProposals, error: null }),
                }),
              }),
            };
          }

          if (table === "proposal_votes") {
            return {
              select: (_cols: string) => ({
                eq: (_col: string, _val: any) => ({
                  in: (_col2: string, _ids: any) =>
                    Promise.resolve({ data: userVotes, error: null }),
                }),
              }),
            };
          }

          return { select: () => ({}) };
        },
      };

      (service as any).supabase = userProposalsSupabase;

      const proposals = await service.getUserProposals(userAddress);

      expect(proposals).toHaveLength(2);

      const first = proposals.find((p: any) => p.id === 1)!;
      const second = proposals.find((p: any) => p.id === 2)!;

      expect(first.hasVoted).toBe(true);
      expect(first.userVote).toBe(VoteChoice.For);

      expect(second.hasVoted).toBe(false);
      expect(second.userVote).toBeUndefined();
    });
  });

  describe("getUserVotes", () => {
    it("returns proposals the user has voted on", async () => {
      const now = Math.floor(Date.now() / 1000);
      const userAddress = "0x" + "3".repeat(40);

      const userVotes = [{ proposal_id: 1, choice: VoteChoice.For }];

      const dbProposals: any[] = [
        {
          id: 1,
          title: "P1",
          description: "Desc 1",
          category: ProposalCategory.Other,
          proposer: userAddress,
          start_time: now - 100,
          end_time: now + 100,
          votes_for: 1,
          votes_against: 0,
          total_voters: 1,
          state: ProposalState.Passed,
        },
      ];

      const userVotesSupabase = {
        from: (table: string) => {
          if (table === "proposal_votes") {
            return {
              select: (_cols: string) => ({
                eq: (_col: string, _val: any) =>
                  Promise.resolve({ data: userVotes, error: null }),
              }),
            };
          }

          if (table === "proposals") {
            return {
              select: (_cols: string) => ({
                in: (_col: string, _ids: any) =>
                  Promise.resolve({ data: dbProposals, error: null }),
              }),
            };
          }

          return { select: () => ({}) };
        },
      };

      (service as any).supabase = userVotesSupabase;

      const proposals = await service.getUserVotes(userAddress);

      expect(proposals).toHaveLength(1);
      expect(proposals[0]!.id).toBe(1);
      expect(proposals[0]!.hasVoted).toBe(true);
      expect(proposals[0]!.userVote).toBe(VoteChoice.For);
    });
  });


  describe("getPlatformStats", () => {
    it("computes stats from database counts", async () => {
      const statsSupabase = {
        from: (table: string) => {
          return {
            select: (_cols: string, _options?: any) => {
              const thenable: any = {
                eq: (_col: string, _val: any) => {
                  if (table === "proposals") {
                    return Promise.resolve({ count: 2 });
                  }
                  return Promise.resolve({ count: 0 });
                },
                then: (onFulfilled: any, onRejected?: any) => {
                  let payload: any;
                  if (table === "proposals") {
                    // totalProposals query
                    payload = { count: 5 };
                  } else if (table === "proposal_votes") {
                    // totalVotes query
                    payload = { count: 30 };
                  } else if (table === "users") {
                    // totalUsers query
                    payload = { count: 10, error: null };
                  } else {
                    payload = { count: 0 };
                  }
                  return Promise.resolve(payload).then(
                    onFulfilled,
                    onRejected
                  );
                },
              };

              return thenable;
            },
          };
        },
      };

      (service as any).supabase = statsSupabase;

      const stats = await service.getPlatformStats();

      expect(stats.totalProposals).toBe(5);
      expect(stats.activeProposals).toBe(2);
      expect(stats.totalVotes).toBe(30);
      expect(stats.uniqueVoters).toBe(10);
      // avgVotesPerProposal = 30 / 5 = 6
      // avgParticipation = (6 / 10) * 100 = 60
      expect(stats.avgParticipation).toBe(60);
      expect(stats.votingPower).toBe(30);
    });
  });
});
