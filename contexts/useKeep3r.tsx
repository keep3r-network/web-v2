import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import KEEP3RV1_ABI from 'utils/abi/keep3rv1.abi';
import KEEP3RV2_ABI from 'utils/abi/keep3rv2.abi';
import {getEnv} from 'utils/env';
import REGISTRY from 'utils/registry';
import {readContract, readContracts} from '@wagmi/core';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {decodeAsAddress,decodeAsBigInt, decodeAsBoolean} from '@yearn-finance/web-lib/utils/decoder';
import {toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatDuration} from '@yearn-finance/web-lib/utils/format.time';
import {performBatchedUpdates} from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {getClient} from '@yearn-finance/web-lib/utils/wagmi/utils';

import type {ReactElement} from 'react';
import type {TRegistry} from 'utils/registry';
import type {TJobData, TKeep3rContext, TKeeperStatus} from './types';

const defaultProps = {
	jobs: [],
	keeperStatus: {
		wEthBalanceOf: toNormalizedBN(0n),
		wEthAllowance: toNormalizedBN(0n),
		balanceOf: toNormalizedBN(0n),
		allowance: toNormalizedBN(0n),
		bonds: toNormalizedBN(0n),
		pendingBonds: toNormalizedBN(0n),
		pendingUnbonds: toNormalizedBN(0n),
		canActivateAfter: 0n,
		canWithdrawAfter: 0n,
		hasBonded: false,
		hasDispute: false,
		isDisputer: false,
		isSlasher: false,
		isGovernance: false,
		bondTime: 259_200n,
		unbondTime: 1_209_600n,
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
const Keep3rContext = createContext<TKeep3rContext>(defaultProps);
export const Keep3rContextApp = ({children}: {children: ReactElement}): ReactElement => {
	const {provider, isActive, isDisconnected, address} = useWeb3();
	const {chainID} = useChainID();
	const [jobs, set_jobs] = useState<{[key: number]: TJobData[]}>(defaultProps.jobs);
	const [hasLoadedJobs, set_hasLoadedJobs] = useState(false);
	const [keeperStatus, set_keeperStatus] = useState<{[key: number]: TKeeperStatus}>({});
	const [, set_nonce] = useState(0);

	const chainRegistry = useMemo((): TRegistry => {
		const _registry: TRegistry = {};
		for (const r of Object.values(REGISTRY[chainID] || {})) {
			_registry[r.address] = r;
		}
		return _registry;
	}, [chainID]);

	/* 📰 - Keep3r *************************************************************
	**	On disconnect, status
	***************************************************************************/
	useEffect((): void => {
		if (isDisconnected) {
			set_keeperStatus({});
			set_hasLoadedJobs(false);
		}
	}, [isDisconnected]);


	/* 📰 - Keep3r *************************************************************
	**	Find all the jobs currently set on the Keep3r SmartContract. First, we
	**	need to fetch the list of jobs, then we need to find, for each one,
	**	the associated credits.
	***************************************************************************/
	const getJobs = useCallback(async (): Promise<void> => {
		set_hasLoadedJobs(false);
		const jobData = [] as TJobData[];
		const jobs = await readContract({
			abi: KEEP3RV2_ABI,
			address: getEnv(chainID).KEEP3R_V2_ADDR,
			functionName: 'jobs'
		});

		if (jobs[0]) {
			const results = await readContracts({
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				contracts: jobs.map((job: string): any => ({
					abi: KEEP3RV2_ABI,
					address: getEnv(chainID).KEEP3R_V2_ADDR,
					functionName: 'totalJobCredits',
					args: [job]
				}))
			});
			for (let i = 0; i < results.length; i++) {
				const jobAddress = jobs[i];
				const jobCredits = decodeAsBigInt(results[i]);
				jobData[i] = {
					name: chainRegistry[jobAddress]?.name || '',
					address: jobAddress,
					totalCredits: toNormalizedBN(jobCredits)
				};
			}

			performBatchedUpdates((): void => {
				set_jobs((prev): {[key: number]: TJobData[]} => ({
					...prev,
					[chainID]: jobData
				}));
				set_hasLoadedJobs(true);
				set_nonce((n: number): number => n + 1);
			});
		} else {
			set_hasLoadedJobs(true);
		}
	}, [chainID, chainRegistry]);

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
		const KEEP3R_V1_ADDR = toAddress(getEnv(chainID).KEEP3R_V1_ADDR);
		const KEEP3R_V2_ADDR = toAddress(getEnv(chainID).KEEP3R_V2_ADDR);
		const KP3R_TOKEN_ADDR = toAddress(getEnv(chainID).KP3R_TOKEN_ADDR);
		const keep3rv1Args = {address: KEEP3R_V1_ADDR, abi: KEEP3RV1_ABI} as const;
		const keep3rv2Args = {address: KEEP3R_V2_ADDR, abi: KEEP3RV2_ABI} as const;


		const publicClient = getClient(chainID);
		const {timestamp} = await publicClient.getBlock();
		const results = await readContracts({
			contracts: [
				{...keep3rv1Args, functionName: 'balanceOf', args: [toAddress(address)]},
				{...keep3rv1Args, functionName: 'allowance', args: [toAddress(address), KEEP3R_V2_ADDR]},
				{...keep3rv2Args, functionName: 'bonds', args: [toAddress(address), KP3R_TOKEN_ADDR]},
				{...keep3rv2Args, functionName: 'pendingBonds', args: [toAddress(address), KP3R_TOKEN_ADDR]},
				{...keep3rv2Args, functionName: 'pendingUnbonds', args: [toAddress(address), KP3R_TOKEN_ADDR]},
				{...keep3rv2Args, functionName: 'canActivateAfter', args: [toAddress(address), KP3R_TOKEN_ADDR]},
				{...keep3rv2Args, functionName: 'canWithdrawAfter', args: [toAddress(address), KP3R_TOKEN_ADDR]},
				{...keep3rv2Args, functionName: 'disputes', args: [toAddress(address)]},
				{...keep3rv2Args, functionName: 'disputers', args: [toAddress(address)]},
				{...keep3rv2Args, functionName: 'slashers', args: [toAddress(address)]},
				{...keep3rv2Args, functionName: 'governance'},
				{...keep3rv2Args, functionName: 'hasBonded', args: [toAddress(address)]},
				{...keep3rv2Args, functionName: 'bondTime'},
				{...keep3rv2Args, functionName: 'unbondTime'}
			]
		});

		const kp3rBalance = decodeAsBigInt(results[0]);
		const kp3rAllowance = decodeAsBigInt(results[1]);
		const bonds = decodeAsBigInt(results[2]);
		const pendingBonds = decodeAsBigInt(results[3]);
		const pendingUnbonds = decodeAsBigInt(results[4]);
		const canActivateAfter = decodeAsBigInt(results[5]);
		const canWithdrawAfter = decodeAsBigInt(results[6]);
		const hasDispute = decodeAsBoolean(results[7]);
		const isDisputer = decodeAsBoolean(results[8]);
		const isSlasher = decodeAsBoolean(results[9]);
		const governance = decodeAsAddress(results[10]);
		const hasBonded = decodeAsBoolean(results[11]);
		const bondTime = decodeAsBigInt(results[12]);
		const unbondTime = decodeAsBigInt(results[13]);

		performBatchedUpdates((): void => {
			const updatedStatus = {
				balanceOf: toNormalizedBN(kp3rBalance),
				allowance: toNormalizedBN(kp3rAllowance),
				bonds: toNormalizedBN(bonds),
				pendingBonds: toNormalizedBN(pendingBonds),
				pendingUnbonds: toNormalizedBN(pendingUnbonds),
				canActivateAfter: canActivateAfter,
				canWithdrawAfter: canWithdrawAfter,
				isDisputer: isDisputer,
				isSlasher: isSlasher,
				isGovernance: governance === address,
				hasDispute: hasDispute,
				hasBonded: hasBonded,
				bondTime: bondTime,
				unbondTime: unbondTime,
				hasPendingActivation: canActivateAfter > 0n,
				canActivate: canActivateAfter > 0n && ((Number(timestamp) * 1000) - (Number(bondTime) + Number(canActivateAfter) * 1000)) > 0,
				canActivateIn: formatDuration((Number(bondTime) + Number(canActivateAfter) * 1000) - (Number(timestamp) * 1000), true),
				canWithdraw: ((Number(timestamp) * 1000) - (Number(unbondTime) + Number(canWithdrawAfter) * 1000)) > 0,
				canWithdrawIn: formatDuration((Number(unbondTime) + Number(canWithdrawAfter) * 1000) - (Number(timestamp) * 1000), true)
			};

			set_keeperStatus((prev): {[key: number]: TKeeperStatus} => ({
				...prev,
				[chainID]: updatedStatus
			}));
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
				jobs: jobs[chainID] || [],
				keeperStatus: keeperStatus[chainID] || defaultProps.keeperStatus,
				getJobs,
				getKeeperStatus,
				hasLoadedJobs
			}}>
			{children}
		</Keep3rContext.Provider>
	);
};


export const useKeep3r = (): TKeep3rContext => useContext(Keep3rContext);
export default useKeep3r;
