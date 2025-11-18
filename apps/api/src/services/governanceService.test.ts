// governanceService.test.ts
import {
  describe,
  it,
  expect,
  mock,
  beforeEach,
  afterEach,
} from "bun:test";

process.env.NODE_ENV = "test";

// ---- Mocks for external dependencies (similar style to AuditService test) ----

// viem public & wallet clients
const mockPublicClient: any = {
  readContract: mock((_cfg) => Promise.resolve(0n)),
  waitForTransactionReceipt: mock((_cfg) =>
    Promise.resolve({ logs: [], status: "success" })
  ),
};

const mockWalletClient: any = {
  writeContract: mock((_cfg) =>
    Promise.resolve("0x" + "0".repeat(64))
  ),
};

// chains
mock.module("viem/chains", () => ({
  sepolia: {},
}));

// viem core
const mockDecodeEventLog = mock((_args: any) => {
  // default: throw to simulate "not matching"
  throw new Error("No matching event");
});

mock.module("viem", () => ({
  createPublicClient: mock((_cfg) => mockPublicClient),
  createWalletClient: mock((_cfg) => mockWalletClient),
  http: mock((_url: string) => ({ url: _url })),
  decodeEventLog: mockDecodeEventLog,
}));

// viem/accounts
const mockAccount = {
  address: "0x" + "a".repeat(40),
};

mock.module("viem/accounts", () => ({
  privateKeyToAccount: mock(() => mockAccount),
}));

// logger
const mockLogger = {
  info: mock(() => {}),
  error: mock(() => {}),
  warn: mock(() => {}),
  debug: mock(() => {}),
};

mock.module("@/utils/logger", () => ({
  default: mockLogger,
}));

// Config
const mockConfig = {
  SEPOLIA_PRIVATE_KEY: "0x" + "1".repeat(64),
  SEPOLIA_RPC_URL: "https://sepolia.example.com",
  GOVERNANCE_DAO_ADDRESS: "0x" + "2".repeat(40),
  SUPABASE_URL: "https://supabase.example.com",
  SUPABASE_KEY: "supabase_test_key",
};

mock.module("@/config/config", () => ({
  Config: mockConfig,
}));

// ABIs
const mockFactoryAbi: any[] = [];
const mockProposalAbi: any[] = [];

mock.module("@/contracts/generated", () => ({
  GOVERNANCE_FACTORY_ABI: mockFactoryAbi,
  PROPOSAL_ABI: mockProposalAbi,
}));

// TABLES
const mockTables = {
  USERS: { name: "users", columns: {} },
  PROPOSALS: {
    name: "proposals",
    columns: {
      id: "id",
      createdAt: "created_at",
      state: "state",
      proposer: "proposer",
      proposalId: "id",
    },
  },
  PROPOSAL_VOTES: {
    name: "proposal_votes",
    columns: {
      proposalId: "proposal_id",
      voterAddress: "voter_address",
    },
  },
};

mock.module("@/constants/db", () => ({
  TABLES: mockTables,
}));

// supabase client
const mockSupabaseClient: any = {
  from: mock((_table: string) => ({
    select() {
      return this;
    },
    eq() {
      return this;
    },
    in() {
      return this;
    },
    order() {
      return this;
    },
    single: async () => ({ data: null, error: null }),
    insert: async () => ({ error: null }),
    update: async () => ({ error: null }),
  })),
};

mock.module("@supabase/supabase-js", () => ({
  createClient: mock(() => mockSupabaseClient),
}));

// ---- Now import the service UNDER TEST (after mocks like in your AuditService test) ----
import {
  governanceService,
  VoteChoice,
  ProposalState,
  ProposalCategory,
  type CreateProposalParams,
  type Proposal,
} from "./governanceService";

// Helper to get the class and instantiate fresh services
type GovernanceServiceType = typeof governanceService;

function newServiceInstance(): GovernanceServiceType {
  const Ctor = (governanceService as any).constructor;
  return new (Ctor as any)();
}

// Fix Date.now when needed
function withFixedNow(timestampSec: number, fn: () => Promise<void> | void) {
  const originalNow = Date.now;
  Date.now = () => timestampSec * 1000;
  return Promise.resolve(fn()).finally(() => {
    Date.now = originalNow;
  });
}

