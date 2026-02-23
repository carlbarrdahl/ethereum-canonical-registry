import { privateKeyToAccount } from "viem/accounts";
import { NextResponse } from "next/server";

export async function GET() {
  const privateKey = process.env.SIGNER_PRIVATE_KEY as `0x${string}`;
  const account = privateKeyToAccount(privateKey);
  return NextResponse.json({ address: account.address });
}
