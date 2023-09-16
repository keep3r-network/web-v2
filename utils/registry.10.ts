import {toAddress} from '@yearn-finance/web-lib/utils/address';

import type {TRegistry} from './registry';

const REGISTRY: TRegistry = {
	[toAddress('0xE787B1C26190644b03d6100368728BfD6b55DD97')]: {
		chainID: 10,
		address: toAddress('0xE787B1C26190644b03d6100368728BfD6b55DD97'),
		name: 'RevertCompoundor',
		repository: 'https://github.com/defi-wonderland/revert-keeper-scripts'
	}
};

export default REGISTRY;
