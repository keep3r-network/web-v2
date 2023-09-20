import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {request} from 'graphql-request';
import KEEP3RV1_ABI from 'utils/abi/keep3rv1.abi';
import UNI_V3_PAIR_ABI from 'utils/abi/univ3Pair.abi';
import {getEnv} from 'utils/env';
import {zeroAddress} from 'viem';
import {readContracts} from 'wagmi';
import {useUpdateEffect} from '@react-hookz/web';
import {readContract} from '@wagmi/core';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {isZeroAddress, toAddress} from '@yearn-finance/web-lib/utils/address';
import {decodeAsBigInt} from '@yearn-finance/web-lib/utils/decoder';
import {toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {performBatchedUpdates} from '@yearn-finance/web-lib/utils/performBatchedUpdates';

import type {ReactElement} from 'react';
import type {TAddress, TDict, TNDict} from '@yearn-finance/web-lib/types';
import type {TKeeperPair, TPairsContext, TUserPairsPosition} from './types';

function getPairsForChain(chainID: number): TDict<TKeeperPair> {
	return ({
		[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]: {
			addressOfUni: toAddress(getEnv(chainID).UNI_KP3R_WETH_ADDR),
			addressOfPair: toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR),
			nameOfPair: 'kLP-KP3R/WETH',
			addressOfToken1: toAddress(getEnv(chainID).KP3R_TOKEN_ADDR),
			nameOfToken1: 'KP3R',
			addressOfToken2: toAddress(getEnv(chainID)?.WETH_TOKEN_ADDR || zeroAddress),
			nameOfToken2: 'WETH',
			priceOfToken1: 0,
			priceOfToken2: 0,
			hasPrice: true,
			position: {
				liquidity: toNormalizedBN(0n),
				tokensOwed0: toNormalizedBN(0n),
				tokensOwed1: toNormalizedBN(0n)
			}
		}
	});	
}

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const Pairs = createContext<TPairsContext>({} as TPairsContext);
export const PairsContextApp = ({children}: {children: ReactElement}): ReactElement => {
	const {isActive, address, provider} = useWeb3();
	const {chainID, safeChainID} = useChainID();
	const [pairs, set_pairs] = useState<TNDict<TDict<TKeeperPair>>>({[chainID]: getPairsForChain(chainID)});
	const [userPairsPosition, set_userPairsPosition] = useState<TNDict<TDict<TUserPairsPosition>>>({});
	const [, set_nonce] = useState(0);

	/* 📰 - Keep3r *************************************************************
	**	Keeper is working with a bunch of approved pairs. Right now, only one
	**	pair is activated, the KEEP3R - WETH pair. We need to get a bunch of
	**	data to correctly display and enable the actions for the user.
	***************************************************************************/
	const getPairs = useCallback(async (_chainID: number): Promise<void> => {
		const _chainPairs = getPairsForChain(_chainID);

		for (const pair of Object.values(_chainPairs)) {
			const pairContract = {address: toAddress(pair.addressOfPair), abi: UNI_V3_PAIR_ABI};
			const result = await readContract({...pairContract, functionName: 'position'});
			const {pool} = await request('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3', `{
				pool(id: "${pair.addressOfUni.toLowerCase()}"){
					token0Price
					token1Price
				}
			}`) as {pool: {token0Price: number, token1Price: number}};
			
			performBatchedUpdates((): void => {
				const position = result;
				const liquidity = toNormalizedBN(position[0]);
				const tokensOwed0 = toNormalizedBN(position[3]);
				const tokensOwed1 = toNormalizedBN(position[4]);
				const _pair = {
					addressOfUni: toAddress(pair.addressOfUni),
					addressOfPair: toAddress(pair.addressOfPair),
					nameOfPair: 'kLP-KP3R/WETH',
					addressOfToken1: toAddress(pair.addressOfToken1),
					nameOfToken1: 'KP3R',
					addressOfToken2: toAddress(pair.addressOfToken2),
					nameOfToken2: 'WETH',
					priceOfToken1: pool?.token0Price || 0,
					priceOfToken2: pool?.token1Price || 0,
					hasPrice: Boolean(pool?.token0Price && pool?.token1Price),
					position: {
						liquidity: liquidity,
						tokensOwed0: tokensOwed0,
						tokensOwed1: tokensOwed1
					}
				};
				console.warn(_pair);
				set_pairs((o: TNDict<TDict<TKeeperPair>>): TNDict<TDict<TKeeperPair>> => ({
					...o,
					[_chainID]: {
						...o[_chainID],
						[pair.addressOfPair]: _pair
					}
				}));
				set_nonce((n: number): number => n + 1);
			});
		}
	}, []);
	useEffect((): void => {
		getPairs(chainID);
	}, [getPairs, chainID]);

	const getPairsBalance = useCallback(async (
		_chainID: number = chainID,
		_address: TAddress
	): Promise<void> => {
		if (!_address || !provider || isZeroAddress(toAddress(_address))) {
			return;
		}
		const currentAddress = _address;
		const {KEEP3R_V2_ADDR} = getEnv(_chainID);
		const _chainPairs = getPairsForChain(_chainID);

		for (const pair of Object.values(_chainPairs)) {
			const token1Contract = {address: toAddress(pair.addressOfToken1), abi: KEEP3RV1_ABI};
			const token2Contract = {address: toAddress(pair.addressOfToken2), abi: KEEP3RV1_ABI};
			const pairContract = {address: toAddress(pair.addressOfPair), abi: UNI_V3_PAIR_ABI};
			const results = await readContracts({
				contracts: [
					{...token2Contract, functionName: 'balanceOf', args: [currentAddress]},
					{...token2Contract, functionName: 'allowance', args: [currentAddress, toAddress(pair.addressOfPair)]},
					{...token2Contract, functionName: 'decimals'},
					{...token1Contract, functionName: 'balanceOf', args: [currentAddress]},
					{...token1Contract, functionName: 'allowance', args: [currentAddress, toAddress(pair.addressOfPair)]},
					{...token1Contract, functionName: 'decimals'},
					{...pairContract, functionName: 'balanceOf', args: [currentAddress]},
					{...pairContract, functionName: 'allowance', args: [currentAddress, KEEP3R_V2_ADDR]},
					{...pairContract, functionName: 'decimals'}

				]
			});
			performBatchedUpdates((): void => {
				const [
					balanceOfToken2, allowanceOfToken2, _decimalsOfToken2,
					balanceOfToken1, allowanceOfToken1, _decimalsOfToken1,
					balanceOfPair, allowanceOfPair, _decimalsOfPair
				] = results;
				const decimalsOfToken1 = decodeAsBigInt(_decimalsOfToken1);
				const decimalsOfToken2 = decodeAsBigInt(_decimalsOfToken2);
				const decimalsOfPair = decodeAsBigInt(_decimalsOfPair);
				const _pair = {
					balanceOfPair: toNormalizedBN(decodeAsBigInt(balanceOfPair), Number(decimalsOfPair)),
					allowanceOfPair: toNormalizedBN(decodeAsBigInt(allowanceOfPair), Number(decimalsOfPair)),
					balanceOfToken1: toNormalizedBN(decodeAsBigInt(balanceOfToken1), Number(decimalsOfToken1)),
					allowanceOfToken1: toNormalizedBN(decodeAsBigInt(allowanceOfToken1), Number(decimalsOfToken1)),
					balanceOfToken2: toNormalizedBN(decodeAsBigInt(balanceOfToken2), Number(decimalsOfToken2)),
					allowanceOfToken2: toNormalizedBN(decodeAsBigInt(allowanceOfToken2), Number(decimalsOfToken2))
				};
				set_userPairsPosition((o: TNDict<TDict<TUserPairsPosition>>): TNDict<TDict<TUserPairsPosition>> => ({
					...o,
					[_chainID]: {
						...o[_chainID],
						[toAddress(pair.addressOfPair)]: _pair
					}
				}));
				set_nonce((n: number): number => n + 1);
			});
		}
	}, [chainID, provider]);
	useUpdateEffect((): void => {
		getPairsBalance(chainID, toAddress(address));
	}, [getPairsBalance, chainID, address]);


	/* 📰 - Keep3r *************************************************************
	**	Setup and render the Context provider to use in the app.
	***************************************************************************/
	return (
		<Pairs.Provider
			value={{
				pairs: pairs[safeChainID],
				userPairsPosition: isActive && !isZeroAddress(toAddress(address)) ? userPairsPosition[safeChainID] : {},
				getPairs,
				getPairsBalance
			}}>
			{children}
		</Pairs.Provider>
	);
};

export const usePairs = (): TPairsContext => useContext(Pairs);
export default usePairs;
