import UNTYPED_REGISTRY from './registry.json';

type	TRegistry = {
	[key: string]: {
		chainID: number,
		address: string,
		name: string,
		repository: string
	};
}

const REGISTRY = UNTYPED_REGISTRY as TRegistry;

export type {TRegistry};
export default REGISTRY;
