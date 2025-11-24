import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import type { Request, Response } from "express";

// Set test environment before imports
(process.env as any).NODE_ENV = "test";

const mockLogger = {
  info: mock(() => {}),
  error: mock(() => {}),
  warn: mock(() => {}),
  debug: mock(() => {}),
};
afterEach(() => {
  mock.restore();
});

beforeEach(() => {
  // Mock logger

  mock.module("@/utils/logger", () => ({
    default: mockLogger,
  }));
  // Mock TABLES constant - include all tables to avoid conflicts with other tests
  mock.module("@/constants/db", () => ({
    TABLES: {
      USERS: {
        name: "users",
        columns: {
          id: "id",
          username: "username",
          createdAt: "created_at",
        },
      },
      STUDY_PARTICIPATIONS: {
        name: "study_participations",
        columns: {
          participantWallet: "participant_wallet",
          hasConsented: "has_consented",
        },
      },
      DATA_VAULT: {
        name: "data_vault",
        columns: {
          walletAddress: "wallet_address",
          encryptedCid: "encrypted_cid",
          resourceType: "resource_type",
          createdAt: "created_at",
          fileId: "file_id",
          id: "id",
        },
      },
      STUDIES: {
        name: "studies",
        columns: {
          createdBy: "created_by",
        },
      },
      TRANSACTIONS: {
        name: "transactions",
        columns: {
          valueUSD: "value_usd",
          toWallet: "to_wallet",
          fromWallet: "from_wallet",
        },
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
});
import {
  checkIfUserExists,
  createUser,
  getUserByWalletAddress,
  updateUserByWalletAddress,
  getUserStatsForDataSeller,
  getUserStatsForResearcher,
  getNumberOfUsersOnPlatform,
  type UserRow,
} from "./userService";

describe("userService", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockSupabase: any;

  beforeEach(() => {
    // Reset all mocks
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.debug.mockClear();

    // Mock response object
    mockRes = {
      status: mock((code: number) => mockRes as Response),
      json: mock((data: any) => mockRes as Response),
    };

    // Mock Supabase client
    mockSupabase = {
      from: mock((table: string) => ({
        select: mock((columns: string) => ({
          eq: mock((column: string, value: any) => ({
            limit: mock((n: number) => ({
              single: mock(() => Promise.resolve({ data: null, error: null })),
            })),
            maybeSingle: mock(() => Promise.resolve({ data: null, error: null })),
          })),
          count: mock(() => Promise.resolve({ count: 0, error: null })),
          head: mock(() => Promise.resolve({ count: 0, error: null })),
        })),
        insert: mock((data: any) => Promise.resolve({ error: null })),
        update: mock((data: any) => ({
          eq: mock((column: string, value: any) => ({
            select: mock((columns: string) => ({
              maybeSingle: mock(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
      })),
    };

    mockReq = {
      supabase: mockSupabase,
    };
  });

  // describe("checkIfUserExists", () => {
  //   test("returns true when user exists", async () => {
  //     const walletAddress = "0x1234567890abcdef";
  //     const mockUserData = {
  //       id: walletAddress,
  //       username: "testuser",
  //       created_at: "2024-01-01T00:00:00Z",
  //     };

  //     mockSupabase.from = mock(() => ({
  //       select: mock(() => ({
  //         eq: mock(() => ({
  //           limit: mock(() => ({
  //             single: mock(() => Promise.resolve({ data: mockUserData, error: null })),
  //           })),
  //         })),
  //       })),
  //     }));

  //     mockReq.supabase = mockSupabase as any;

  //     const result = await checkIfUserExists(
  //       mockReq as Request,
  //       mockRes as Response,
  //       walletAddress
  //     );

  //     expect(result).toBe(true);
  //     expect(mockLogger.info).toHaveBeenCalled();
  //   });

  //   test("returns false when user does not exist", async () => {
  //     const walletAddress = "0x1234567890abcdef";

  //     mockSupabase.from = mock(() => ({
  //       select: mock(() => ({
  //         eq: mock(() => ({
  //           limit: mock(() => ({
  //             single: mock(() => Promise.resolve({ data: null, error: null })),
  //           })),
  //         })),
  //       })),
  //     }));

  //     mockReq.supabase = mockSupabase as any;

  //     const result = await checkIfUserExists(
  //       mockReq as Request,
  //       mockRes as Response,
  //       walletAddress
  //     );

  //     expect(result).toBe(false);
  //   });

  //   test("handles database query error", async () => {
  //     const walletAddress = "0x1234567890abcdef";
  //     const mockError = { message: "Database connection failed" };

  //     mockSupabase.from = mock(() => ({
  //       select: mock(() => ({
  //         eq: mock(() => ({
  //           limit: mock(() => ({
  //             single: mock(() => Promise.resolve({ data: null, error: mockError })),
  //           })),
  //         })),
  //       })),
  //     }));

  //     mockReq.supabase = mockSupabase as any;

  //     const result = await checkIfUserExists(
  //       mockReq as Request,
  //       mockRes as Response,
  //       walletAddress
  //     );

  //     expect(result).toBe(false);
  //     expect(mockRes.status).toHaveBeenCalledWith(500);
  //     expect(mockRes.json).toHaveBeenCalledWith({ error: "Database query failed" });
  //     expect(mockLogger.error).toHaveBeenCalled();
  //   });

  //   test("handles unexpected error", async () => {
  //     const walletAddress = "0x1234567890abcdef";

  //     mockSupabase.from = mock(() => {
  //       throw new Error("Unexpected error");
  //     });

  //     mockReq.supabase = mockSupabase as any;

  //     const result = await checkIfUserExists(
  //       mockReq as Request,
  //       mockRes as Response,
  //       walletAddress
  //     );

  //     expect(result).toBe(false);
  //     expect(mockRes.status).toHaveBeenCalledWith(500);
  //     expect(mockRes.json).toHaveBeenCalledWith({ error: "Internal server error" });
  //     expect(mockLogger.error).toHaveBeenCalled();
  //   });
  // });

  // describe("createUser", () => {
  //   test("creates user successfully", async () => {
  //     const walletAddress = "0x1234567890abcdef";

  //     mockSupabase.from = mock(() => ({
  //       insert: mock(() => Promise.resolve({ error: null })),
  //     }));

  //     mockReq.supabase = mockSupabase as any;

  //     const result = await createUser(mockReq as Request, mockRes as Response, walletAddress);

  //     expect(result).toBe(true);
  //     expect(mockLogger.info).toHaveBeenCalled();
  //   });

  //   test("handles database insert error", async () => {
  //     const walletAddress = "0x1234567890abcdef";
  //     const mockError = { message: "Insert failed" };

  //     mockSupabase.from = mock(() => ({
  //       insert: mock(() => Promise.resolve({ error: mockError })),
  //     }));

  //     mockReq.supabase = mockSupabase as any;

  //     const result = await createUser(mockReq as Request, mockRes as Response, walletAddress);

  //     expect(result).toBe(false);
  //     expect(mockRes.status).toHaveBeenCalledWith(500);
  //     expect(mockRes.json).toHaveBeenCalledWith({ error: "Failed to create user" });
  //     expect(mockLogger.error).toHaveBeenCalled();
  //   });

  //   test("handles unexpected error", async () => {
  //     const walletAddress = "0x1234567890abcdef";

  //     mockSupabase.from = mock(() => {
  //       throw new Error("Unexpected error");
  //     });

  //     mockReq.supabase = mockSupabase as any;

  //     const result = await createUser(mockReq as Request, mockRes as Response, walletAddress);

  //     expect(result).toBe(false);
  //     expect(mockRes.status).toHaveBeenCalledWith(500);
  //     expect(mockRes.json).toHaveBeenCalledWith({ error: "Internal server error" });
  //     expect(mockLogger.error).toHaveBeenCalled();
  //   });
  // });

  describe("getUserByWalletAddress", () => {
    test("returns user when found", async () => {
      const walletAddress = "0x1234567890abcdef";
      const mockUserData: UserRow = {
        id: walletAddress,
        username: "testuser",
        created_at: "2024-01-01T00:00:00Z",
      };

      mockSupabase.from = mock(() => ({
        select: mock(() => ({
          eq: mock(() => ({
            maybeSingle: mock(() => Promise.resolve({ data: mockUserData, error: null })),
          })),
        })),
      }));

      const result = await getUserByWalletAddress(mockSupabase as any, walletAddress);

      expect(result).toEqual(mockUserData);
    });

    test("returns null when user not found", async () => {
      const walletAddress = "0x1234567890abcdef";

      mockSupabase.from = mock(() => ({
        select: mock(() => ({
          eq: mock(() => ({
            maybeSingle: mock(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      }));

      const result = await getUserByWalletAddress(mockSupabase as any, walletAddress);

      expect(result).toBeNull();
    });

    test("throws error on database failure", async () => {
      const walletAddress = "0x1234567890abcdef";
      const mockError = { message: "Database query failed" };

      mockSupabase.from = mock(() => ({
        select: mock(() => ({
          eq: mock(() => ({
            maybeSingle: mock(() => Promise.resolve({ data: null, error: mockError })),
          })),
        })),
      }));

      await expect(getUserByWalletAddress(mockSupabase as any, walletAddress)).rejects.toThrow(
        "Supabase query failed: Database query failed"
      );
    });
  });

  describe("updateUserByWalletAddress", () => {
    test("updates username successfully", async () => {
      const walletAddress = "0x1234567890abcdef";
      const updateData = { username: "newuser" };
      const mockUpdatedUser: UserRow = {
        id: walletAddress,
        username: "newuser",
        created_at: "2024-01-01T00:00:00Z",
      };

      mockSupabase.from = mock(() => ({
        update: mock(() => ({
          eq: mock(() => ({
            select: mock(() => ({
              maybeSingle: mock(() => Promise.resolve({ data: mockUpdatedUser, error: null })),
            })),
          })),
        })),
      }));

      const result = await updateUserByWalletAddress(
        mockSupabase as any,
        walletAddress,
        updateData
      );

      expect(result).toEqual(mockUpdatedUser);
    });

    test("validates username format - too short", async () => {
      const walletAddress = "0x1234567890abcdef";
      const updateData = { username: "abc" };

      await expect(
        updateUserByWalletAddress(mockSupabase as any, walletAddress, updateData)
      ).rejects.toThrow("Invalid username format");
    });

    test("validates username format - too long", async () => {
      const walletAddress = "0x1234567890abcdef";
      const updateData = { username: "thisistoolong" };

      await expect(
        updateUserByWalletAddress(mockSupabase as any, walletAddress, updateData)
      ).rejects.toThrow("Invalid username format");
    });

    test("validates username format - invalid characters", async () => {
      const walletAddress = "0x1234567890abcdef";
      const updateData = { username: "user123" };

      await expect(
        updateUserByWalletAddress(mockSupabase as any, walletAddress, updateData)
      ).rejects.toThrow("Invalid username format");
    });

    test("allows valid username with underscores", async () => {
      const walletAddress = "0x1234567890abcdef";
      const updateData = { username: "user_name" };
      const mockUpdatedUser: UserRow = {
        id: walletAddress,
        username: "user_name",
        created_at: "2024-01-01T00:00:00Z",
      };

      mockSupabase.from = mock(() => ({
        update: mock(() => ({
          eq: mock(() => ({
            select: mock(() => ({
              maybeSingle: mock(() => Promise.resolve({ data: mockUpdatedUser, error: null })),
            })),
          })),
        })),
      }));

      const result = await updateUserByWalletAddress(
        mockSupabase as any,
        walletAddress,
        updateData
      );

      expect(result).toEqual(mockUpdatedUser);
    });

    test("trims whitespace from username", async () => {
      const walletAddress = "0x1234567890abcdef";
      const updateData = { username: "  username  " };
      const mockUpdatedUser: UserRow = {
        id: walletAddress,
        username: "username",
        created_at: "2024-01-01T00:00:00Z",
      };

      mockSupabase.from = mock(() => ({
        update: mock(() => ({
          eq: mock(() => ({
            select: mock(() => ({
              maybeSingle: mock(() => Promise.resolve({ data: mockUpdatedUser, error: null })),
            })),
          })),
        })),
      }));

      const result = await updateUserByWalletAddress(
        mockSupabase as any,
        walletAddress,
        updateData
      );

      expect(result).toEqual(mockUpdatedUser);
    });

    test("handles database update error", async () => {
      const walletAddress = "0x1234567890abcdef";
      const updateData = { username: "newuser" };
      const mockError = { message: "Update failed" };

      mockSupabase.from = mock(() => ({
        update: mock(() => ({
          eq: mock(() => ({
            select: mock(() => ({
              maybeSingle: mock(() => Promise.resolve({ data: null, error: mockError })),
            })),
          })),
        })),
      }));

      await expect(
        updateUserByWalletAddress(mockSupabase as any, walletAddress, updateData)
      ).rejects.toThrow("Failed to update user: Update failed");
    });

    test("returns null when user not found", async () => {
      const walletAddress = "0x1234567890abcdef";
      const updateData = { username: "newuser" };

      mockSupabase.from = mock(() => ({
        update: mock(() => ({
          eq: mock(() => ({
            select: mock(() => ({
              maybeSingle: mock(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
      }));

      const result = await updateUserByWalletAddress(
        mockSupabase as any,
        walletAddress,
        updateData
      );

      expect(result).toBeNull();
    });
  });

  describe("getUserStatsForDataSeller", () => {
    test("returns correct stats for data seller", async () => {
      const walletAddress = "0x1234567890abcdef";
      const now = new Date();
      const mockParticipations = [
        {
          id: 1,
          studies: {
            created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            duration_days: 30,
            status: "active",
          },
        },
        {
          id: 2,
          studies: {
            created_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            duration_days: 30,
            status: "completed",
          },
        },
      ];
      const mockEarnings = [{ value_usd: 100 }, { value_usd: 200 }, { value_usd: 50 }];
      mockSupabase.from = mock((table: string) => {
        if (table === "study_participations") {
          return {
            select: mock(() => ({
              eq: mock((column: string, value: any) => {
                if (column === "participant_wallet") {
                  return {
                    eq: mock(() => Promise.resolve({ data: mockParticipations, error: null })),
                  };
                }
                return Promise.resolve({ data: mockParticipations, error: null });
              }),
            })),
          };
        }
        if (table === "data_vault") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ count: 5, error: null })),
            })),
          };
        }
        if (table === "transactions") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ data: mockEarnings, error: null })),
            })),
          };
        }
        return {};
      });
      const result = await getUserStatsForDataSeller(mockSupabase as any, walletAddress);
      expect(result.nActiveStudies).toBe(1);
      expect(result.nCompletedStudies).toBe(1);
      expect(result.nMedicalFiles).toBe(5);
      expect(result.totalEarnings).toBe(350);
    });
    test("handles participations query error", async () => {
      const walletAddress = "0x1234567890abcdef";
      const mockError = { message: "Query failed" };
      mockSupabase.from = mock((table: string) => {
        if (table === "study_participations") {
          return {
            select: mock(() => ({
              eq: mock((column: string, value: any) => {
                if (column === "participant_wallet") {
                  return {
                    eq: mock(() => Promise.resolve({ data: null, error: mockError })),
                  };
                }
                return Promise.resolve({ data: null, error: mockError });
              }),
            })),
          };
        }
        if (table === "data_vault") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ count: 0, error: null })),
            })),
          };
        }
        if (table === "transactions") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }
        return {};
      });
      const result = await getUserStatsForDataSeller(mockSupabase as any, walletAddress);
      expect(result.nActiveStudies).toBe(0);
      expect(result.nCompletedStudies).toBe(0);
      expect(mockLogger.error).toHaveBeenCalled();
    });
    test("handles medical files query error", async () => {
      const walletAddress = "0x1234567890abcdef";
      const mockError = { message: "Query failed" };
      mockSupabase.from = mock((table: string) => {
        if (table === "study_participations") {
          return {
            select: mock(() => ({
              eq: mock((column: string, value: any) => {
                if (column === "participant_wallet") {
                  return {
                    eq: mock(() => Promise.resolve({ data: [], error: null })),
                  };
                }
                return Promise.resolve({ data: [], error: null });
              }),
            })),
          };
        }
        if (table === "data_vault") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ count: null, error: mockError })),
            })),
          };
        }
        if (table === "transactions") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }
        return {};
      });
      const result = await getUserStatsForDataSeller(mockSupabase as any, walletAddress);
      expect(result.nMedicalFiles).toBe(0);
      expect(mockLogger.error).toHaveBeenCalled();
    });
    test("handles earnings query error", async () => {
      const walletAddress = "0x1234567890abcdef";
      const mockError = { message: "Query failed" };
      mockSupabase.from = mock((table: string) => {
        if (table === "study_participations") {
          return {
            select: mock(() => ({
              eq: mock((column: string, value: any) => {
                if (column === "participant_wallet") {
                  return {
                    eq: mock(() => Promise.resolve({ data: [], error: null })),
                  };
                }
                return Promise.resolve({ data: [], error: null });
              }),
            })),
          };
        }
        if (table === "data_vault") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ count: 0, error: null })),
            })),
          };
        }
        if (table === "transactions") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ data: null, error: mockError })),
            })),
          };
        }
        return {};
      });
      const result = await getUserStatsForDataSeller(mockSupabase as any, walletAddress);
      expect(result.totalEarnings).toBe(0);
      expect(mockLogger.error).toHaveBeenCalled();
    });
    test("handles expired active studies correctly", async () => {
      const walletAddress = "0x1234567890abcdef";
      const now = new Date();
      const mockParticipations = [
        {
          id: 1,
          studies: {
            created_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            duration_days: 30,
            status: "active",
          },
        },
      ];
      mockSupabase.from = mock((table: string) => {
        if (table === "study_participations") {
          return {
            select: mock(() => ({
              eq: mock((column: string, value: any) => {
                if (column === "participant_wallet") {
                  return {
                    eq: mock(() => Promise.resolve({ data: mockParticipations, error: null })),
                  };
                }
                return Promise.resolve({ data: mockParticipations, error: null });
              }),
            })),
          };
        }
        if (table === "data_vault") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ count: 0, error: null })),
            })),
          };
        }
        if (table === "transactions") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }
        return {};
      });
      const result = await getUserStatsForDataSeller(mockSupabase as any, walletAddress);
      expect(result.nActiveStudies).toBe(0);
      expect(result.nCompletedStudies).toBe(0);
    });
  });

  describe("getUserStatsForResearcher", () => {
    test("returns correct stats for researcher", async () => {
      const walletAddress = "0x1234567890abcdef";
      const now = new Date();
      const mockStudies = [
        {
          created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          duration_days: 30,
          status: "active",
        },
        {
          created_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          duration_days: 30,
          status: "completed",
        },
      ];

      const mockSpending = [{ value_usd: 500 }, { value_usd: 300 }];

      mockSupabase.from = mock((table: string) => {
        if (table === "studies") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ data: mockStudies, error: null })),
            })),
          };
        }
        if (table === "study_participations") {
          return {
            select: mock(() => ({
              eq: mock((column: string, value: any) => {
                if (column === "studies.created_by") {
                  return {
                    eq: mock(() => Promise.resolve({ count: 10, error: null })),
                  };
                }
                return Promise.resolve({ count: 10, error: null });
              }),
            })),
          };
        }
        if (table === "transactions") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ data: mockSpending, error: null })),
            })),
          };
        }
        return {};
      });

      const result = await getUserStatsForResearcher(mockSupabase as any, walletAddress);

      expect(result.nActiveStudies).toBe(1);
      expect(result.nCompletedStudies).toBe(1);
      expect(result.nParticipantsEnrolled).toBe(10);
      expect(result.totalSpent).toBe(800);
    });

    test("handles studies query error", async () => {
      const walletAddress = "0x1234567890abcdef";
      const mockError = { message: "Query failed" };

      mockSupabase.from = mock((table: string) => {
        if (table === "studies") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ data: null, error: mockError })),
            })),
          };
        }
        if (table === "study_participations") {
          return {
            select: mock(() => ({
              eq: mock((column: string, value: any) => {
                if (column === "studies.created_by") {
                  return {
                    eq: mock(() => Promise.resolve({ count: 0, error: null })),
                  };
                }
                return Promise.resolve({ count: 0, error: null });
              }),
            })),
          };
        }
        if (table === "transactions") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }
        return {};
      });

      const result = await getUserStatsForResearcher(mockSupabase as any, walletAddress);

      expect(result.nActiveStudies).toBe(0);
      expect(result.nCompletedStudies).toBe(0);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test("handles participants query error", async () => {
      const walletAddress = "0x1234567890abcdef";
      const mockError = { message: "Query failed" };

      mockSupabase.from = mock((table: string) => {
        if (table === "studies") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }
        if (table === "study_participations") {
          return {
            select: mock(() => ({
              eq: mock((column: string, value: any) => {
                if (column === "studies.created_by") {
                  return {
                    eq: mock(() => Promise.resolve({ count: null, error: mockError })),
                  };
                }
                return Promise.resolve({ count: null, error: mockError });
              }),
            })),
          };
        }
        if (table === "transactions") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }
        return {};
      });

      const result = await getUserStatsForResearcher(mockSupabase as any, walletAddress);

      expect(result.nParticipantsEnrolled).toBe(0);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test("handles spending query error", async () => {
      const walletAddress = "0x1234567890abcdef";
      const mockError = { message: "Query failed" };

      mockSupabase.from = mock((table: string) => {
        if (table === "studies") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }
        if (table === "study_participations") {
          return {
            select: mock(() => ({
              eq: mock((column: string, value: any) => {
                if (column === "studies.created_by") {
                  return {
                    eq: mock(() => Promise.resolve({ count: 0, error: null })),
                  };
                }
                return Promise.resolve({ count: 0, error: null });
              }),
            })),
          };
        }
        if (table === "transactions") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ data: null, error: mockError })),
            })),
          };
        }
        return {};
      });

      const result = await getUserStatsForResearcher(mockSupabase as any, walletAddress);

      expect(result.totalSpent).toBe(0);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test("correctly identifies expired active studies", async () => {
      const walletAddress = "0x1234567890abcdef";
      const now = new Date();
      const mockStudies = [
        {
          created_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          duration_days: 30,
          status: "active",
        },
      ];

      mockSupabase.from = mock((table: string) => {
        if (table === "studies") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ data: mockStudies, error: null })),
            })),
          };
        }
        if (table === "study_participations") {
          return {
            select: mock(() => ({
              eq: mock((column: string, value: any) => {
                if (column === "studies.created_by") {
                  return {
                    eq: mock(() => Promise.resolve({ count: 0, error: null })),
                  };
                }
                return Promise.resolve({ count: 0, error: null });
              }),
            })),
          };
        }
        if (table === "transactions") {
          return {
            select: mock(() => ({
              eq: mock(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }
        return {};
      });

      const result = await getUserStatsForResearcher(mockSupabase as any, walletAddress);

      expect(result.nActiveStudies).toBe(0);
      expect(result.nCompletedStudies).toBe(1);
    });
  });

  describe("getNumberOfUsersOnPlatform", () => {
    test("returns correct count of users", async () => {
      mockSupabase.from = mock(() => ({
        select: mock(() => Promise.resolve({ count: 42, error: null })),
      }));

      const result = await getNumberOfUsersOnPlatform(mockSupabase as any);

      expect(result).toBe(42);
    });

    test("returns 0 when count is null", async () => {
      mockSupabase.from = mock(() => ({
        select: mock(() => Promise.resolve({ count: null, error: null })),
      }));

      const result = await getNumberOfUsersOnPlatform(mockSupabase as any);

      expect(result).toBe(0);
    });

    test("throws error on database failure", async () => {
      const mockError = { message: "Database query failed" };

      mockSupabase.from = mock(() => ({
        select: mock(() => Promise.resolve({ count: null, error: mockError })),
      }));

      await expect(getNumberOfUsersOnPlatform(mockSupabase as any)).rejects.toThrow(
        "Failed to get number of users: Database query failed"
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
