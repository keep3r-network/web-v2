import {ethers} from 'ethers';
import KEEP3RV2_ABI from 'utils/abi/keep3rv2.abi';
import {getEnv} from 'utils/env';

import type {ContractInterface} from 'ethers';

export async function	withdrawLiquidityFromJob(
	provider: ethers.providers.Web3Provider,
	chainID: number,
	jobAddress: string,
	liquidityTokenAddress: string
): Promise<boolean> {
	const	signer = provider.getSigner();
	const	address = await signer.getAddress();

	try {
		const	contract = new ethers.Contract(
			getEnv(chainID).KEEP3R_V2_ADDR,
			KEEP3RV2_ABI as ContractInterface,
			signer
		);
		const	transaction = await contract.withdrawLiquidityFromJob(
			jobAddress,
			liquidityTokenAddress,
			address
		);

		const	transactionResult = await transaction.wait();
		if (transactionResult.status === 0) {
			console.error('Fail to perform transaction');
			return false;
		}

		return true;
	} catch(error) {
		console.error(error);
		return false;
	}
}
