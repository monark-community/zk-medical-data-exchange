import { describe, it, expect, mock, afterEach } from "bun:test";
import type { Request, Response } from "express";

afterEach(() => {
  mock.restore(); // resets ALL mocks
});
import {
  createStudy,
  deployStudy,
  getStudies,
  updateStudy,
  participateInStudy,
  generateDataCommitmentChallenge,
  getEnrolledStudies,
  revokeStudyConsent,
  grantStudyConsent,
} from "./studyController";

process.env.NODE_ENV = "test";

// Mock data
const mockStudy = {
  id: 1,
  title: "Test Study",
  description: "A test study",
  max_participants: 100,
  duration_days: 30,
  criteria_json: { enableAge: 1, minAge: 18, maxAge: 65 },
  criteria_hash: "mock-hash",
  status: "active",
  current_participants: 5,
  created_by: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  complexity_score: 2,
  template_name: null,
  created_at: new Date().toISOString(),
  contract_address: "0x1234567890123456789012345678901234567890",
  deployment_tx_hash: "0xabc",
  deployed_at: new Date().toISOString(),
};

const mockParticipation = {
  id: 1,
  study_id: 1,
  participant_wallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  proof_json: { a: [1, 2], b: [[3, 4]], c: [5, 6] },
  public_inputs_json: '{"challenge": "mock-challenge"}',
  data_commitment: "12345",
  status: "verified",
  has_consented: true,
  enrolled_at: new Date().toISOString(),
  study: mockStudy,
};

const mockCommitment = {
  id: 1,
  study_id: 1,
  wallet_address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
  data_commitment: "12345",
  challenge: "mock-challenge",
  proof_submitted: false,
  expires_at: new Date(Date.now() + 3600000).toISOString(),
  signature: "0xsignature",
};

// Mock services
const mockAuditService = {
  logStudyCreation: mock(() => Promise.resolve()),
  logStudyParticipation: mock(() => Promise.resolve()),
  logStudyDeletion: mock(() => Promise.resolve()),
  logConsentRevocation: mock(() => Promise.resolve()),
  logConsentGranting: mock(() => Promise.resolve()),
};

const mockStudyService = {
  deployStudy: mock(() =>
    Promise.resolve({
      success: true,
      studyId: 1,
      studyAddress: "0x123",
      transactionHash: "0xabc",
      gasUsed: 100000,
    })
  ),
  registerCommitmentOnChain: mock(() =>
    Promise.resolve({
      success: true,
      transactionHash: "0xdef",
    })
  ),
  joinBlockchainStudy: mock(() => Promise.resolve("0xghi")),
  revokeStudyConsent: mock(() =>
    Promise.resolve({
      success: true,
      transactionHash: "0xrevoke",
    })
  ),
  grantStudyConsent: mock(() =>
    Promise.resolve({
      success: true,
      transactionHash: "0xgrant",
    })
  ),
};

mock.module("@/services/auditService", () => ({
  auditService: mockAuditService,
}));

// Removed global studyService mock to avoid interference with other test files
mock.module("@/services/studyService", () => ({
  studyService: mockStudyService,
}));

mock.module("@/utils/logger", () => ({
  default: {
    info: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
  },
}));

mock.module("ethers", () => ({
  verifyMessage: mock(() => "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"),
}));

mock.module("crypto", () => ({
  createHash: mock(() => ({
    update: mock(() => ({
      digest: mock(() => "mock-hash"),
    })),
  })),
  randomBytes: mock(() => Buffer.from("mock-challenge")),
}));

const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  body: {},
  params: {},
  query: {},
  supabase: {} as any,
  get: mock(() => "test-user-agent"),
  ip: "127.0.0.1",
  socket: { remoteAddress: "127.0.0.1" } as any,
  ...overrides,
});

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: mock(() => res),
    json: mock(() => res),
    send: mock(() => res),
  };
  return res;
};

