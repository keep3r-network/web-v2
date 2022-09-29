import {ethers} from 'ethers';
import {TEnv, TEnvData} from './types.d';

export function getEnv(chainID: number, canFallback = true): TEnvData {
	const	envForChain = (process.env as TEnv).CHAINS[chainID];
	if (!envForChain && canFallback) {
		return (process.env as TEnv).CHAINS[1];
	} else if (!envForChain && !canFallback) {
		return {
			THE_KEEP3R: ethers.constants.AddressZero,
			KEEP3R_V1_ADDR: ethers.constants.AddressZero,
			KEEP3R_V2_ADDR: ethers.constants.AddressZero,
			KP3R_TOKEN_ADDR: ethers.constants.AddressZero,
			WETH_TOKEN_ADDR: ethers.constants.AddressZero,
			KLP_KP3R_WETH_ADDR: ethers.constants.AddressZero,
			UNI_KP3R_WETH_ADDR: ethers.constants.AddressZero,
			CVX_TOKEN_ADDR: ethers.constants.AddressZero,
			LIDO_TOKEN_ADDR: ethers.constants.AddressZero,
			EXPLORER: '',
			BACKEND_URI: ''
		};
	}
	return envForChain;
}