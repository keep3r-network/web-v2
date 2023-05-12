import	{ethers} from	'ethers';
import	UNI_V3_PAIR_ABI				from	'utils/abi/univ3Pair.abi';
import {handleTx} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {ContractInterface} from 'ethers';
import type {TTxResponse} from '@yearn-finance/web-lib/utils/web3/transaction';

export async function	mint(
	provider: ethers.providers.Web3Provider,
	pair: string,
	amountToken1: ethers.BigNumber,
	amountToken2: ethers.BigNumber
): Promise<TTxResponse> {
	const	signer = provider.getSigner();
	const	address = await signer.getAddress();
	const	contract = new ethers.Contract(
		pair,
		UNI_V3_PAIR_ABI as ContractInterface,
		signer
	);
	const	amountToken1String = Number(ethers.utils.formatUnits(amountToken1, 18));
	const	amountToken2String = Number(ethers.utils.formatUnits(amountToken2, 18));
	
	return await handleTx(contract.mint(
		amountToken1, //amount0Desired
		amountToken2, //amount1Desired
		ethers.utils.parseUnits((amountToken1String * 0.995).toFixed(18), 18),
		ethers.utils.parseUnits((amountToken2String * 0.995).toFixed(18), 18),
		address //to
	));
}
