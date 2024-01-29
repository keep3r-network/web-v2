import {toAddress} from '@yearn-finance/web-lib/utils/address';

import type {TRegistry} from './registry';

const REGISTRY: TRegistry = {
	[toAddress('0xa2c7A15FFc02e00cdeedBba56c41dAaed84f8734')]: {
		chainID: 5,
		address: toAddress('0xa2c7A15FFc02e00cdeedBba56c41dAaed84f8734'),
		name: 'BasicJob',
		repository: 'https://github.com/keep3r-network/keep3r-network-v2'
	},
	[toAddress('0xe55162a662Abaf066D0fa6FFb720Dbe8Bc16342a')]: {
		chainID: 5,
		address: toAddress('0xe55162a662Abaf066D0fa6FFb720Dbe8Bc16342a'),
		name: 'ConnextRelayerProxyHub',
		repository: 'https://github.com/connext/connext-keeper-scripts'
	},
	[toAddress('0x811Aecd063da20717E885862Bcb7Dd9383F207a9')]: {
		chainID: 5,
		address: toAddress('0x811Aecd063da20717E885862Bcb7Dd9383F207a9'),
		name: 'ConnextRelayerProxyHubStaging',
		repository: 'https://github.com/connext/connext-keeper-scripts'
	}
};

export default REGISTRY;
