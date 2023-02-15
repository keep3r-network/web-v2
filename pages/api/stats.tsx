import {getEnv} from 'utils/env';
import axios from 'axios';

import type {NextApiRequest, NextApiResponse} from 'next';
import type {TStatsIndexData} from 'utils/types.d';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<NextApiResponse | any> {
	const	{chainID} = req.query;

	let	currentChainID = parseInt(chainID as string, 10);
	if (currentChainID === undefined || currentChainID === null || isNaN(Number(currentChainID))) {
		currentChainID = 1;
	}

	const	[data] = await Promise.allSettled([axios.get(`${getEnv(currentChainID, false).BACKEND_URI}/stats`)]);
	if (data.status === 'rejected') {
		const	statData: TStatsIndexData = {
			bondedKp3r: '',
			jobs: 0,
			keepers: 0,
			workDone: 0,
			normalizedBondedKp3r: '',
			normalizedRewardedKp3r: '',
			rewardedKp3r: '',
			isSuccessful: false
		};
		return res.status(200).json({
			stats: statData,
			prices: {keep3rv1: 0, ethereum: 0}
		});
	}
	const	{stats} = data.value.data;
	const	{prices} = data.value.data;

	const	statData: TStatsIndexData = {
		bondedKp3r: stats?.bondedKp3r || '0',
		jobs: stats?.jobs || 0,
		keepers: stats?.keepers || 0,
		workDone: stats?.workDone || 0,
		normalizedBondedKp3r: stats?.normalizedBondedKp3r || '0',
		normalizedRewardedKp3r: stats?.normalizedRewardedKp3r || '0',
		rewardedKp3r: stats?.rewardedKp3r || '0',
		isSuccessful: true
	};
	return res.status(200).json({
		stats: statData,
		prices: {keep3rv1: prices?.keep3r || 0, ethereum: prices.ethereum}
	});
}
