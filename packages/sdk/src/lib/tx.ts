import { type Abi, type WalletClient, parseEventLogs } from 'viem';
import { waitForTransactionReceipt } from 'viem/actions';

/**
 * Execute a transaction and extract a specific event from the logs.
 */
export async function writeAndParse<T>(
	wallet: WalletClient,
	hash: `0x${string}`,
	abi: Abi,
	eventName: string,
): Promise<T> {
	const receipt = await waitForTransactionReceipt(wallet, { hash });
	const logs = parseEventLogs({ abi, logs: receipt.logs });
	const event = logs.find((log) => log.eventName === eventName);

	if (!event) {
		throw new Error(`${eventName} event not found`);
	}

	return event.args as T;
}

/**
 * Execute a transaction without parsing events, just wait for confirmation.
 */
export async function writeAndWait(wallet: WalletClient, hash: `0x${string}`) {
	await waitForTransactionReceipt(wallet, { hash });
	return { hash };
}
