"use client";

import { sepolia } from "wagmi/chains";
import { isAddress, parseEther } from "viem";
import {
  reconnect,
  getAccount,
  switchChain,
  writeContract,
  waitForTransactionReceipt,
} from "wagmi/actions";
import type { Config } from "wagmi";
import { DISPERSE_ABI } from "../../api/src/contracts";

export async function disperseEthEqual({
  config,
  contractAddress,
  recipients,
  amountEachEth,
}: {
  config: Config;
  contractAddress: `0x${string}`;
  recipients: `0x${string}`[];
  amountEachEth: string | number;
}) {
  await reconnect(config);
  const account = getAccount(config);
  if (!account.address) throw new Error("Wallet not connected.");

  if (account.chainId !== sepolia.id) {
    await switchChain(config, { chainId: sepolia.id });
  }

  if (!recipients.length) throw new Error("No recipients provided.");
  recipients.forEach((a, i) => {
    if (!isAddress(a)) throw new Error(`Bad addr @${i}: ${a}`);
  });

  const each = parseEther(String(amountEachEth));
  const total = each * BigInt(recipients.length);

  const hash = await writeContract(config, {
    address: contractAddress,
    abi: DISPERSE_ABI,
    functionName: "disperseETHEqual",
    args: [recipients, each],
    value: total,
    chainId: sepolia.id,
    account: account.address,
    maxFeePerGas: BigInt("100000000000"),
    maxPriorityFeePerGas: BigInt("10000000000"),
  });

  const receipt = await waitForTransactionReceipt(config, { hash, chainId: sepolia.id });
  return { hash, receipt };
}
