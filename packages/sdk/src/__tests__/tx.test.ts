import { describe, it, expect, vi, beforeEach } from "vitest";
import { writeAndParse, writeAndWait } from "../lib/tx";

vi.mock("viem/actions", () => ({
  waitForTransactionReceipt: vi.fn(),
}));

vi.mock("viem", () => ({
  parseEventLogs: vi.fn(),
}));

import { waitForTransactionReceipt } from "viem/actions";
import { parseEventLogs } from "viem";

const mockWaitForReceipt = waitForTransactionReceipt as any;
const mockParseEventLogs = parseEventLogs as any;

const mockWallet = {} as any;
const mockHash = "0xabc123" as `0x${string}`;
const mockAbi = [] as any;

describe("writeAndParse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts the correct event from receipt logs", async () => {
    const mockReceipt = { logs: [{}] };
    const mockLogs = [
      { eventName: "Transfer", args: { from: "0x1", to: "0x2", value: 100n } },
      { eventName: "Approval", args: { owner: "0x1", spender: "0x3" } },
    ];

    mockWaitForReceipt.mockResolvedValue(mockReceipt as any);
    mockParseEventLogs.mockReturnValue(mockLogs as any);

    const result = await writeAndParse(mockWallet, mockHash, mockAbi, "Transfer");

    expect(result).toEqual({ from: "0x1", to: "0x2", value: 100n });
  });

  it("returns the first matching event when multiple exist", async () => {
    const mockReceipt = { logs: [{}, {}] };
    const mockLogs = [
      { eventName: "Transfer", args: { to: "0x2" } },
      { eventName: "Transfer", args: { to: "0x3" } },
    ];

    mockWaitForReceipt.mockResolvedValue(mockReceipt as any);
    mockParseEventLogs.mockReturnValue(mockLogs as any);

    const result = await writeAndParse<{ to: string }>(mockWallet, mockHash, mockAbi, "Transfer");

    expect(result.to).toBe("0x2");
  });

  it("throws when the event is not found in logs", async () => {
    const mockReceipt = { logs: [{}] };
    const mockLogs = [
      { eventName: "Approval", args: {} },
    ];

    mockWaitForReceipt.mockResolvedValue(mockReceipt as any);
    mockParseEventLogs.mockReturnValue(mockLogs as any);

    await expect(
      writeAndParse(mockWallet, mockHash, mockAbi, "Transfer"),
    ).rejects.toThrow("Transfer event not found");
  });

  it("throws when logs are empty", async () => {
    const mockReceipt = { logs: [] };
    mockWaitForReceipt.mockResolvedValue(mockReceipt as any);
    mockParseEventLogs.mockReturnValue([]);

    await expect(
      writeAndParse(mockWallet, mockHash, mockAbi, "StrategyCreated"),
    ).rejects.toThrow("StrategyCreated event not found");
  });
});

describe("writeAndWait", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the hash after confirmation", async () => {
    mockWaitForReceipt.mockResolvedValue({} as any);

    const result = await writeAndWait(mockWallet, mockHash);

    expect(result).toEqual({ hash: mockHash });
  });

  it("waits for receipt before returning", async () => {
    mockWaitForReceipt.mockResolvedValue({} as any);

    await writeAndWait(mockWallet, mockHash);

    expect(mockWaitForReceipt).toHaveBeenCalledWith(mockWallet, { hash: mockHash });
  });
});
