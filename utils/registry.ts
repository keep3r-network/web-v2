import MainnetRegistry from './registry.1';
import GoerliRegistry from './registry.5';
import OptimismRegistry from './registry.10';
import PolygonRegistry from './registry.137';
import GoerliOptimismRegistry from './registry.420';

import type {TAddress} from '@yearn-finance/web-lib/types';

export type	TRegistry = {
	[key: TAddress]: {
		chainID: number,
		address: TAddress,
		name: string,
		repository: string
	};
}

const registries: {[key: number]: TRegistry} = {
	1: MainnetRegistry,
	5: GoerliRegistry,
	10: OptimismRegistry,
	137: PolygonRegistry,
	420: GoerliOptimismRegistry
};

export default registries;
