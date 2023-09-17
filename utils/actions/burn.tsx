import	{ethers} from	'ethers';
import	UNI_V3_PAIR_ABI	 from 'utils/abi/univ3Pair.abi';
import {handleTx} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {ContractInterface} from 'ethers';
import type {TTxResponse} from '@yearn-finance/web-lib/utils/web3/transaction';

export async function	burn(
	provider: ethers.providers.Web3Provider,
	pair: string,
	liquidity: bigint
): Promise<TTxResponse> {
	const signer = provider.getSigner();
	const address = await signer.getAddress();
	const contract = new ethers.Contract(
		pair,
		UNI_V3_PAIR_ABI as ContractInterface,
		signer
	);
	const simulation = await contract.callStatic.burn(
		liquidity, //liquidity
		0n, //amount0Min
		0n, //amount1Min
		address //to
	);

	const amount0Min = Number(ethers.utils.formatUnits(simulation.amount0, 18));
	const amount1Min = Number(ethers.utils.formatUnits(simulation.amount1, 18));
	return await handleTx(contract.burn(
		liquidity, //liquidity
		ethers.utils.parseUnits((amount0Min * 0.995).toFixed(18), 18),
		ethers.utils.parseUnits((amount1Min * 0.995).toFixed(18), 18),
		address //to
	));
}
