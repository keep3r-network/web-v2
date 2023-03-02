import MainnetRegistry from './registry.1';
import OptimismRegistry from './registry.10';
import PolygonRegistry from './registry.137';
import GoerliRegistry from './registry.5';
import GoerliOptimismRegistry from './registry.420';

export type	TRegistry = {
	[key: string]: {
		chainID: number,
		address: string,
		name: string,
		repository: string
	};
}

const	registries: {[key: number]: TRegistry} = {
	1: MainnetRegistry,
	5: GoerliRegistry,
	10: OptimismRegistry,
	137: PolygonRegistry,
	420: GoerliOptimismRegistry
};

export default registries;
