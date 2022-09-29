import {NextApiRequest, NextApiResponse} from 'next';
import {toAddress, truncateHex} from '@yearn-finance/web-lib/utils';
import REGISTRY, {TRegistry} from 'utils/registry';
import type {TJobIndexData} from 'utils/types.d';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<NextApiResponse | any> {
	const	{chainID, address} = req.query;
	const	currentAddress = address as string;
	
	let	currentChainID = parseInt(chainID as string, 10);
	if (currentChainID === undefined || currentChainID === null || isNaN(Number(currentChainID))) {
		currentChainID = 1;
	}
	
	const	_registry: TRegistry = {};
	for (const r of Object.values(REGISTRY)) {
		if (r.chainID === currentChainID) {
			_registry[r.address] = r;
		}
	}

	const	jobStats: TJobIndexData = {
		job: currentAddress,
		name: _registry[toAddress(currentAddress)]?.name || 'Unverified job',
		repository: _registry[toAddress(currentAddress)]?.repository || '',
		shortName: _registry[toAddress(currentAddress)]?.name || truncateHex(currentAddress, 5),
		isVerified: _registry[toAddress(currentAddress)]?.name ? true : false
	};
	return res.status(200).json(jobStats);
}
