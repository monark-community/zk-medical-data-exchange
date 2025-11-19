import { describe, it, expect } from "bun:test";
import { getProposalStatusColor } from "./ProposalUtils";

describe("ProposalUtils - getProposalStatusColor", () => {
  it("should return correct colors for valid statuses", () => {
    expect(getProposalStatusColor("Passed")).toBe("bg-green-100 text-green-800 border-green-200");
    expect(getProposalStatusColor("Active")).toBe("bg-blue-100 text-blue-800 border-blue-200");
    expect(getProposalStatusColor("Failed")).toBe("bg-red-100 text-red-800 border-red-200");
  });

  it("should return gray colors for unknown status", () => {
    expect(getProposalStatusColor("Unknown")).toBe("bg-gray-100 text-gray-800 border-gray-200");
    expect(getProposalStatusColor("")).toBe("bg-gray-100 text-gray-800 border-gray-200");
  });
});
