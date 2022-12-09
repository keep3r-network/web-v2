type	TRegistry = {
	[key: string]: {
		chainID: number,
		address: string,
		name: string,
		repository: string
	};
}
const	REGISTRY: TRegistry = {
	'0x28937B751050FcFd47Fd49165C6E1268c296BA19': {
		chainID: 1,
		address: '0x28937B751050FcFd47Fd49165C6E1268c296BA19',
		name: 'MakerDAOUpkeep',
		repository: 'https://github.com/defi-wonderland/keep3r-cli-job-maker'
	},
	'0x5D469E1ef75507b0E0439667ae45e280b9D81B9C': {
		chainID: 1,
		address: '0x5D469E1ef75507b0E0439667ae45e280b9D81B9C',
		name: 'MakerDAOUpkeep',
		repository: 'https://github.com/defi-wonderland/keep3r-cli-job-maker'
	},
	'0x62496bDF47De3c07e12F84a20681426AbCC618e2': {
		chainID: 1,
		address: '0x62496bDF47De3c07e12F84a20681426AbCC618e2',
		name: 'DCAKeep3rJob',
		repository: 'https://github.com/Mean-Finance/keep3r-script'
	},
	'0x220a85bCd2212ab0b27EFd0de8b5e03175f0adee': {
		chainID: 1,
		address: '0x220a85bCd2212ab0b27EFd0de8b5e03175f0adee',
		name: 'YearnHarvestV2',
		repository: 'https://github.com/defi-wonderland/yearn-keeper-scripts'
	},
	'0xE6DD4B94B0143142E6d7ef3110029c1dcE8215cb': {
		chainID: 1,
		address: '0xE6DD4B94B0143142E6d7ef3110029c1dcE8215cb',
		name: 'YearnHarvestV2',
		repository: 'https://github.com/defi-wonderland/yearn-keeper-scripts'
	},
	'0xdeE991cbF8527A33E84a2aAb8a65d68D5D591bAa': {
		chainID: 1,
		address: '0xdeE991cbF8527A33E84a2aAb8a65d68D5D591bAa',
		name: 'YearnTendV2',
		repository: 'https://github.com/defi-wonderland/yearn-keeper-scripts'
	},
	'0xcD7f72F12c4b87dAbd31d3aa478A1381150c32b3': {
		chainID: 1,
		address: '0xcD7f72F12c4b87dAbd31d3aa478A1381150c32b3',
		name: 'YearnTendV2',
		repository: 'https://github.com/defi-wonderland/yearn-keeper-scripts'
	},
	'0x656027367B5e27dC21984B546e64dC24dBFaA187': {
		chainID: 1,
		address: '0x656027367B5e27dC21984B546e64dC24dBFaA187',
		name: 'PhutureRebalancing',
		repository: 'https://github.com/Phuture-Finance/keep3r-cli-job-phuture'
	},
	'0xa61d82a9127B1c1a34Ce03879A068Af5b786C835': {
		chainID: 1,
		address: '0xa61d82a9127B1c1a34Ce03879A068Af5b786C835',
		name: 'PhutureDepositManager',
		repository:'https://github.com/Phuture-Finance/keep3r-cli-deposit-manager-job'
	},
	'0xEC771dc7Bd0aA67a10b1aF124B9b9a0DC4aF5F9B': {
		chainID: 1,
		address: '0xEC771dc7Bd0aA67a10b1aF124B9b9a0DC4aF5F9B',
		name: 'PhutureHarvesting',
		repository: 'https://github.com/Phuture-Finance/keep3r-cli-job-phuture-savings-vault'
	},
	'0x553591d6eac7A127dE36063a1b6cD31D2FB9E42d': {
		chainID: 1,
		address: '0x553591d6eac7A127dE36063a1b6cD31D2FB9E42d',
		name: 'SidechainOracles Job',
		repository: 'https://github.com/defi-wonderland/sidechain-oracles-keeper-scripts'
	}
};

export type {TRegistry};
export default REGISTRY;
