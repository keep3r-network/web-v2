import type 	{BigNumber}		from	'ethers';
import type {TDict, VoidPromiseFunction} from '@yearn-finance/web-lib/types';

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
		liquidity: BigNumber,
		tokensOwed0: BigNumber,
		tokensOwed1: BigNumber
	}
}
export type	TUserPairsPosition = {
	balanceOfPair: BigNumber,
	allowanceOfPair: BigNumber,
	balanceOfToken1: BigNumber,
	allowanceOfToken1: BigNumber,
	balanceOfToken2: BigNumber,
	allowanceOfToken2: BigNumber,
}

export type	TPairsContext = {
	userPairsPosition: TDict<TUserPairsPosition>
	pairs: TDict<TKeeperPair>,
	getPairs: VoidPromiseFunction,
	getPairsBalance: VoidPromiseFunction
}
