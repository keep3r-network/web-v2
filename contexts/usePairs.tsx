import React, {createContext, useCallback, useContext, useState} from 'react';
import {Contract} from 'ethcall';
import {ethers} from 'ethers';
import {request} from 'graphql-request';
import KEEP3RV1_ABI from 'utils/abi/keep3rv1.abi';
import UNI_V3_PAIR_ABI from 'utils/abi/univ3Pair.abi';
import {getEnv} from 'utils/env';
import {useUpdateEffect} from '@react-hookz/web';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {formatBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {getProvider, newEthCallProvider} from '@yearn-finance/web-lib/utils/web3/providers';

import type * as TPairsTypes from 'contexts/usePairs.d';
import type {BigNumber} from 'ethers';
import type {ReactElement} from 'react';
import type {TAddress, TDict, TNDict} from '@yearn-finance/web-lib/types';

function	getPairsForChain(chainID: number): TDict<TPairsTypes.TKeeperPair> {
	return ({
		[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]: {
			addressOfUni: toAddress(getEnv(chainID).UNI_KP3R_WETH_ADDR),
			addressOfPair: toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR),
			nameOfPair: 'kLP-KP3R/WETH',
			addressOfToken1: toAddress(getEnv(chainID).KP3R_TOKEN_ADDR),
			nameOfToken1: 'KP3R',
			addressOfToken2: toAddress(getEnv(chainID)?.WETH_TOKEN_ADDR || ethers.constants.AddressZero),
			nameOfToken2: 'WETH',
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

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const	Pairs = createContext<TPairsTypes.TPairsContext>({} as TPairsTypes.TPairsContext);
export const PairsContextApp = ({children}: {children: ReactElement}): ReactElement => {
	const	{isActive, address, provider} = useWeb3();
	const	{chainID, safeChainID} = useChainID();
	const	[pairs, set_pairs] = useState<TNDict<TDict<TPairsTypes.TKeeperPair>>>({[chainID]: getPairsForChain(chainID)});
	const	[userPairsPosition, set_userPairsPosition] = useState<TNDict<TDict<TPairsTypes.TUserPairsPosition>>>({});
	const	[, set_nonce] = useState(0);

	/* 📰 - Keep3r *************************************************************
	**	Keeper is working with a bunch of approved pairs. Right now, only one
	**	pair is activated, the KEEP3R - WETH pair. We need to get a bunch of
	**	data to correctly display and enable the actions for the user.
	***************************************************************************/
	const getPairs = useCallback(async (
		_chainID: number = chainID,
		_provider: ethers.providers.JsonRpcProvider = provider
	): Promise<void> => {
		const	currentProvider = _provider || getProvider(_chainID);
		const	ethcallProvider = await newEthCallProvider(currentProvider);
		const	_chainPairs = getPairsForChain(_chainID);

		for (const pair of Object.values(_chainPairs)) {
			const	pairContract = new Contract(pair.addressOfPair, UNI_V3_PAIR_ABI);	
			const	calls = [pairContract.position()];
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
				const	[position] = results;
				const	liquidity = formatBN(position?.liquidity);
				const	tokensOwed0 = formatBN(position?.tokensOwed0);
				const	tokensOwed1 = formatBN(position?.tokensOwed1);
				const	_pair = {
					addressOfUni: toAddress(pair.addressOfUni),
					addressOfPair: toAddress(pair.addressOfPair),
					nameOfPair: 'kLP-KP3R/WETH',
					addressOfToken1: toAddress(pair.addressOfToken1),
					nameOfToken1: 'KP3R',
					addressOfToken2: toAddress(pair.addressOfToken2),
					nameOfToken2: 'WETH',
					priceOfToken1: pool?.token0Price || 0,
					priceOfToken2: pool?.token1Price || 0,
					hasPrice: pool?.token0Price && pool?.token1Price,
					position: {
						liquidity: formatBN(liquidity as BigNumber),
						tokensOwed0: formatBN(tokensOwed0 as BigNumber),
						tokensOwed1: formatBN(tokensOwed1 as BigNumber)
					}
				};
				set_pairs((o: TNDict<TDict<TPairsTypes.TKeeperPair>>): TNDict<TDict<TPairsTypes.TKeeperPair>> => ({
					...o,
					[_chainID]: {
						...o[_chainID],
						[pair.addressOfPair]: _pair
					}
				}));
				set_nonce((n: number): number => n + 1);
			});
		}
	}, [chainID, provider]);
	useUpdateEffect((): void => {
		getPairs(chainID, provider);
	}, [getPairs, chainID, provider]);

	const getPairsBalance = useCallback(async (
		_chainID: number = chainID,
		_address: TAddress = toAddress(address),
		_provider: ethers.providers.JsonRpcProvider = provider
	): Promise<void> => {
		if (!_address || !provider) {
			return;
		}
		const	currentProvider = _provider;
		const	currentAddress = _address;
		const	{KEEP3R_V2_ADDR} = getEnv(_chainID);
		const	ethcallProvider = await newEthCallProvider(currentProvider);
		const	_chainPairs = getPairsForChain(_chainID);

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
				pairContract.allowance(currentAddress, KEEP3R_V2_ADDR)
			];
			const	results = await ethcallProvider.tryAll(calls);
			performBatchedUpdates((): void => {
				const	[balanceOfToken2, allowanceOfToken2, balanceOfToken1, allowanceOfToken1, balanceOfPair, allowanceOfPair] = results;
				const	_pair = {
					balanceOfPair: formatBN(balanceOfPair as BigNumber),
					allowanceOfPair: formatBN(allowanceOfPair as BigNumber),
					balanceOfToken1: formatBN(balanceOfToken1 as BigNumber),
					allowanceOfToken1: formatBN(allowanceOfToken1 as BigNumber),
					balanceOfToken2: formatBN(balanceOfToken2 as BigNumber),
					allowanceOfToken2: formatBN(allowanceOfToken2 as BigNumber)
				};
				set_userPairsPosition((o: TNDict<TDict<TPairsTypes.TUserPairsPosition>>): TNDict<TDict<TPairsTypes.TUserPairsPosition>> => ({
					...o,
					[_chainID]: {
						...o[_chainID],
						[pair.addressOfPair]: _pair
					}
				}));
				set_nonce((n: number): number => n + 1);
			});
		}
	}, [address, chainID, provider]);
	useUpdateEffect((): void => {
		getPairsBalance(chainID, toAddress(address), provider);
	}, [getPairsBalance, chainID, address, provider]);


	/* 📰 - Keep3r *************************************************************
	**	Setup and render the Context provider to use in the app.
	***************************************************************************/
	return (
		<Pairs.Provider
			value={{
				pairs: pairs[safeChainID],
				userPairsPosition: isActive ? userPairsPosition[safeChainID] : {},
				getPairs,
				getPairsBalance
			}}>
			{children}
		</Pairs.Provider>
	);
};

export const usePairs = (): TPairsTypes.TPairsContext => useContext(Pairs);
export default usePairs;
