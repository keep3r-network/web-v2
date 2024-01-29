import KEEP3RV2_ABI from 'utils/abi/keep3rv2.abi';
import {getEnv} from 'utils/env';
import axios from 'axios';
import {readContract} from '@wagmi/core';
import {toAddress} from '@yearn-finance/web-lib/utils/address';

import type {NextApiRequest, NextApiResponse} from 'next';
import type {TDisputeData} from 'utils/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<NextApiResponse | any> {
	const {chainID} = req.query;

	//Initial values
	let	slashersList: string[] = [];
	let	disputersList: string[] = [];
	let	governance = '';
	let	currentChainID = parseInt(chainID as string, 10);

	//Check if chainID is valid
	if (currentChainID === undefined || currentChainID === null || isNaN(Number(currentChainID))) {
		currentChainID = 1;
	}

	//Actual action
	const [slashers, disputers, results] = await Promise.allSettled([
		axios.get(`${getEnv(currentChainID).BACKEND_URI}/slashers`),
		axios.get(`${getEnv(currentChainID).BACKEND_URI}/disputers`),
		readContract({
			address: getEnv(currentChainID).KEEP3R_V2_ADDR,
			abi: KEEP3RV2_ABI,
			functionName: 'governance'
		})
	]);

	//Safechecks
	if (slashers.status === 'fulfilled') {
		slashersList = slashers.value.data.map((s: string): string => toAddress(s));
	}
	if (disputers.status === 'fulfilled') {
		disputersList = disputers.value.data.map((s: string): string => toAddress(s));
	}
	if (results.status === 'fulfilled') {
		governance = toAddress(results.value);
	}

	//Assignation
	const disputeStats: TDisputeData = {
		slashers: slashersList,
		disputers: disputersList,
		governance: governance
	};
	return res.status(200).json(disputeStats);
}
