import KEEP3RV1_ABI from 'utils/abi/keep3rv1.abi';
import KEEP3RV2_ABI from 'utils/abi/keep3rv2.abi';
import {getEnv} from 'utils/env';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {decodeAsBigInt} from '@yearn-finance/web-lib/utils/decoder';
import {getClient} from '@yearn-finance/web-lib/utils/wagmi/utils';

import type {NextApiRequest, NextApiResponse} from 'next';
import type {TStatsAddressData} from 'utils/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<NextApiResponse | any> {
	const {chainID, address} = req.query;

	let	currentChainID = parseInt(chainID as string, 10);
	if (currentChainID === undefined || currentChainID === null || isNaN(Number(currentChainID))) {
		currentChainID = 1;
	}
	const multicallInstance = getClient(currentChainID).multicall;
	let balanceOf = '';
	let bonds = '';

	const [data, results] = await Promise.allSettled([
		fetch(`${getEnv(currentChainID, false).BACKEND_URI}/works/keeper/${address}`),
		multicallInstance({
			contracts: [
				{address: getEnv(currentChainID, false).KEEP3R_V1_ADDR, abi: KEEP3RV1_ABI, functionName: 'balanceOf', args: [toAddress(String(address))]},
				{address: getEnv(currentChainID, false).KEEP3R_V2_ADDR, abi: KEEP3RV2_ABI, functionName: 'bonds', args: [toAddress(String(address)), getEnv(currentChainID, false).KP3R_TOKEN_ADDR]}
			]
		})
	]);
	if (results.status === 'fulfilled') {
		balanceOf = String(decodeAsBigInt(results.value[0]));
		bonds = String(decodeAsBigInt(results.value[1]));
	}
	if (data.status === 'rejected') {
		const keeperStats: TStatsAddressData = {
			balanceOf: balanceOf,
			bonds: bonds,
			keeper: toAddress(address as string),
			earned: '',
			fees: '',
			gwei: '',
			workDone: 0,
			isSuccessful: false
		};
		return res.status(200).json({
			stats: keeperStats,
			prices: {keep3rv1: 0, ethereum: 0}
		});
	}
	const dataValue = await data.value.json();

	// eslint-disable-next-line prefer-destructuring
	const keeperDetails = dataValue.works[0];
	const {prices} = dataValue;
	const keeperStats: TStatsAddressData = {
		balanceOf: balanceOf,
		bonds: bonds,
		keeper: keeperDetails.keeper,
		earned: keeperDetails.earned,
		fees: keeperDetails.fees,
		gwei: keeperDetails.gwei,
		workDone: keeperDetails.workDone,
		isSuccessful: true
	};

	return res.status(200).json({
		stats: keeperStats,
		prices: {keep3rv1: prices.keep3r, ethereum: prices.ethereum}
	});
}
