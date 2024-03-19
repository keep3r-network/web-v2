import MainnetRegistry from './registry.1';
import OptimismRegistry from './registry.10';
import PolygonRegistry from './registry.137';
import SepoliaRegistry from './registry.11155111';
import OpSepoliaRegistry from './registry.11155420';

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
	10: OptimismRegistry,
	137: PolygonRegistry,
	11155111: SepoliaRegistry,
	11155420: OpSepoliaRegistry
};

export default registries;
