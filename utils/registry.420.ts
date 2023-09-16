import {toAddress} from '@yearn-finance/web-lib/utils/address';

import type {TRegistry} from './registry';

const REGISTRY: TRegistry = {
	[toAddress('0x9abB5cfF47b9F604351a6f0730d9fe39Fb620B2b')]: {
		chainID: 420,
		address: toAddress('0x9abB5cfF47b9F604351a6f0730d9fe39Fb620B2b'),
		name: 'BasicRatedJob',
		repository: 'https://github.com/keep3r-network/keep3r-network-v2'
	}
};

export default REGISTRY;
