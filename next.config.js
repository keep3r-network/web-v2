/* eslint-disable @typescript-eslint/explicit-function-return-type */
const withPWA = require('next-pwa')({
	dest: 'public'
});
const {PHASE_EXPORT} = require('next/constants');


module.exports = (phase) => withPWA({
	assetPrefix: process.env.IPFS_BUILD === 'true' || phase === PHASE_EXPORT ? './' : '/',
	images: {
		unoptimized: process.env.IPFS_BUILD === 'true' || phase === PHASE_EXPORT, //Exporting image does not support optimization
		domains: [
			'rawcdn.githack.com',
			'raw.githubusercontent.com'
		]
	},
	env: {
		CG_IDS: ['ethereum', 'keep3rv1'],

		/* 📰 - Keep3r *********************************************************
		** Config over the RPC
		**********************************************************************/
		WEB_SOCKET_URL: {
			1: process.env.WS_URL_MAINNET,
			137: process.env.WS_URL_POLYGON,
			250: process.env.WS_URL_FANTOM,
			42161: process.env.WS_URL_ARBITRUM
		},
		JSON_RPC_URL: {
			1: 'https://1rpc.io/eth' || process.env.RPC_URL_MAINNET,
			137: process.env.RPC_URL_FANTOM,
			250: process.env.RPC_URL_FANTOM,
			42161: process.env.RPC_URL_ARBITRUM
		},
		ALCHEMY_KEY: process.env.ALCHEMY_KEY,
		INFURA_KEY: process.env.INFURA_KEY,

		/* 📰 - Keep3r *********************************************************
		** Keep3r specific stuffs
		**********************************************************************/
		BACKEND_URI: 'https://api.keep3r.network', //Only used for stats
		CHAINS: {
			1: {
				THE_KEEP3R_GOVERNANCE: '0x0D5Dc686d0a2ABBfDaFDFb4D0533E886517d4E83',
				KEEP3R_V1_ADDR: '0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44',
				KEEP3R_V2_ADDR: '0xeb02addcfd8b773a5ffa6b9d1fe99c566f8c44cc',
				KP3R_TOKEN_ADDR: '0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44',
				WETH_TOKEN_ADDR: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
				KLP_KP3R_WETH_ADDR: '0x3f6740b5898c5D3650ec6eAce9a649Ac791e44D7',
				UNI_KP3R_WETH_ADDR: '0x11B7a6bc0259ed6Cf9DB8F499988F9eCc7167bf5',

				//Contextual
				CVX_TOKEN_ADDR: '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b',
				LIDO_TOKEN_ADDR: '0x5a98fcbea516cf06857215779fd812ca3bef1b32',

				//Debt
				IB_AMM_ADDR: '0x0a0B06322825cb979678C722BA9932E0e4B5fd90',
				IB_AMM_2_ADDR: '0x8338Aa899fB3168598D871Edc1FE2B4F0Ca6BBEF',
				CY_AUD_TOKEN_ADDR: '0x86BBD9ac8B9B44C95FFc6BAAe58E25033B7548AA',
				CY_CHF_TOKEN_ADDR: '0x1b3E95E8ECF7A7caB6c4De1b344F94865aBD12d5',
				CY_GBP_TOKEN_ADDR: '0xecaB2C76f1A8359A06fAB5fA0CEea51280A97eCF',
				CY_JPY_TOKEN_ADDR: '0x215F34af6557A6598DbdA9aa11cc556F5AE264B1',
				CY_EUR_TOKEN_ADDR: '0x00e5c0774A5F065c285068170b20393925C84BF3',
				CY_KRW_TOKEN_ADDR: '0x3c9f5385c288cE438Ed55620938A4B967c080101',
				CY_ZAR_TOKEN_ADDR: '0x672473908587b10e65DAB177Dbaeadcbb30BF40B',

				//Offchain
				EXPLORER: 'etherscan.io',
				BACKEND_URI: 'https://api.keep3r.network'
			},
			10: {
				THE_KEEP3R_GOVERNANCE: '0x7d6daDb31dBeBc68c8A0b2cCfE5C1f26F24bD41d',
				KEEP3R_V1_ADDR: '0xca87472DBfB041c2e5a2672d319eA6184Ad9755e',
				KEEP3R_V2_ADDR: '0x745a50320B6eB8FF281f1664Fc6713991661B129',
				KP3R_TOKEN_ADDR: '0xca87472DBfB041c2e5a2672d319eA6184Ad9755e',
				KLP_KP3R_WETH_ADDR: '0xf232D1Afbed9Df3880143d4FAD095f3698c4d1c6',
				UNI_KP3R_WETH_ADDR: '0x4Ab2c969C64302e5d931e5cEf4755392DC005604',

				//Offchain
				EXPLORER: 'optimistic.etherscan.io',
				BACKEND_URI: 'https://api.keep3r.network'
			},
			5: {
				THE_KEEP3R_GOVERNANCE: '0x258b180E741157763236F5277619D71ECf00B906',
				KEEP3R_V1_ADDR: '0x16F63C5036d3F48A239358656a8f123eCE85789C',
				KEEP3R_V2_ADDR: '0x85063437C02Ba7F4f82F898859e4992380DEd3bb',
				KP3R_TOKEN_ADDR: '0x16F63C5036d3F48A239358656a8f123eCE85789C',
				WETH_TOKEN_ADDR: '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6',
				KLP_KP3R_WETH_ADDR: '0xb4A7137B024d4C0531b0164fCb6E8fc20e6777Ae',
				UNI_KP3R_WETH_ADDR: '0x317cecd3eb02158f97df0b67b788edcda4e066e5',

				//Offchain
				EXPLORER: 'goerli.etherscan.io',
				BACKEND_URI: 'https://api.keep3r.network'
			},
			137: {
				THE_KEEP3R_GOVERNANCE: '0x9A040a31bc38919D50FD740973dBB6F8fdee1426',
				KEEP3R_V1_ADDR: '0x4a2bE2075588BcE6A7E072574698a7DbbAc39b08',
				KEEP3R_V2_ADDR: '0x745a50320b6eb8ff281f1664fc6713991661b129',
				KP3R_TOKEN_ADDR: '0x4a2bE2075588BcE6A7E072574698a7DbbAc39b08',
				WETH_TOKEN_ADDR: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
				KLP_KP3R_WETH_ADDR: '0x7cf93c434260519537184631a347ee8ad0bc68cb',
				UNI_KP3R_WETH_ADDR: '0x6a060bf6579318c15138160ee1f1d225fcc9d409',

				//Offchain
				EXPLORER: 'polygonscan.com',
				BACKEND_URI: 'https://api.keep3r.network'
			},
			420: {
				THE_KEEP3R_GOVERNANCE: '0x258b180E741157763236F5277619D71ECf00B906',
				KEEP3R_V1_ADDR: '0x3Db593146464816F10d4eBA4743C76A5A4D08425',
				KEEP3R_V2_ADDR: '0x745a50320B6eB8FF281f1664Fc6713991661B129',
				KP3R_TOKEN_ADDR: '0x3Db593146464816F10d4eBA4743C76A5A4D08425',
				KLP_KP3R_WETH_ADDR: '0xA437aC90d360c7645f25f30ddE201a94fe137Af5',
				UNI_KP3R_WETH_ADDR: '0x4ECFF2c532d47D7be3D957E4a332AB134cad1fd9',

				//Offchain
				EXPLORER: 'goerli-optimism.etherscan.io',
				BACKEND_URI: 'https://api.keep3r.network'
			},
			1337: {
				THE_KEEP3R_GOVERNANCE: '0x0D5Dc686d0a2ABBfDaFDFb4D0533E886517d4E83',
				KEEP3R_V1_ADDR: '0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44',
				KEEP3R_V2_ADDR: '0xeb02addcfd8b773a5ffa6b9d1fe99c566f8c44cc',
				KP3R_TOKEN_ADDR: '0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44',
				WETH_TOKEN_ADDR: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
				KLP_KP3R_WETH_ADDR: '0x3f6740b5898c5D3650ec6eAce9a649Ac791e44D7',
				UNI_KP3R_WETH_ADDR: '0x11B7a6bc0259ed6Cf9DB8F499988F9eCc7167bf5',

				//Contextual
				CVX_TOKEN_ADDR: '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b',
				LIDO_TOKEN_ADDR: '0x5a98fcbea516cf06857215779fd812ca3bef1b32',

				//Offchain
				EXPLORER: 'etherscan.io',
				BACKEND_URI: 'https://api.keep3r.network'
			}
		}
	}
});
