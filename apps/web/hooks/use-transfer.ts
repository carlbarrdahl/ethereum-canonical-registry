import { type Address, type Hash, erc20Abi, zeroAddress } from "viem";
import {
  useWriteContract,
  useSendTransaction,
  type UseWriteContractReturnType,
  type UseSendTransactionReturnType,
} from "wagmi";
import { isNativeToken } from "@ethereum-entity-registry/sdk";

export interface TransferParams {
  token: Address;
  to: Address;
  amount: bigint;
}

export interface UseTransferReturnType {
  transferAsync: (params: TransferParams) => Promise<Hash>;
  data: Hash | undefined;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: Error | null;
  writeContract: UseWriteContractReturnType;
  sendTransaction: UseSendTransactionReturnType;
}

export function useTransfer(): UseTransferReturnType {
  const writeContract = useWriteContract();
  const sendTransaction = useSendTransaction();

  // Determine which hook is active
  const isPending = writeContract.isPending || sendTransaction.isPending;
  const isError = writeContract.isError || sendTransaction.isError;
  const isSuccess = writeContract.isSuccess || sendTransaction.isSuccess;
  const error = writeContract.error || sendTransaction.error;
  const data = writeContract.data || sendTransaction.data;

  const transferAsync = async ({ token, to, amount }: TransferParams) => {
    if (isNativeToken(token)) {
      // Transfer native ETH
      return sendTransaction.mutateAsync({ to, value: amount });
    } else {
      // Transfer ERC20 token
      return writeContract.mutateAsync({
        address: token,
        abi: erc20Abi,
        functionName: "transfer",
        args: [to, amount],
      });
    }
  };

  return {
    transferAsync,
    data,
    isPending,
    isError,
    isSuccess,
    error,
    // Expose underlying hooks for advanced usage
    writeContract,
    sendTransaction,
  };
}
