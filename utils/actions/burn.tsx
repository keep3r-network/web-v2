import	{ethers} from	'ethers';
import	UNI_V3_PAIR_ABI				from	'utils/abi/univ3Pair.abi';
import {getProvider} from '@yearn-finance/web-lib/utils/web3/providers';
import {handleTx} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {ContractInterface} from 'ethers';
import type {TTxResponse} from '@yearn-finance/web-lib/utils/web3/transaction';

export async function	simulateBurn(
	provider: ethers.providers.Web3Provider,
	chainID: number,
	pair: string,
	liquidity: ethers.BigNumber
): Promise<[ethers.BigNumber, ethers.BigNumber]> {
	const	signer = provider.getSigner();
	const	address = await signer.getAddress();

	try {
		const	contract = new ethers.Contract(
			pair,
			UNI_V3_PAIR_ABI as ContractInterface,
			getProvider(chainID) as ethers.providers.Web3Provider
		);
		try {
			const	simulation = await contract.callStatic.burn(
				liquidity, //liquidity
				ethers.constants.Zero, //amount0Min
				ethers.constants.Zero, //amount1Min
				address, //to
				{from: address}
			);
			const	amount0Min = Number(ethers.utils.formatUnits(simulation.amount0, 18));
			const	amount1Min = Number(ethers.utils.formatUnits(simulation.amount1, 18));
			return ([
				ethers.utils.parseUnits((amount0Min * 0.95).toFixed(18), 18),
				ethers.utils.parseUnits((amount1Min * 0.95).toFixed(18), 18)

			]);
		} catch (error) {
			return ([ethers.constants.Zero, ethers.constants.Zero]);
		}
	
	} catch(error) {
		return ([ethers.constants.Zero, ethers.constants.Zero]);
	}
}

export async function	burn(
	provider: ethers.providers.Web3Provider,
	pair: string,
	liquidity: ethers.BigNumber
): Promise<TTxResponse> {
	const	signer = provider.getSigner();
	const	address = await signer.getAddress();
	const	contract = new ethers.Contract(
		pair,
		UNI_V3_PAIR_ABI as ContractInterface,
		signer
	);
	const	simulation = await contract.callStatic.burn(
		liquidity, //liquidity
		ethers.constants.Zero, //amount0Min
		ethers.constants.Zero, //amount1Min
		address //to
	);

	const	amount0Min = Number(ethers.utils.formatUnits(simulation.amount0, 18));
	const	amount1Min = Number(ethers.utils.formatUnits(simulation.amount1, 18));
	return await handleTx(contract.burn(
		liquidity, //liquidity
		ethers.utils.parseUnits((amount0Min * 0.98).toFixed(18), 18),
		ethers.utils.parseUnits((amount1Min * 0.98).toFixed(18), 18),
		address //to
	));
}
