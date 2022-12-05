import axios from 'axios';
import {NextApiRequest, NextApiResponse} from 'next';
import {Contract} from 'ethcall';
import {providers, toAddress} from '@yearn-finance/web-lib/utils';
import KEEP3RV2_ABI from 'utils/abi/keep3rv2.abi';
import type {TDisputeData} from 'utils/types.d';
import {getEnv} from 'utils/env';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<NextApiResponse | any> {
	const	{chainID} = req.query;

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
	const	ethcallProvider = await providers.newEthCallProvider(providers.getProvider(1));
	const	keep3rV2 = new Contract(
		getEnv(currentChainID).KEEP3R_V2_ADDR,
		KEEP3RV2_ABI
	);
	const	[slashers, disputers, results] = await Promise.allSettled([
		axios.get(`${getEnv(currentChainID).BACKEND_URI}/slashers`),
		axios.get(`${getEnv(currentChainID).BACKEND_URI}/disputers`),
		ethcallProvider.tryAll([keep3rV2.governance()])
	]);

	//Safechecks
	if (slashers.status === 'fulfilled')
		slashersList = slashers.value.data.map((s: string): string => toAddress(s));
	if (disputers.status === 'fulfilled')
		disputersList = disputers.value.data.map((s: string): string => toAddress(s));
	if (results.status === 'fulfilled')
		governance = toAddress(results.value[0] as string);

	//Assignation
	const	disputeStats: TDisputeData = {
		slashers: slashersList,
		disputers: disputersList,
		governance: governance
	};
	return res.status(200).json(disputeStats);
}