describe("StudyController - Comprehensive Coverage Tests", () => {
  describe("createStudy - Error Paths", () => {
    it("should handle missing title", async () => {
      const req = createMockRequest({
        body: {
          description: "Test",
          createdBy: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        },
        supabase: {} as any,
      });
      const res = createMockResponse();

      await createStudy(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Study title is required",
        })
      );
    });

    it("should handle invalid custom criteria", async () => {
      const mockSupabase = {
        from: mock(() => ({})),
      };

      const req = createMockRequest({
        body: {
          title: "Test Study",
          description: "Test",
          createdBy: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          customCriteria: {
            enableAge: 1,
            minAge: 100, // Invalid: minAge > maxAge
            maxAge: 18,
          },
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await createStudy(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid study criteria",
        })
      );
    });

    it("should handle database insertion error", async () => {
      const mockSupabase = {
        from: mock(() => ({
          insert: mock(() => ({
            select: mock(() => ({
              single: mock(() => Promise.resolve({ data: null, error: { message: "DB Error" } })),
            })),
          })),
        })),
      };

      const req = createMockRequest({
        body: {
          title: "Test Study",
          description: "Test",
          createdBy: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await createStudy(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should create study with template", async () => {
      const mockSupabase = {
        from: mock(() => ({
          insert: mock(() => ({
            select: mock(() => ({
              single: mock(() => Promise.resolve({ data: mockStudy, error: null })),
            })),
          })),
        })),
      };

      const req = createMockRequest({
        body: {
          title: "Test Study",
          description: "Test",
          createdBy: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          templateName: "diabetes",
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await createStudy(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("deployStudy - Error Paths", () => {
    it("should handle study fetch error", async () => {
      const mockSupabase = {
        from: mock(() => ({
          select: mock(() => ({
            eq: mock(() => ({
              single: mock(() => Promise.resolve({ data: null, error: { message: "Not found" } })),
            })),
          })),
        })),
      };

      const req = createMockRequest({
        params: { id: "1" },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await deployStudy(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should handle invalid criteria JSON", async () => {
      const mockSupabase = {
        from: mock((table: string) => ({
          select: mock(() => ({
            eq: mock(() => ({
              single: mock(() =>
                Promise.resolve({
                  data: {
                    ...mockStudy,
                    status: "draft",
                    deployment_tx_hash: null,
                    criteria_json: "invalid json{",
                  },
                  error: null,
                })
              ),
            })),
          })),
          update: mock(() => ({
            eq: mock(() => Promise.resolve({ error: null })),
          })),
        })),
      };

      const req = createMockRequest({
        params: { id: "1" },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await deployStudy(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid criteria JSON format",
        })
      );
    });

    it("should handle blockchain deployment failure", async () => {
      const failedStudyService = {
        ...mockStudyService,
        deployStudy: mock(() =>
          Promise.resolve({
            success: false,
            error: "Blockchain error",
          })
        ),
      };

      mock.module("@/services/studyService", () => ({
        studyService: failedStudyService,
      }));

      const mockSupabase = {
        from: mock((table: string) => ({
          select: mock(() => ({
            eq: mock(() => ({
              single: mock(() =>
                Promise.resolve({
                  data: { ...mockStudy, status: "draft", deployment_tx_hash: null },
                  error: null,
                })
              ),
            })),
          })),
          update: mock(() => ({
            eq: mock(() => Promise.resolve({ error: null })),
          })),
        })),
      };

      const req = createMockRequest({
        params: { id: "1" },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await deployStudy(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("participateInStudy - Complex Scenarios", () => {
    it("should handle data commitment mismatch", async () => {
      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "data_commitments") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() =>
                      Promise.resolve({
                        data: { ...mockCommitment, data_commitment: "different" },
                        error: null,
                      })
                    ),
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: {
          participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          proofJson: {},
          dataCommitment: "12345",
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await participateInStudy(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "COMMITMENT_MISMATCH",
        })
      );
    });

    it("should handle proof already submitted", async () => {
      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "data_commitments") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() =>
                      Promise.resolve({
                        data: { ...mockCommitment, proof_submitted: true },
                        error: null,
                      })
                    ),
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: {
          participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          proofJson: {},
          dataCommitment: "12345",
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await participateInStudy(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "PROOF_ALREADY_SUBMITTED",
        })
      );
    });

    it("should handle challenge mismatch in public inputs", async () => {
      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "data_commitments") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() =>
                      Promise.resolve({
                        data: mockCommitment,
                        error: null,
                      })
                    ),
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: {
          participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          proofJson: {},
          dataCommitment: "12345",
          publicInputsJson: '{"challenge": "wrong-challenge"}',
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await participateInStudy(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "CHALLENGE_MISMATCH",
        })
      );
    });

    it("should handle inactive study", async () => {
      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "data_commitments") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() => Promise.resolve({ data: mockCommitment, error: null })),
                  })),
                })),
              })),
            };
          }
          if (table === "studies") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  single: mock(() =>
                    Promise.resolve({
                      data: { ...mockStudy, status: "draft" },
                      error: null,
                    })
                  ),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: {
          participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          proofJson: {},
          dataCommitment: "12345",
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await participateInStudy(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Study is not accepting participants",
        })
      );
    });

    it("should handle study full", async () => {
      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "data_commitments") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() => Promise.resolve({ data: mockCommitment, error: null })),
                  })),
                })),
              })),
            };
          }
          if (table === "studies") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  single: mock(() =>
                    Promise.resolve({
                      data: {
                        ...mockStudy,
                        current_participants: 100,
                        max_participants: 100,
                      },
                      error: null,
                    })
                  ),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: {
          participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          proofJson: {},
          dataCommitment: "12345",
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await participateInStudy(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Study is full",
        })
      );
    });

    it("should handle already participated", async () => {
      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "data_commitments") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() => Promise.resolve({ data: mockCommitment, error: null })),
                  })),
                })),
              })),
            };
          }
          if (table === "studies") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  single: mock(() => Promise.resolve({ data: mockStudy, error: null })),
                })),
              })),
            };
          }
          if (table === "study_participations") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() => Promise.resolve({ data: mockParticipation, error: null })),
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: {
          participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          proofJson: {},
          dataCommitment: "12345",
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await participateInStudy(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Already participated in this study",
        })
      );
    });

    it("should handle participation insert error", async () => {
      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "data_commitments") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() => Promise.resolve({ data: mockCommitment, error: null })),
                  })),
                })),
              })),
            };
          }
          if (table === "studies") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  single: mock(() => Promise.resolve({ data: mockStudy, error: null })),
                })),
              })),
            };
          }
          if (table === "study_participations") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() => Promise.resolve({ data: null, error: null })),
                  })),
                })),
              })),
              insert: mock(() => ({
                select: mock(() => ({
                  single: mock(() =>
                    Promise.resolve({ data: null, error: { message: "Insert failed" } })
                  ),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: {
          participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          proofJson: {},
          dataCommitment: "12345",
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await participateInStudy(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("generateDataCommitmentChallenge - Edge Cases", () => {
    it("should handle missing study ID", async () => {
      const req = createMockRequest({
        body: {
          participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          dataCommitment: "12345",
          signature: "0xsig",
        },
        supabase: {} as any,
      });
      const res = createMockResponse();

      await generateDataCommitmentChallenge(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Study ID is required",
        })
      );
    });

    it("should handle missing signature", async () => {
      const req = createMockRequest({
        body: {
          studyId: 1,
          participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          dataCommitment: "12345",
        },
        supabase: {} as any,
      });
      const res = createMockResponse();

      await generateDataCommitmentChallenge(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Signature is required",
        })
      );
    });

    it("should return existing valid challenge", async () => {
      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "studies") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  single: mock(() => Promise.resolve({ data: mockStudy, error: null })),
                })),
              })),
            };
          }
          if (table === "data_commitments") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() => Promise.resolve({ data: mockCommitment, error: null })),
                  })),
                })),
              })),
              delete: mock(() => ({
                eq: mock(() => Promise.resolve({ error: null })),
              })),
              insert: mock(() => ({
                select: mock(() => ({
                  single: mock(() => Promise.resolve({ data: { id: 1 }, error: null })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        body: {
          studyId: 1,
          participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          dataCommitment: "12345",
          signature: "0xsig",
          challenge: "test-challenge-123",
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await generateDataCommitmentChallenge(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it("should handle blockchain registration failure gracefully", async () => {
      const failedBlockchainService = {
        ...mockStudyService,
        registerCommitmentOnChain: mock(() =>
          Promise.resolve({
            success: false,
            error: "Blockchain error",
          })
        ),
      };

      mock.module("@/services/studyService", () => ({
        studyService: failedBlockchainService,
      }));

      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "studies") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  single: mock(() => Promise.resolve({ data: mockStudy, error: null })),
                })),
              })),
            };
          }
          if (table === "data_commitments") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() => Promise.resolve({ data: null, error: null })),
                  })),
                })),
              })),
              insert: mock(() => ({
                select: mock(() => ({
                  single: mock(() => Promise.resolve({ data: { id: 1 }, error: null })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        body: {
          studyId: 1,
          participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          dataCommitment: "12345",
          signature: "0xsig",
          challenge: "test-challenge-123",
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await generateDataCommitmentChallenge(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getStudies - Filters and Pagination", () => {
    it("should filter by status and template", async () => {
      const mockSupabase = {
        from: mock(() => ({
          select: mock(() => ({
            order: mock(() => ({
              eq: mock(() => ({
                eq: mock(() => Promise.resolve({ data: [mockStudy], error: null, count: 1 })),
              })),
            })),
          })),
        })),
      };

      const req = createMockRequest({
        query: {
          status: "active",
          template: "diabetes",
          page: "1",
          limit: "10",
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await getStudies(req as Request, res as Response);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("Consent Operations - Edge Cases", () => {
    it("should handle missing participant wallet in revoke", async () => {
      const req = createMockRequest({
        params: { id: "1" },
        body: {},
        supabase: {} as any,
      });
      const res = createMockResponse();

      await revokeStudyConsent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Participant wallet address is required",
        })
      );
    });

    it("should handle missing study ID in revoke", async () => {
      const req = createMockRequest({
        params: {},
        body: { participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" },
        supabase: {} as any,
      });
      const res = createMockResponse();

      await revokeStudyConsent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Study ID is required",
        })
      );
    });

    it("should handle participation not found in revoke", async () => {
      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "study_participations") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() =>
                      Promise.resolve({ data: null, error: { message: "Not found" } })
                    ),
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: { participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await revokeStudyConsent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Participation not found in this study",
        })
      );
    });

    it("should handle consent already revoked", async () => {
      const revokedParticipation = {
        ...mockParticipation,
        has_consented: false,
      };

      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "study_participations") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() =>
                      Promise.resolve({ data: revokedParticipation, error: null })
                    ),
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: { participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await revokeStudyConsent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Consent already revoked",
        })
      );
    });

    it("should handle blockchain consent revoke failure", async () => {
      const failedBlockchainService = {
        ...mockStudyService,
        revokeStudyConsent: mock(() =>
          Promise.resolve({
            success: false,
            error: "Blockchain error",
          })
        ),
      };

      mock.module("@/services/studyService", () => ({
        studyService: failedBlockchainService,
      }));

      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "study_participations") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() => Promise.resolve({ data: mockParticipation, error: null })),
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: { participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await revokeStudyConsent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Failed to revoke consent on blockchain",
        })
      );
    });

    it("should handle study without contract address (skip blockchain)", async () => {
      const participationNoContract = {
        ...mockParticipation,
        study: { ...mockStudy, contract_address: null },
      };

      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "study_participations") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() =>
                      Promise.resolve({ data: participationNoContract, error: null })
                    ),
                  })),
                })),
              })),
              update: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => Promise.resolve({ error: null })),
                })),
              })),
            };
          }
          if (table === "studies") {
            return {
              update: mock(() => ({
                eq: mock(() => Promise.resolve({ error: null })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: { participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await revokeStudyConsent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          blockchainTxHash: null,
        })
      );
    });

    it("should handle blockchain exception in revoke", async () => {
      const throwingBlockchainService = {
        ...mockStudyService,
        revokeStudyConsent: mock(() => {
          throw new Error("Blockchain crashed");
        }),
      };

      mock.module("@/services/studyService", () => ({
        studyService: throwingBlockchainService,
      }));

      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "study_participations") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() => Promise.resolve({ data: mockParticipation, error: null })),
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: { participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await revokeStudyConsent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle missing participant wallet in grant", async () => {
      const req = createMockRequest({
        params: { id: "1" },
        body: {},
        supabase: {} as any,
      });
      const res = createMockResponse();

      await grantStudyConsent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Participant wallet address is required",
        })
      );
    });

    it("should handle blockchain grant failure", async () => {
      const failedBlockchainService = {
        ...mockStudyService,
        grantStudyConsent: mock(() =>
          Promise.resolve({
            success: false,
            error: "Blockchain error",
          })
        ),
      };

      mock.module("@/services/studyService", () => ({
        studyService: failedBlockchainService,
      }));

      const revokedParticipation = {
        ...mockParticipation,
        has_consented: false,
      };

      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "study_participations") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() =>
                      Promise.resolve({ data: revokedParticipation, error: null })
                    ),
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: { participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await grantStudyConsent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getEnrolledStudies - Error Paths", () => {
    it("should handle participation fetch error", async () => {
      const mockSupabase = {
        from: mock(() => ({
          select: mock(() => ({
            eq: mock(() => Promise.resolve({ data: null, error: { message: "DB Error" } })),
          })),
        })),
      };

      const req = createMockRequest({
        params: { walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await getEnrolledStudies(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle study details fetch error", async () => {
      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "study_participations") {
            return {
              select: mock(() => ({
                eq: mock(() =>
                  Promise.resolve({ data: [{ study_id: 1, has_consented: true }], error: null })
                ),
              })),
            };
          }
          if (table === "studies") {
            return {
              select: mock(() => ({
                in: mock(() => ({
                  order: mock(() =>
                    Promise.resolve({ data: null, error: { message: "DB Error" } })
                  ),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        params: { walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await getEnrolledStudies(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("updateStudy - Error Paths", () => {
    it("should handle update error", async () => {
      const mockSupabase = {
        from: mock(() => ({
          update: mock(() => ({
            eq: mock(() => ({
              select: mock(() => ({
                single: mock(() =>
                  Promise.resolve({ data: null, error: { message: "Update failed" } })
                ),
              })),
            })),
          })),
        })),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: { status: "active" },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await updateStudy(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should update study with all fields", async () => {
      const mockSupabase = {
        from: mock(() => ({
          update: mock(() => ({
            eq: mock(() => ({
              select: mock(() => ({
                single: mock(() => Promise.resolve({ data: mockStudy, error: null })),
              })),
            })),
          })),
        })),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: {
          status: "active",
          contractAddress: "0x123",
          deploymentTxHash: "0xabc",
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await updateStudy(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe("Complex Integration Scenarios", () => {
    it("should handle successful participation flow end-to-end", async () => {
      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "data_commitments") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() => Promise.resolve({ data: mockCommitment, error: null })),
                  })),
                })),
              })),
              update: mock(() => ({
                eq: mock(() => Promise.resolve({ error: null })),
              })),
            };
          }
          if (table === "studies") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  single: mock(() => Promise.resolve({ data: mockStudy, error: null })),
                })),
              })),
              update: mock(() => ({
                eq: mock(() => Promise.resolve({ error: null })),
              })),
            };
          }
          if (table === "study_participations") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() => Promise.resolve({ data: null, error: null })),
                  })),
                })),
              })),
              insert: mock(() => ({
                select: mock(() => ({
                  single: mock(() => Promise.resolve({ data: mockParticipation, error: null })),
                })),
              })),
              update: mock(() => ({
                eq: mock(() => Promise.resolve({ error: null })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: {
          participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          proofJson: { a: [1, 2], b: [[3, 4]], c: [5, 6] },
          dataCommitment: "12345",
          publicInputsJson: '{"challenge": "mock-challenge"}',
          matchedCriteria: ["age", "gender"],
          eligibilityScore: 95,
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await participateInStudy(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          participantId: expect.any(Number),
        })
      );
    });

    it("should handle expired commitment deletion", async () => {
      const expiredCommitment = {
        ...mockCommitment,
        expires_at: new Date(Date.now() - 3600000).toISOString(),
        proof_submitted: false,
      };

      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "studies") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  single: mock(() => Promise.resolve({ data: mockStudy, error: null })),
                })),
              })),
            };
          }
          if (table === "data_commitments") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() => Promise.resolve({ data: expiredCommitment, error: null })),
                  })),
                })),
              })),
              delete: mock(() => ({
                eq: mock(() => Promise.resolve({ error: null })),
              })),
              insert: mock(() => ({
                select: mock(() => ({
                  single: mock(() => Promise.resolve({ data: { id: 2 }, error: null })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        body: {
          studyId: 1,
          participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          dataCommitment: "12345",
          signature: "0xsig",
          challenge: "test-challenge-123",
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await generateDataCommitmentChallenge(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it("should handle commitment insert error", async () => {
      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "studies") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  single: mock(() => Promise.resolve({ data: mockStudy, error: null })),
                })),
              })),
            };
          }
          if (table === "data_commitments") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() => Promise.resolve({ data: null, error: null })),
                  })),
                })),
              })),
              insert: mock(() => ({
                select: mock(() => ({
                  single: mock(() =>
                    Promise.resolve({ data: null, error: { message: "Insert failed" } })
                  ),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        body: {
          studyId: 1,
          participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          dataCommitment: "12345",
          signature: "0xsig",
          challenge: "test-challenge-123",
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await generateDataCommitmentChallenge(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle commitment update failure", async () => {
      const mockSupabase = {
        from: mock((table: string) => {
          if (table === "data_commitments") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() => Promise.resolve({ data: mockCommitment, error: null })),
                  })),
                })),
              })),
              update: mock(() => ({
                eq: mock(() => Promise.resolve({ error: { message: "Update failed" } })),
              })),
            };
          }
          if (table === "studies") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  single: mock(() => Promise.resolve({ data: mockStudy, error: null })),
                })),
              })),
              update: mock(() => ({
                eq: mock(() => Promise.resolve({ error: null })),
              })),
            };
          }
          if (table === "study_participations") {
            return {
              select: mock(() => ({
                eq: mock(() => ({
                  eq: mock(() => ({
                    single: mock(() => Promise.resolve({ data: null, error: null })),
                  })),
                })),
              })),
              insert: mock(() => ({
                select: mock(() => ({
                  single: mock(() => Promise.resolve({ data: mockParticipation, error: null })),
                })),
              })),
              update: mock(() => ({
                eq: mock(() => Promise.resolve({ error: null })),
              })),
            };
          }
          return {};
        }),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: {
          participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          proofJson: {},
          dataCommitment: "12345",
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await participateInStudy(req as Request, res as Response);

      // Should still succeed even if commitment update fails (logging only)
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Error Handling - General", () => {
    it("should handle unexpected error in createStudy", async () => {
      const mockSupabase = {
        from: mock(() => {
          throw new Error("Unexpected error");
        }),
      };

      const req = createMockRequest({
        body: {
          title: "Test",
          createdBy: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await createStudy(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Internal server error",
        })
      );
    });

    it("should handle unexpected error in participateInStudy", async () => {
      const mockSupabase = {
        from: mock(() => {
          throw new Error("Unexpected error");
        }),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: {
          participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          proofJson: {},
          dataCommitment: "12345",
        },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await participateInStudy(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle unexpected error in consent operations", async () => {
      const mockSupabase = {
        from: mock(() => {
          throw new Error("Unexpected error");
        }),
      };

      const req = createMockRequest({
        params: { id: "1" },
        body: { participantWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" },
        supabase: mockSupabase as any,
      });
      const res = createMockResponse();

      await revokeStudyConsent(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
