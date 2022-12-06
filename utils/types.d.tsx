import type {TAddress} from '@yearn-finance/web-lib/utils/address';

export type	TPrices = {
	ethereum: number,
	keep3rv1: number
}

// pages/stats/index.tsx
export type TStatsIndexData = {
	bondedKp3r: string,
	jobs: number,
	keepers: number,
	workDone: number,
	normalizedBondedKp3r: string,
	normalizedRewardedKp3r: string,
	rewardedKp3r: string,
	isSuccessful: boolean
}
export type	TStatsIndex = {
	stats: TStatsIndexData,
	prices: TPrices,
	chainID: number
}

// pages/stats/[address].tsx
export type TStatsAddressData = {
	balanceOf: string,
	bonds: string,
	keeper: string,
	earned: string,
	fees: string,
	gwei: string,
	workDone: number,
	isSuccessful: boolean
}
export type	TStatsAddress = {
	stats: TStatsAddressData,
	prices: TPrices,
	chainID: number
}

// pages/job/[address]/index.tsx
export type TJobIndexData = {
	job: string,
	name: string,
	shortName: string,
	repository: string,
	isVerified: boolean
}
export type	TJobIndex = {
	stats: TJobIndexData
}

// pages/job/[address]/calls.tsx
export type TJobCallsData = {
	job: string,
	shortName: string
}
export type	TJobCalls = {
	stats: TJobCallsData
}

// pages/disputes.tsx
export type TDisputeData = {
	disputers: string[],
	slashers: string[],
	governance: string
}
export type	TDispute = {
	stats: TDisputeData
}


export type TEnvData = {
	THE_KEEP3R: TAddress,
	KEEP3R_V1_ADDR: TAddress,
	KEEP3R_V2_ADDR: TAddress,
	KP3R_TOKEN_ADDR: TAddress,
	WETH_TOKEN_ADDR: TAddress,
	KLP_KP3R_WETH_ADDR: TAddress,
	UNI_KP3R_WETH_ADDR: TAddress,

	CVX_TOKEN_ADDR: TAddress,
	LIDO_TOKEN_ADDR: TAddress,

	IB_AMM_ADDR: TAddress,
	IB_AMM_2_ADDR: TAddress,
	CY_AUD_TOKEN_ADDR: TAddress,
	CY_CHF_TOKEN_ADDR: TAddress,
	CY_GBP_TOKEN_ADDR: TAddress,
	CY_JPY_TOKEN_ADDR: TAddress,
	CY_EUR_TOKEN_ADDR: TAddress,
	CY_KRW_TOKEN_ADDR: TAddress,
	CY_ZAR_TOKEN_ADDR: TAddress,

	EXPLORER: string,
	BACKEND_URI: string,
}
export type TEnv = {
	CHAINS: {[key: number]: TEnvData}
} & any
