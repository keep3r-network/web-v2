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
			250: process.env.WS_URL_FANTOM,
			42161: process.env.WS_URL_ARBITRUM
		},
		JSON_RPC_URL: {
			1: process.env.RPC_URL_MAINNET,
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
				THE_KEEP3R: '0x0D5Dc686d0a2ABBfDaFDFb4D0533E886517d4E83',
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
			},
			5: {
				THE_KEEP3R: '0x0D5Dc686d0a2ABBfDaFDFb4D0533E886517d4E83',
				KEEP3R_V1_ADDR: '0x16F63C5036d3F48A239358656a8f123eCE85789C',
				KEEP3R_V2_ADDR: '0x145d364e193204f8ff0a87b718938406595678dd',
				KP3R_TOKEN_ADDR: '0x16F63C5036d3F48A239358656a8f123eCE85789C',
				WETH_TOKEN_ADDR: '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6',
				KLP_KP3R_WETH_ADDR: '0x78958e8e9c54d9aa56eded102097e73ef9c26411',
				UNI_KP3R_WETH_ADDR: '0x317cecd3eb02158f97df0b67b788edcda4e066e5',
				
				//Contextual
				CVX_TOKEN_ADDR: '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b',
				LIDO_TOKEN_ADDR: '0x5a98fcbea516cf06857215779fd812ca3bef1b32',

				//Offchain
				EXPLORER: 'goerli.etherscan.io',
				BACKEND_URI: 'https://api.keep3r.network'
			},
			1337: {
				THE_KEEP3R: '0x0D5Dc686d0a2ABBfDaFDFb4D0533E886517d4E83',
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
