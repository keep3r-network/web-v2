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
			137: process.env.RPC_URL_POLYGON,
			250: process.env.RPC_URL_FANTOM,
			42161: process.env.RPC_URL_ARBITRUM
		},
		ALCHEMY_KEY: process.env.ALCHEMY_KEY,
		ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
		INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,
		WALLETCONNECT_PROJECT_ID: process.env.WALLETCONNECT_PROJECT_ID,

		/* 📰 - Keep3r *********************************************************
		** Keep3r specific stuffs
		**********************************************************************/
		BACKEND_URI: 'https://api.keep3r.network' //Only used for stats
	}
});