describe("GovernanceService", () => {
  let service: any;

  beforeEach(() => {
    // reset mocks
    mockPublicClient.readContract.mockReset();
    mockPublicClient.waitForTransactionReceipt.mockReset();
    mockWalletClient.writeContract.mockReset();
    mockDecodeEventLog.mockReset();
    mockSupabaseClient.from.mockReset();
    mockLogger.info.mockReset();
    mockLogger.error.mockReset();
    mockLogger.warn.mockReset();
    mockLogger.debug.mockReset();

    // default supabase "no-op" implementation;
    mockSupabaseClient.from.mockImplementation((_table: string) => ({
      select() {
        return this;
      },
      eq() {
        return this;
      },
      in() {
        return this;
      },
      order() {
        return this;
      },
      single: async () => ({ data: null, error: null }),
      insert: async () => ({ error: null }),
      update: async () => ({ error: null }),
    }));

    service = newServiceInstance();
  });

  afterEach(() => {
    process.env.NODE_ENV = "test";
  });

  /* ---------------------------------------------------------------------- */
  /*                              createProposal                            */
  /* ---------------------------------------------------------------------- */

  describe("createProposal", () => {
    it("returns error when title is empty", async () => {
      const params: CreateProposalParams = {
        title: "",
        description: "desc",
        category: ProposalCategory.Governance,
        walletAddress: "0x123",
        duration: 600,
      };

      const result = await service.createProposal(params);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Title cannot be empty");
    });

    it("returns error when description is empty", async () => {
      const params: CreateProposalParams = {
        title: "My proposal",
        description: "",
        category: ProposalCategory.Governance,
        walletAddress: "0x123",
        duration: 600,
      };

      const result = await service.createProposal(params);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Description cannot be empty");
    });

    it("returns failure if proposal ID cannot be extracted from logs", async () => {
      // wallet write OK
      mockWalletClient.writeContract.mockResolvedValueOnce(
        "0x" + "b".repeat(64)
      );

      // receipt logs that do NOT decode
      mockPublicClient.waitForTransactionReceipt.mockResolvedValueOnce({
        logs: [
          { data: "0xdead", topics: ["0x123"] },
        ],
      });

      // decodeEventLog always throws
      mockDecodeEventLog.mockImplementation(() => {
        throw new Error("no match");
      });

      const params: CreateProposalParams = {
        title: "My proposal",
        description: "desc",
        category: ProposalCategory.Governance,
        walletAddress: "0xabc",
        duration: 600,
      };

      const result = await service.createProposal(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Proposal created on blockchain but ID extraction failed"
      );
      expect(mockWalletClient.writeContract).toHaveBeenCalledTimes(1);
    });
  });

  /* ---------------------------------------------------------------------- */
  /*                                   vote                                 */
  /* ---------------------------------------------------------------------- */

  describe("vote", () => {
    it("returns error when vote choice is None", async () => {
      const result = await service.vote({
        proposalId: 1,
        walletAddress: "0xuser",
        choice: VoteChoice.None,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid vote choice");
    });

    it("returns error when user has already voted on this proposal", async () => {
      // supabase.from("proposal_votes") select...single -> existing vote
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === mockTables.PROPOSAL_VOTES.name) {
          return {
            select() {
              return this;
            },
            eq() {
              return this;
            },
            single: async () => ({
              data: { id: 10, proposal_id: 1, voter_address: "0xuser" },
              error: null,
            }),
          };
        }
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          single: async () => ({ data: null, error: null }),
        };
      });

      const result = await service.vote({
        proposalId: 1,
        walletAddress: "0xuser",
        choice: VoteChoice.For,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Already voted on this proposal");
    });

    it("casts a vote and updates DB on success", async () => {
      // 1) no existing vote
      // 2) proposals table update + select single for id
      const updateCalls: any[] = [];
      const insertVoteCalls: any[] = [];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === mockTables.PROPOSAL_VOTES.name) {
          return {
            select() {
              return this;
            },
            eq() {
              return this;
            },
            single: async () => ({ data: null, error: null }),
            insert: async (payload: any) => {
              insertVoteCalls.push(payload);
              return { error: null };
            },
          };
        }
        if (table === mockTables.PROPOSALS.name) {
          return {
            update(payload: any) {
              updateCalls.push(payload);
              return this;
            },
            eq() {
              return this;
            },
            select() {
              return this;
            },
            single: async () => ({ data: { id: 1 }, error: null }),
          };
        }
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          single: async () => ({ data: null, error: null }),
        };
      });

      // registry lookup + voting snapshot
      mockPublicClient.readContract.mockImplementation((cfg: any) => {
        if (cfg.functionName === "proposals") {
          return Promise.resolve({
            proposalContract: "0xproposal",
            title: "T",
            category: ProposalCategory.Governance,
            proposer: "0xcreator",
            startTime: BigInt(1000),
            endTime: BigInt(2000),
          });
        }
        if (cfg.functionName === "votesFor") return Promise.resolve(3n);
        if (cfg.functionName === "votesAgainst") return Promise.resolve(1n);
        if (cfg.functionName === "totalVoters") return Promise.resolve(4n);
        if (cfg.functionName === "getState")
          return Promise.resolve(BigInt(ProposalState.Active));
        return Promise.resolve(0n);
      });

      mockWalletClient.writeContract.mockResolvedValueOnce(
        "0x" + "c".repeat(64)
      );
      mockPublicClient.waitForTransactionReceipt.mockResolvedValueOnce({
        logs: [],
      });

      const result = await service.vote({
        proposalId: 1,
        walletAddress: "0xuser",
        choice: VoteChoice.For,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        proposalId: 1,
        choice: VoteChoice.For,
      });

      expect(updateCalls).toHaveLength(1);
      expect(updateCalls[0]).toEqual({
        votes_for: 3,
        votes_against: 1,
        total_voters: 4,
        state: ProposalState.Active,
      });

      expect(insertVoteCalls).toHaveLength(1);
      expect(insertVoteCalls[0].proposal_id).toBe(1);
      expect(insertVoteCalls[0].voter_address).toBe("0xuser");
      expect(insertVoteCalls[0].choice).toBe(VoteChoice.For);
    });
  });

  /* ---------------------------------------------------------------------- */
  /*                                getProposal                             */
  /* ---------------------------------------------------------------------- */

  describe("getProposal (DB path and fallback)", () => {
    it("returns proposal from DB with timeRemaining and userVote", async () =>
      withFixedNow(1500, async () => {
        const dbRow = {
          id: 42,
          title: "Test",
          description: "Desc",
          category: ProposalCategory.Governance,
          proposer: "0xcreator",
          start_time: 1000,
          end_time: 2000,
          votes_for: 10,
          votes_against: 2,
          total_voters: 12,
          state: ProposalState.Active,
        };

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === mockTables.PROPOSALS.name) {
            return {
              select() {
                return this;
              },
              eq() {
                return this;
              },
              single: async () => ({ data: dbRow, error: null }),
            };
          }
          if (table === mockTables.PROPOSAL_VOTES.name) {
            return {
              select() {
                return this;
              },
              eq() {
                return this;
              },
              single: async () => ({
                data: { proposal_id: 42, choice: VoteChoice.Against },
                error: null,
              }),
            };
          }
          return {
            select() {
              return this;
            },
            eq() {
              return this;
            },
            single: async () => ({ data: null, error: null }),
          };
        });

        const proposal = await service.getProposal(42, "0xuser");

        expect(proposal).not.toBeNull();
        expect(proposal!.id).toBe(42);
        expect(proposal!.timeRemaining).toBe(2000 - 1500);
        expect(proposal!.state).toBe(ProposalState.Active);
        expect(proposal!.hasVoted).toBe(true);
        expect(proposal!.userVote).toBe(VoteChoice.Against);
      }));

    it("falls back to blockchain when proposal not in DB", async () => {
      // DB returns error / no data
      mockSupabaseClient.from.mockImplementation((_table: string) => ({
        select() {
          return this;
        },
        eq() {
          return this;
        },
        single: async () => ({ data: null, error: { message: "not found" } }),
      }));

      // patch private method to simulate chain proposal
      const chainProposal: Proposal = {
        id: 5,
        title: "On-chain",
        description: "From chain",
        category: ProposalCategory.Governance,
        proposer: "0xcreator",
        startTime: 1000,
        endTime: 2000,
        votesFor: 1,
        votesAgainst: 0,
        totalVoters: 1,
        state: ProposalState.Passed,
        timeRemaining: 0,
      };

      service.getProposalFromBlockchain = mock(
        async () => chainProposal
      );

      const result = await service.getProposal(5, "0xuser");
      expect(result).toEqual(chainProposal);
    });

    it("returns null if DB throws", async () => {
      mockSupabaseClient.from.mockImplementation((_table: string) => ({
        select() {
          throw new Error("DB exploded");
        },
      }));

      const result = await service.getProposal(1);
      expect(result).toBeNull();
    });
  });

  /* ---------------------------------------------------------------------- */
  /*                         getProposalFromBlockchain                      */
  /* ---------------------------------------------------------------------- */

  describe("getProposalFromBlockchain", () => {
    it("builds proposal fully from blockchain including hasVoted & userVote", async () =>
      withFixedNow(1500, async () => {
        // registry
        service.getProposalRegistryEntry = mock(async (_id: number) => ({
          proposalContract: "0xproposal",
          title: "Chain title",
          category: ProposalCategory.Governance,
          proposer: "0xcreator",
          startTime: 1000,
          endTime: 2000,
        }));

        mockPublicClient.readContract.mockImplementation((cfg: any) => {
          if (cfg.functionName === "description") return Promise.resolve("Chain desc");
          if (cfg.functionName === "votesFor") return Promise.resolve(2n);
          if (cfg.functionName === "votesAgainst") return Promise.resolve(1n);
          if (cfg.functionName === "totalVoters") return Promise.resolve(3n);
          if (cfg.functionName === "getState")
            return Promise.resolve(BigInt(ProposalState.Passed));
          if (cfg.functionName === "hasVoted") return Promise.resolve(true);
          if (cfg.functionName === "votes")
            return Promise.resolve(BigInt(VoteChoice.For));
          return Promise.resolve(0n);
        });

        const proposal = await (service as any).getProposalFromBlockchain(
          1,
          "0xuser"
        );

        expect(proposal).not.toBeNull();
        expect(proposal!.title).toBe("Chain title");
        expect(proposal!.description).toBe("Chain desc");
        expect(proposal!.votesFor).toBe(2);
        expect(proposal!.votesAgainst).toBe(1);
        expect(proposal!.totalVoters).toBe(3);
        expect(proposal!.state).toBe(ProposalState.Passed);
        expect(proposal!.timeRemaining).toBe(2000 - 1500);
        expect(proposal!.hasVoted).toBe(true);
        expect(proposal!.userVote).toBe(VoteChoice.For);
      }));
  });

  /* ---------------------------------------------------------------------- */
  /*                              getAllProposals                           */
  /* ---------------------------------------------------------------------- */

  describe("getAllProposals", () => {
    it("returns [] when no proposals in DB", async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === mockTables.PROPOSALS.name) {
          return {
            select() {
              return this;
            },
            order() {
              return {
                then(resolve: any) {
                  resolve({ data: [], error: null });
                },
              };
            },
          };
        }
        return {
          select() {
            return this;
          },
        };
      });

      const proposals = await service.getAllProposals();
      expect(proposals).toEqual([]);
    });

    it("computes timeRemaining without user votes", async () =>
      withFixedNow(1500, async () => {
        const dbRows = [
          {
            id: 1,
            title: "P1",
            description: "d1",
            category: ProposalCategory.Governance,
            proposer: "0xcreator",
            start_time: 1000,
            end_time: 2000,
            votes_for: 1,
            votes_against: 0,
            total_voters: 1,
            state: ProposalState.Active,
          },
        ];

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === mockTables.PROPOSALS.name) {
            return {
              select() {
                return this;
              },
              order() {
                return {
                  then(resolve: any) {
                    resolve({ data: dbRows, error: null });
                  },
                };
              },
            };
          }
          return {
            select() {
              return this;
            },
          };
        });

        const proposals = await service.getAllProposals();
        expect(proposals).toHaveLength(1);
        expect(proposals[0].timeRemaining).toBe(2000 - 1500);
        expect(proposals[0].hasVoted).toBeUndefined();
      }));

    it("syncs expired active proposals with blockchain state", async () =>
      withFixedNow(3000, async () => {
        const dbRows = [
          {
            id: 1,
            title: "Expired",
            description: "d",
            category: ProposalCategory.Governance,
            proposer: "0xcreator",
            start_time: 1000,
            end_time: 2000,
            votes_for: 1,
            votes_against: 0,
            total_voters: 1,
            state: ProposalState.Active,
          },
        ];

        const updateCalls: any[] = [];

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === mockTables.PROPOSALS.name) {
            return {
              select() {
                return this;
              },
              order() {
                return {
                  then(resolve: any) {
                    resolve({ data: dbRows, error: null });
                  },
                };
              },
              update(payload: any) {
                updateCalls.push(payload);
                return this;
              },
              eq() {
                return this;
              },
            };
          }
          return {
            select() {
              return this;
            },
          };
        });

        service.getProposalRegistryEntry = mock(async (_id: number) => ({
          proposalContract: "0xproposal",
          title: "",
          category: ProposalCategory.Governance,
          proposer: "0x",
          startTime: 0,
          endTime: 0,
        }));

        mockPublicClient.readContract.mockImplementation((cfg: any) => {
          if (cfg.functionName === "getState")
            return Promise.resolve(BigInt(ProposalState.Passed));
          return Promise.resolve(0n);
        });

        const proposals = await service.getAllProposals();

        expect(updateCalls).toHaveLength(1);
        expect(updateCalls[0]).toEqual({ state: ProposalState.Passed });
        expect(proposals[0].state).toBe(ProposalState.Passed);
      }));

    it("marks hasVoted for proposals when userAddress is provided", async () =>
      withFixedNow(1500, async () => {
        const dbRows = [
          {
            id: 1,
            title: "P1",
            description: "d1",
            category: ProposalCategory.Governance,
            proposer: "0xcreator",
            start_time: 1000,
            end_time: 2000,
            votes_for: 1,
            votes_against: 0,
            total_voters: 1,
            state: ProposalState.Active,
          },
          {
            id: 2,
            title: "P2",
            description: "d2",
            category: ProposalCategory.Governance,
            proposer: "0xcreator",
            start_time: 1000,
            end_time: 2000,
            votes_for: 0,
            votes_against: 1,
            total_voters: 1,
            state: ProposalState.Failed,
          },
        ];

        const userVotes = [{ proposal_id: 1, choice: VoteChoice.For }];

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === mockTables.PROPOSALS.name) {
            return {
              select() {
                return this;
              },
              order() {
                return {
                  then(resolve: any) {
                    resolve({ data: dbRows, error: null });
                  },
                };
              },
            };
          }
          if (table === mockTables.PROPOSAL_VOTES.name) {
            return {
              select() {
                return this;
              },
              eq() {
                return this;
              },
              then(resolve: any) {
                resolve({ data: userVotes, error: null });
              },
            };
          }
          return {
            select() {
              return this;
            },
          };
        });

        const proposals = await service.getAllProposals("0xuser");
        const p1 = proposals.find((p: any) => p.id === 1)!;
        const p2 = proposals.find((p: any) => p.id === 2)!;

        expect(p1.hasVoted).toBe(true);
        expect(p1.userVote).toBe(VoteChoice.For);
        expect(p2.hasVoted).toBe(false);
        expect(p2.userVote).toBeUndefined();
      }));
  });

  /* ---------------------------------------------------------------------- */
  /*                             getUserProposals                           */
  /* ---------------------------------------------------------------------- */

  describe("getUserProposals", () => {
    it("returns [] when user has no proposals", async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === mockTables.PROPOSALS.name) {
          return {
            select() {
              return this;
            },
            eq() {
              return this;
            },
            order() {
              return {
                then(resolve: any) {
                  resolve({ data: [], error: null });
                },
              };
            },
          };
        }
        return {
          select() {
            return this;
          },
        };
      });

      const result = await service.getUserProposals("0xuser");
      expect(result).toEqual([]);
    });

    it("marks hasVoted correctly for user proposals", async () =>
      withFixedNow(1500, async () => {
        const dbRows = [
          {
            id: 1,
            title: "Mine",
            description: "d",
            category: ProposalCategory.Governance,
            proposer: "0xuser",
            start_time: 1000,
            end_time: 2000,
            votes_for: 1,
            votes_against: 0,
            total_voters: 1,
            state: ProposalState.Active,
          },
          {
            id: 2,
            title: "Mine 2",
            description: "d2",
            category: ProposalCategory.Governance,
            proposer: "0xuser",
            start_time: 1000,
            end_time: 2000,
            votes_for: 0,
            votes_against: 1,
            total_voters: 1,
            state: ProposalState.Failed,
          },
        ];

        const userVotes = [{ proposal_id: 2, choice: VoteChoice.Against }];

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === mockTables.PROPOSALS.name) {
            return {
              select() {
                return this;
              },
              eq() {
                return this;
              },
              order() {
                return {
                  then(resolve: any) {
                    resolve({ data: dbRows, error: null });
                  },
                };
              },
            };
          }
          if (table === mockTables.PROPOSAL_VOTES.name) {
            return {
              select() {
                return this;
              },
              eq() {
                return this;
              },
              in() {
                return {
                  then(resolve: any) {
                    resolve({ data: userVotes, error: null });
                  },
                };
              },
            };
          }
          return {
            select() {
              return this;
            },
          };
        });

        const proposals = await service.getUserProposals("0xuser");
        const p1 = proposals.find((p: any) => p.id === 1)!;
        const p2 = proposals.find((p: any) => p.id === 2)!;

        expect(p1.hasVoted).toBe(false);
        expect(p1.userVote).toBeUndefined();
        expect(p2.hasVoted).toBe(true);
        expect(p2.userVote).toBe(VoteChoice.Against);
      }));
  });

  /* ---------------------------------------------------------------------- */
  /*                               getUserVotes                             */
  /* ---------------------------------------------------------------------- */

  describe("getUserVotes", () => {
    it("returns [] when user has no votes", async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === mockTables.PROPOSAL_VOTES.name) {
          return {
            select() {
              return this;
            },
            eq() {
              return {
                then(resolve: any) {
                  resolve({ data: [], error: null });
                },
              };
            },
          };
        }
        return {
          select() {
            return this;
          },
        };
      });

      const result = await service.getUserVotes("0xuser");
      expect(result).toEqual([]);
    });

    it("returns proposals with hasVoted and userVote", async () =>
      withFixedNow(1500, async () => {
        const userVotes = [{ proposal_id: 1, choice: VoteChoice.For }];
        const dbRows = [
          {
            id: 1,
            title: "P1",
            description: "d1",
            category: ProposalCategory.Governance,
            proposer: "0xcreator",
            start_time: 1000,
            end_time: 2000,
            votes_for: 1,
            votes_against: 0,
            total_voters: 1,
            state: ProposalState.Active,
          },
        ];

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === mockTables.PROPOSAL_VOTES.name) {
            return {
              select() {
                return this;
              },
              eq() {
                return {
                  then(resolve: any) {
                    resolve({ data: userVotes, error: null });
                  },
                };
              },
            };
          }
          if (table === mockTables.PROPOSALS.name) {
            return {
              select() {
                return this;
              },
              in() {
                return {
                  then(resolve: any) {
                    resolve({ data: dbRows, error: null });
                  },
                };
              },
            };
          }
          return {
            select() {
              return this;
            },
          };
        });

        const proposals = await service.getUserVotes("0xuser");
        expect(proposals).toHaveLength(1);
        const p = proposals[0];

        expect(p.id).toBe(1);
        expect(p.hasVoted).toBe(true);
        expect(p.userVote).toBe(VoteChoice.For);
        expect(p.timeRemaining).toBe(2000 - 1500);
      }));
  });

  /* ---------------------------------------------------------------------- */
  /*                             getPlatformStats                           */
  /* ---------------------------------------------------------------------- */

  describe("getPlatformStats", () => {
    it("computes stats and avgParticipation", async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === mockTables.PROPOSALS.name) {
          return {
            select(_cols: string, opts: { count?: string; head?: boolean }) {
              if (opts.count === "exact" && opts.head) {
                // activeProposals when chained with .eq()
                return {
                  eq: () => Promise.resolve({ count: 2, error: null }),
                };
              }
              // totalProposals
              return Promise.resolve({ count: 4, error: null });
            },
          };
        }
        if (table === mockTables.PROPOSAL_VOTES.name) {
          return {
            select() {
              return Promise.resolve({ count: 8, error: null });
            },
          };
        }
        if (table === mockTables.USERS.name) {
          return {
            select() {
              return Promise.resolve({ count: 2, error: null });
            },
          };
        }
        return {
          select() {
            return Promise.resolve({ count: 0, error: null });
          },
        };
      });

      const stats = await service.getPlatformStats();
      expect(stats.totalProposals).toBe(4);
      expect(stats.activeProposals).toBe(2);
      expect(stats.totalVotes).toBe(8);
      expect(stats.uniqueVoters).toBe(2);
      expect(stats.avgParticipation).toBe(100);
      expect(stats.votingPower).toBe(8);
    });

    it("returns zeroed stats on error", async () => {
      mockSupabaseClient.from.mockImplementation((_table: string) => ({
        select() {
          throw new Error("DB down");
        },
      }));

      const stats = await service.getPlatformStats();
      expect(stats).toEqual({
        totalProposals: 0,
        activeProposals: 0,
        totalVotes: 0,
        uniqueVoters: 0,
        avgParticipation: 0,
        votingPower: 0,
      });
    });
  });
});
