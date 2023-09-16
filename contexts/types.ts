import type {TAddress, TDict} from '@yearn-finance/web-lib/types';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

export type	TJobStatus = {
	name: string,
	address: TAddress,
	jobOwner: TAddress,
	pendingJobMigrations: TAddress,
	jobLiquidityCredits: TNormalizedBN,
	jobPeriodCredits: TNormalizedBN,
	jobTokenCredits: TNormalizedBN,
	liquidityAmount: TNormalizedBN,
	totalJobCredits: TNormalizedBN,
	pendingUnbonds: TNormalizedBN,
	canWithdrawAfter: TNormalizedBN,
	canWithdrawIn: string,
	canWithdraw: boolean,
	hasDispute: boolean,
	isVerified: boolean,
	isLoaded: boolean,

	//From the DB for stats
	workDone: number,
	lastWork: string, //date
	totalFees: number,
	averageWorkDonePerDay: number,
	averageFees: number,
	averageEarned: number,
	uniqueKeepers: number,
	workPerKeeper: number,
	works: any[]
}

export type	TJobContext = {
	jobStatus: TJobStatus,
	getJobStatus: () => Promise<void>,
}

export type	TJobData = {
	name: string;
	address: string;
	totalCredits: TNormalizedBN;
}

export type	TJobStats = {
	governance: string;
	slashers: string[];
	disputers: string[];
	keepers: number;
	bonded: TNormalizedBN;
}

export type	TKeeperStatus = {
	balanceOf: TNormalizedBN,
	allowance: TNormalizedBN,
	bonds: TNormalizedBN,
	pendingBonds: TNormalizedBN,
	pendingUnbonds: TNormalizedBN,
	canActivateAfter: bigint,
	canWithdrawAfter: bigint,
	hasBonded: boolean,
	hasDispute: boolean,
	isDisputer: boolean,
	isSlasher: boolean,
	isGovernance: boolean,
	bondTime: bigint,
	unbondTime: bigint,
	hasPendingActivation: boolean,
	canActivate: boolean,
	canActivateIn: string,
	canWithdraw: boolean,
	canWithdrawIn: string,
}

export type	TKeep3rContext = {
	jobs: TJobData[],
	keeperStatus: TKeeperStatus,
	getJobs: () => Promise<void>,
	getKeeperStatus: () => Promise<void>,
	hasLoadedJobs: boolean,
}

export type	TKeeperPair = {
	addressOfUni: string,
	addressOfPair: string,
	nameOfPair: string,
	nameOfToken1: string,
	addressOfToken1: string,
	nameOfToken2: string,
	addressOfToken2: string
	priceOfToken1: number,
	priceOfToken2: number,
	hasPrice: boolean,
	position: {
		liquidity: TNormalizedBN,
		tokensOwed0: TNormalizedBN,
		tokensOwed1: TNormalizedBN
	}
}
export type	TUserPairsPosition = {
	balanceOfPair: TNormalizedBN,
	allowanceOfPair: TNormalizedBN,
	balanceOfToken1: TNormalizedBN,
	allowanceOfToken1: TNormalizedBN,
	balanceOfToken2: TNormalizedBN,
	allowanceOfToken2: TNormalizedBN,
}

export type	TPairsContext = {
	userPairsPosition: TDict<TUserPairsPosition>
	pairs: TDict<TKeeperPair>,
	getPairs: (_chainID: number | undefined) => Promise<void>,
	getPairsBalance: (_chainID: number | undefined, _address: TAddress) => Promise<void>
}

export type TPriceElement = {
	[index: string]: {
		'usd': string,
		'eth'?: string
	}
}
export type TPricesContext = {
	prices: TPriceElement
}
