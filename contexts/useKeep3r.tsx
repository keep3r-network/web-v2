import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {Contract} from 'ethcall';
import  {ethers} from 'ethers';
import KEEP3RV1_ABI from 'utils/abi/keep3rv1.abi';
import KEEP3RV2_ABI from 'utils/abi/keep3rv2.abi';
import {getEnv} from 'utils/env';
import REGISTRY from 'utils/registry';
import {useWeb3} from '@yearn-finance/web-lib/contexts';
import {format, performBatchedUpdates, providers} from '@yearn-finance/web-lib/utils';
import {toAddress} from '@yearn-finance/web-lib/utils/address';

import type * as TKeep3rTypes from 'contexts/useKeep3r.d';
import type {ReactElement} from 'react';
import type {TRegistry} from 'utils/registry';

const	defaultProps = {
	jobs: [],
	keeperStatus: {
		wEthBalanceOf: ethers.constants.Zero,
		wEthAllowance: ethers.constants.Zero,
		balanceOf: ethers.constants.Zero,
		allowance: ethers.constants.Zero,
		bonds: ethers.constants.Zero,
		pendingBonds: ethers.constants.Zero,
		pendingUnbonds: ethers.constants.Zero,
		canActivateAfter: ethers.constants.Zero,
		canWithdrawAfter: ethers.constants.Zero,
		hasBonded: false,
		hasDispute: false,
		isDisputer: false,
		isSlasher: false,
		isGovernance: false,
		bondTime: format.BN(259200),
		unbondTime: format.BN(1209600),
		hasPendingActivation: false,
		canActivate: false,
		canActivateIn: 'Now',
		canWithdraw: false,
		canWithdrawIn: 'Now'
	},
	hasLoadedJobs: false,
	getJobs: async (): Promise<void> => undefined,
	getKeeperStatus: async (): Promise<void> => undefined
};
const	Keep3rContext = createContext<TKeep3rTypes.TKeep3rContext>(defaultProps);
export const Keep3rContextApp = ({children}: {children: ReactElement}): ReactElement => {
	const	{provider, isActive, isDisconnected, address, chainID} = useWeb3();
	const	[jobs, set_jobs] = useState<TKeep3rTypes.TJobData[]>(defaultProps.jobs);
	const	[hasLoadedJobs, set_hasLoadedJobs] = useState(false);
	const	[keeperStatus, set_keeperStatus] = useState<TKeep3rTypes.TKeeperStatus>(defaultProps.keeperStatus);
	const	[, set_nonce] = useState(0);

	const	chainRegistry = useMemo((): TRegistry => {
		const	_registry: TRegistry = {};
		for (const r of Object.values(REGISTRY)) {
			if (r.chainID === chainID) {
				_registry[r.address] = r;
			}
		}
		return _registry;
	}, [chainID]);

	/* 📰 - Keep3r *************************************************************
	**	On disconnect, status
	***************************************************************************/
	useEffect((): void => {
		if (isDisconnected) {
			set_keeperStatus(defaultProps.keeperStatus);
			set_hasLoadedJobs(false);
		}
	}, [isDisconnected]);


	/* 📰 - Keep3r *************************************************************
	**	Find all the jobs currently set on the Keep3r SmartContract. First, we
	**	need to fetch the list of jobs, then we need to find, for each one,
	**	the associated credits.
	***************************************************************************/
	const saveJobs = useCallback(async (jobData: TKeep3rTypes.TJobData[], forChainID: number): Promise<void> => {
		if (forChainID !== chainID) {
			return;
		}
		performBatchedUpdates((): void => {
			set_jobs(jobData);
			set_hasLoadedJobs(true);
			set_nonce((n: number): number => n + 1);
		});
	}, [chainID]);

	const getJobs = useCallback(async (): Promise<void> => {
		set_hasLoadedJobs(false);
		const	jobData = [] as TKeep3rTypes.TJobData[];
		const	currentProvider = provider || providers.getProvider(chainID);
		const	ethcallProvider = await providers.newEthCallProvider(currentProvider);
		const	keep3rV2 = new Contract(
			getEnv(chainID).KEEP3R_V2_ADDR,
			KEEP3RV2_ABI
		);
		const	resultsJobsCall = await ethcallProvider.tryAll([keep3rV2.jobs()]) as never[];
		const	calls = [];
		if (resultsJobsCall[0]) {
			for (const job of resultsJobsCall[0] as string[]) {
				calls.push(keep3rV2.totalJobCredits(job));
			}
		}

		const	results = await ethcallProvider.tryAll(calls) as never[];
		for (let i = 0; i < results.length; i++) {
			jobData[i] = {
				name: chainRegistry[toAddress(resultsJobsCall[0][i])]?.name || '',
				address: toAddress(resultsJobsCall[0][i]),
				totalCredits: format.BN(results[i]),
				totalCreditsNormalized: Number(format.units(results[i], 18))
			};
		}

		saveJobs(jobData, currentProvider?.network?.chainId || chainID);
	}, [provider, chainID, chainRegistry, saveJobs]);

	useEffect((): void => {
		getJobs();
	}, [getJobs]);

	/* 📰 - Keep3r *************************************************************
	**	Once the wallet is connected and a provider is available, we can fetch
	**	the informations for a specific keeper. We are getting a lot of info
	**	there that can be used accross the app.
	***************************************************************************/
	const getKeeperStatus = useCallback(async (): Promise<void> => {
		if (!provider || !isActive) {
			return;
		}
		const	KEEP3R_V1_ADDR = toAddress(getEnv(chainID).KEEP3R_V1_ADDR);
		const	KEEP3R_V2_ADDR = toAddress(getEnv(chainID).KEEP3R_V2_ADDR);
		const	KP3R_TOKEN_ADDR = toAddress(getEnv(chainID).KP3R_TOKEN_ADDR);

		const	{timestamp} = await provider.getBlock('latest');
		const	ethcallProvider = await providers.newEthCallProvider(provider);
		const	keep3rV1 = new Contract(KEEP3R_V1_ADDR, KEEP3RV1_ABI);
		const	keep3rV2 = new Contract(KEEP3R_V2_ADDR, KEEP3RV2_ABI);

		const	calls = [
			keep3rV1.balanceOf(address),
			keep3rV1.allowance(address, KEEP3R_V2_ADDR),
			keep3rV2.bonds(address, KP3R_TOKEN_ADDR),
			keep3rV2.pendingBonds(address, KP3R_TOKEN_ADDR),
			keep3rV2.pendingUnbonds(address, KP3R_TOKEN_ADDR),
			keep3rV2.canActivateAfter(address, KP3R_TOKEN_ADDR),
			keep3rV2.canWithdrawAfter(address, KP3R_TOKEN_ADDR),
			keep3rV2.disputes(address),
			keep3rV2.disputers(address),
			keep3rV2.slashers(address),
			keep3rV2.governance(),
			keep3rV2.hasBonded(address),
			keep3rV2.bondTime(),
			keep3rV2.unbondTime()
		];
		const	results = await ethcallProvider.tryAll(calls) as never[];
		performBatchedUpdates((): void => {
			const	[
				kp3rBalance, kp3rAllowance, bonds,
				pendingBonds, pendingUnbonds, canActivateAfter,
				canWithdrawAfter, disputes, disputers, slashers, governance,
				hasBonded, bondTime, unbondTime
			] = results;

			set_keeperStatus({
				balanceOf: format.BN(kp3rBalance),
				allowance: format.BN(kp3rAllowance),
				bonds: format.BN(bonds),
				pendingBonds: format.BN(pendingBonds),
				pendingUnbonds: format.BN(pendingUnbonds),
				canActivateAfter: canActivateAfter,
				canWithdrawAfter: canWithdrawAfter,
				isDisputer: disputers,
				isSlasher: slashers,
				isGovernance: governance === address,
				hasDispute: disputes,
				hasBonded: hasBonded,
				bondTime: bondTime,
				unbondTime: unbondTime,
				hasPendingActivation: !format.BN(canActivateAfter).isZero(),
				canActivate: !format.BN(canActivateAfter).isZero() && ((timestamp * 1000) - (Number(bondTime) + Number(canActivateAfter) * 1000)) > 0,
				canActivateIn: format.duration((Number(bondTime) + Number(canActivateAfter) * 1000) - (timestamp * 1000), true),
				canWithdraw: ((timestamp * 1000) - (Number(unbondTime) + Number(canWithdrawAfter) * 1000)) > 0,
				canWithdrawIn: format.duration((Number(unbondTime) + Number(canWithdrawAfter) * 1000) - (timestamp * 1000), true)
			});
			set_nonce((n: number): number => n + 1);
		});
	}, [address, provider, isActive, chainID]);
	useEffect((): void => {
		getKeeperStatus();
	}, [getKeeperStatus]);

	/* 📰 - Keep3r *************************************************************
	**	Setup and render the Context provider to use in the app.
	***************************************************************************/
	return (
		<Keep3rContext.Provider
			value={{
				jobs,
				keeperStatus,
				getJobs,
				getKeeperStatus,
				hasLoadedJobs
			}}>
			{children}
		</Keep3rContext.Provider>
	);
};


export const useKeep3r = (): TKeep3rTypes.TKeep3rContext => useContext(Keep3rContext);
export default useKeep3r;
