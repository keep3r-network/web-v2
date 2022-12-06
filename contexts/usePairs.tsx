import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {Contract} from 'ethcall';
import  {ethers} from 'ethers';
import {request} from 'graphql-request';
import KEEP3RV1_ABI from 'utils/abi/keep3rv1.abi';
import UNI_V3_PAIR_ABI from 'utils/abi/univ3Pair.abi';
import {getEnv} from 'utils/env';
import {useWeb3} from '@yearn-finance/web-lib/contexts';
import {format, performBatchedUpdates, providers} from '@yearn-finance/web-lib/utils';
import {toAddress} from '@yearn-finance/web-lib/utils/address';

import type * as TPairsTypes from 'contexts/usePairs.d';
import type {BigNumber} from 'ethers';
import type {ReactElement} from 'react';
import type {TEnv} from 'utils/types.d';

function	getPairsForChain(chainID: number): TPairsTypes.TKeeperPairs {
	return ({
		[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]: {
			addressOfUni: toAddress(getEnv(chainID).UNI_KP3R_WETH_ADDR),
			addressOfPair: toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR),
			nameOfPair: 'kLP-KP3R/WETH',
			balanceOfPair: ethers.constants.Zero,
			allowanceOfPair: ethers.constants.Zero,
			addressOfToken1: toAddress(getEnv(chainID).KP3R_TOKEN_ADDR),
			nameOfToken1: 'KP3R',
			balanceOfToken1: ethers.constants.Zero,
			allowanceOfToken1: ethers.constants.Zero,
			addressOfToken2: toAddress(getEnv(chainID).WETH_TOKEN_ADDR),
			nameOfToken2: 'WETH',
			balanceOfToken2: ethers.constants.Zero,
			allowanceOfToken2: ethers.constants.Zero,
			priceOfToken1: 0,
			priceOfToken2: 0,
			hasPrice: true,
			position: {
				liquidity: ethers.constants.Zero,
				tokensOwed0: ethers.constants.Zero,
				tokensOwed1: ethers.constants.Zero
			}
		}
	});	
}

