import {toAddress} from '@yearn-finance/web-lib/utils/address';

import type {TRegistry} from './registry';

const REGISTRY: TRegistry = {
	[toAddress('0x86196e610acE45257456c648fa1CDc146Ce6516F')]: {
		chainID: 137,
		address: toAddress('0x86196e610acE45257456c648fa1CDc146Ce6516F'),
		name: 'RevertCompoundor',
		repository: 'https://github.com/defi-wonderland/revert-keeper-scripts'
	}
};

export default REGISTRY;
