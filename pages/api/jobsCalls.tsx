import REGISTRY from 'utils/registry';
import {toAddress, truncateHex} from '@yearn-finance/web-lib/utils/address';

import type {NextApiRequest, NextApiResponse} from 'next';
import type {TRegistry} from 'utils/registry';
import type {TJobCallsData} from 'utils/types.d';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<NextApiResponse | any> {
	const	{chainID, address} = req.query;
	const	currentAddress = address as string;
	
	let	currentChainID = parseInt(chainID as string, 10);
	if (currentChainID === undefined || currentChainID === null || isNaN(Number(currentChainID))) {
		currentChainID = 1;
	}
	
	const	_registry: TRegistry = {};
	for (const r of Object.values(REGISTRY[currentChainID] || {})) {
		_registry[r.address] = r;
	}

	const	jobStats: TJobCallsData = {
		job: currentAddress,
		shortName: _registry[toAddress(currentAddress)]?.name || truncateHex(currentAddress, 5)
	};
	return res.status(200).json(jobStats);
}