// eslint-disable-next-line prefer-destructuring
const	defaultChain = (process.env as TEnv).CHAINS[1];
const	defaultProps = {
	pairs: {
		[toAddress(defaultChain.KLP_KP3R_WETH_ADDR)]: {
			addressOfUni: toAddress(defaultChain.UNI_KP3R_WETH_ADDR),
			addressOfPair: toAddress(defaultChain.KLP_KP3R_WETH_ADDR),
			nameOfPair: 'kLP-KP3R/WETH',
			balanceOfPair: ethers.constants.Zero,
			allowanceOfPair: ethers.constants.Zero,
			addressOfToken1: toAddress(defaultChain.KP3R_TOKEN_ADDR),
			nameOfToken1: 'KP3R',
			balanceOfToken1: ethers.constants.Zero,
			allowanceOfToken1: ethers.constants.Zero,
			addressOfToken2: toAddress(defaultChain.WETH_TOKEN_ADDR),
			nameOfToken2: 'WETH',
			balanceOfToken2: ethers.constants.Zero,
			allowanceOfToken2: ethers.constants.Zero,
			priceOfToken1: 0,
			priceOfToken2: 0,
			hasPrice: true,
			position: {
				liquidity: ethers.constants.Zero,
				tokensOwed0: ethers.constants.Zero,
				tokensOwed1: ethers.constants.Zero
			}
		}
	},
	getPairs: async (): Promise<void> => undefined
};
const	Pairs = createContext<TPairsTypes.TPairsContext>(defaultProps);
export const PairsContextApp = ({children}: {children: ReactElement}): ReactElement => {
	const	{address, chainID} = useWeb3();
	const	[pairs, set_pairs] = useState<TPairsTypes.TKeeperPairs>(getPairsForChain(chainID));
	const	[, set_nonce] = useState(0);

	/* 📰 - Keep3r *************************************************************
	**	Keeper is working with a bunch of approved pairs. Right now, only one
	**	pair is activated, the KEEP3R - WETH pair. We need to get a bunch of
	**	data to correctly display and enable the actions for the user.
	***************************************************************************/
	const getPairs = useCallback(async (): Promise<void> => {
		const	currentProvider = providers.getProvider(chainID);
		const	currentAddress = address || ethers.constants.AddressZero;
		const	{KEEP3R_V2_ADDR} = getEnv(chainID);
		const	ethcallProvider = await providers.newEthCallProvider(currentProvider);
		const	_chainPairs = getPairsForChain(chainID);

		for (const pair of Object.values(_chainPairs)) {
			const	token1Contract = new Contract(pair.addressOfToken1, KEEP3RV1_ABI);
			const	token2Contract = new Contract(pair.addressOfToken2, KEEP3RV1_ABI);
			const	pairContract = new Contract(pair.addressOfPair, UNI_V3_PAIR_ABI);	
			const	calls = [
				token2Contract.balanceOf(currentAddress),
				token2Contract.allowance(currentAddress, pair.addressOfPair),
				token1Contract.balanceOf(currentAddress),
				token1Contract.allowance(currentAddress, pair.addressOfPair),
				pairContract.balanceOf(currentAddress),
				pairContract.allowance(currentAddress, KEEP3R_V2_ADDR),
				pairContract.position()
			];
			const	[results, {pool}] = await Promise.all([
				ethcallProvider.tryAll(calls),
				request('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3', `{
					pool(id: "${pair.addressOfUni.toLowerCase()}"){
						token0Price
						token1Price
					}
				}`)
			]) as [any, any];

			performBatchedUpdates((): void => {
				const	[
					balanceOfToken2, allowanceOfToken2,
					balanceOfToken1, allowanceOfToken1,
					balanceOfPair, allowanceOfPair,
					position 
				] = results;
				const	liquidity = format.BN(position?.liquidity);
				const	tokensOwed0 = format.BN(position?.tokensOwed0);
				const	tokensOwed1 = format.BN(position?.tokensOwed1);
				const	_pair = {
					addressOfUni: toAddress(pair.addressOfUni),
					addressOfPair: toAddress(pair.addressOfPair),
					nameOfPair: 'kLP-KP3R/WETH',
					balanceOfPair: format.BN(balanceOfPair as BigNumber),
					allowanceOfPair: format.BN(allowanceOfPair as BigNumber),
					addressOfToken1: toAddress(pair.addressOfToken1),
					nameOfToken1: 'KP3R',
					balanceOfToken1: format.BN(balanceOfToken1 as BigNumber),
					allowanceOfToken1: format.BN(allowanceOfToken1 as BigNumber),
					addressOfToken2: toAddress(pair.addressOfToken2),
					nameOfToken2: 'WETH',
					balanceOfToken2: format.BN(balanceOfToken2 as BigNumber),
					allowanceOfToken2: format.BN(allowanceOfToken2 as BigNumber),
					priceOfToken1: pool?.token0Price || 0,
					priceOfToken2: pool?.token1Price || 0,
					hasPrice: pool?.token0Price && pool?.token1Price,
					position: {
						liquidity: format.BN(liquidity as BigNumber),
						tokensOwed0: format.BN(tokensOwed0 as BigNumber),
						tokensOwed1: format.BN(tokensOwed1 as BigNumber)
					}
				};
				set_pairs((o: TPairsTypes.TKeeperPairs): TPairsTypes.TKeeperPairs => ({
					...o,
					[pair.addressOfPair]: _pair
				}));
				set_nonce((n: number): number => n + 1);
			});
		}
	}, [chainID, address]);
	useEffect((): void => {
		getPairs();
	}, [getPairs]);

	/* 📰 - Keep3r *************************************************************
	**	Setup and render the Context provider to use in the app.
	***************************************************************************/
	return (
		<Pairs.Provider value={{pairs, getPairs}}>
			{children}
		</Pairs.Provider>
	);
};

export const usePairs = (): TPairsTypes.TPairsContext => useContext(Pairs);
export default usePairs;
