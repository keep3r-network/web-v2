import {toAddress} from '@yearn-finance/web-lib/utils';
import {ethers} from 'ethers';
import {TEnv, TEnvData} from './types.d';

export function getEnv(chainID: number, canFallback = true): TEnvData {
	const	envForChain = (process.env as TEnv).CHAINS[chainID];
	if (!envForChain && canFallback) {
		return (process.env as TEnv).CHAINS[1];
	} else if (!envForChain && !canFallback) {
		return {
			THE_KEEP3R: toAddress(ethers.constants.AddressZero),
			KEEP3R_V1_ADDR: toAddress(ethers.constants.AddressZero),
			KEEP3R_V2_ADDR: toAddress(ethers.constants.AddressZero),
			KP3R_TOKEN_ADDR: toAddress(ethers.constants.AddressZero),
			WETH_TOKEN_ADDR: toAddress(ethers.constants.AddressZero),
			KLP_KP3R_WETH_ADDR: toAddress(ethers.constants.AddressZero),
			UNI_KP3R_WETH_ADDR: toAddress(ethers.constants.AddressZero),
			CVX_TOKEN_ADDR: toAddress(ethers.constants.AddressZero),
			LIDO_TOKEN_ADDR: toAddress(ethers.constants.AddressZero),
			IB_AMM_ADDR: toAddress(ethers.constants.AddressZero),
			IB_AMM_2_ADDR: toAddress(ethers.constants.AddressZero),
			CY_AUD_TOKEN_ADDR: toAddress(ethers.constants.AddressZero),
			CY_CHF_TOKEN_ADDR: toAddress(ethers.constants.AddressZero),
			CY_GBP_TOKEN_ADDR: toAddress(ethers.constants.AddressZero),
			CY_JPY_TOKEN_ADDR: toAddress(ethers.constants.AddressZero),
			CY_EUR_TOKEN_ADDR: toAddress(ethers.constants.AddressZero),
			CY_KRW_TOKEN_ADDR: toAddress(ethers.constants.AddressZero),
			CY_ZAR_TOKEN_ADDR: toAddress(ethers.constants.AddressZero),
			EXPLORER: '',
			BACKEND_URI: ''
		};
	}
	return envForChain;
}