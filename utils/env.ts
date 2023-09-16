import {CHAINS} from 'utils/constants';
import {zeroAddress} from 'viem';
import {toAddress} from '@yearn-finance/web-lib/utils/address';

import type {TEnvData} from './types';

export function getEnv(chainID: number, canFallback = true): TEnvData {
	if (chainID in CHAINS) {
		const envForChain = CHAINS[chainID];
		if (!envForChain && canFallback) {
			return CHAINS[1];
		} if (!envForChain && !canFallback) {
			return {
				THE_KEEP3R_GOVERNANCE: toAddress(zeroAddress),
				KEEP3R_V1_ADDR: toAddress(zeroAddress),
				KEEP3R_V2_ADDR: toAddress(zeroAddress),
				KP3R_TOKEN_ADDR: toAddress(zeroAddress),
				WETH_TOKEN_ADDR: toAddress(zeroAddress),
				KLP_KP3R_WETH_ADDR: toAddress(zeroAddress),
				UNI_KP3R_WETH_ADDR: toAddress(zeroAddress),
				CVX_TOKEN_ADDR: toAddress(zeroAddress),
				LIDO_TOKEN_ADDR: toAddress(zeroAddress),
				IB_AMM_ADDR: toAddress(zeroAddress),
				IB_AMM_2_ADDR: toAddress(zeroAddress),
				CY_AUD_TOKEN_ADDR: toAddress(zeroAddress),
				CY_CHF_TOKEN_ADDR: toAddress(zeroAddress),
				CY_GBP_TOKEN_ADDR: toAddress(zeroAddress),
				CY_JPY_TOKEN_ADDR: toAddress(zeroAddress),
				CY_EUR_TOKEN_ADDR: toAddress(zeroAddress),
				CY_KRW_TOKEN_ADDR: toAddress(zeroAddress),
				CY_ZAR_TOKEN_ADDR: toAddress(zeroAddress),
				EXPLORER: '',
				BACKEND_URI: ''
			};
		}
		return envForChain;
	}
	return CHAINS[1];
}

export function getBridgeURI(chainID: number): string {
	if (chainID === 420) {
		return ('https://amarok-testnet.coinhippo.io/TKN-from-goerli-to-optimism');
	}
	if (chainID === 137) {
		return ('https://bridge.connext.network/KP3R-from-ethereum-to-polygon');
	}
	if (chainID === 10) {
		return ('https://amarok.bridge.connext.network/KP3R-from-ethereum-to-optimism');
	}
	
	//default for sidechains
	return ('https://bridge.connext.network/');
}
