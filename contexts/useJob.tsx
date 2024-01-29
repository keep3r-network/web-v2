import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import KEEP3RV2_ABI from 'utils/abi/keep3rv2.abi';
import {getEnv} from 'utils/env';
import REGISTRY from 'utils/registry';
import {zeroAddress} from 'viem';
import {readContracts} from 'wagmi';
import axios from 'axios';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {decodeAsBigInt, decodeAsBoolean, decodeAsString} from '@yearn-finance/web-lib/utils/decoder';
import {formatToNormalizedValue, toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatDate, formatDuration} from '@yearn-finance/web-lib/utils/format.time';
import {performBatchedUpdates} from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {getClient} from '@yearn-finance/web-lib/utils/wagmi/utils';

import type {ReactElement} from 'react';
import type {TRegistry} from 'utils/registry';
import type {TJobContext, TJobStatus} from './types';

const defaultProps = {
	jobStatus: {
		name: 'Unverified job',
		address: zeroAddress,
		pendingJobMigrations: zeroAddress,
		jobOwner: zeroAddress,
		jobLiquidityCredits: toNormalizedBN(0n),
		jobPeriodCredits: toNormalizedBN(0n),
		jobTokenCredits: toNormalizedBN(0n),
		liquidityAmount: toNormalizedBN(0n),
		totalJobCredits: toNormalizedBN(0n),
		pendingUnbonds: toNormalizedBN(0n),
		canWithdrawAfter: toNormalizedBN(0n),
		canWithdrawIn: '',
		canWithdraw: false,
		hasDispute: false,
		isVerified: false,
		isLoaded: false,
		//
		workDone: 0,
		lastWork: 'Never', //date
		totalFees: 0,
		averageWorkDonePerDay: 0,
		averageFees: 0,
		averageEarned: 0,
		uniqueKeepers: 0,
		workPerKeeper: 0,
		works: []
	},
	getJobStatus: async (): Promise<void> => undefined
};
const JobContext = createContext<TJobContext>(defaultProps);
export const JobContextApp = ({jobAddress, chainID, children}: {
	chainID: number;
	jobAddress: string,
	children: ReactElement
}): ReactElement => {
	const [jobStatus, set_jobStatus] = useState<TJobStatus>(defaultProps.jobStatus);
	const [, set_nonce] = useState(0);

	const chainRegistry = useMemo((): TRegistry => {
		const _registry: TRegistry = {};
		for (const r of Object.values(REGISTRY[chainID] || {})) {
			_registry[r.address] = r;
		}
		return _registry;
	}, [chainID]);

	/* 📰 - Keep3r *************************************************************
	**	If the user's navigate to a page inside the `pages/jobs` directory, we
	**	need to fetch a bunch of data related to this job.
	**	Data includes some on-chain related ones, but also some off-chain
	**	(stats) related ones, fetched from our backend
	***************************************************************************/
	const getJobStatus = useCallback(async (): Promise<void> => {
		if (!jobAddress) {
			return;
		}
		const publicClient = getClient(chainID);
		const {timestamp} = await publicClient.getBlock();
		const {KEEP3R_V2_ADDR} = getEnv(chainID);
		const {KLP_KP3R_WETH_ADDR} = getEnv(chainID);
		const baseArgs = {address: KEEP3R_V2_ADDR, abi: KEEP3RV2_ABI} as const;
		const results = await readContracts({
			contracts: [
				{...baseArgs, functionName: 'jobLiquidityCredits', args: [toAddress(jobAddress)]},
				{...baseArgs, functionName: 'jobOwner', args: [toAddress(jobAddress)]},
				{...baseArgs, functionName: 'jobPeriodCredits', args: [toAddress(jobAddress)]},
				{...baseArgs, functionName: 'jobTokenCredits', args: [toAddress(jobAddress), KLP_KP3R_WETH_ADDR]},
				{...baseArgs, functionName: 'liquidityAmount', args: [toAddress(jobAddress), KLP_KP3R_WETH_ADDR]},
				{...baseArgs, functionName: 'totalJobCredits', args: [toAddress(jobAddress)]},
				{...baseArgs, functionName: 'pendingUnbonds', args: [toAddress(jobAddress), KLP_KP3R_WETH_ADDR]},
				{...baseArgs, functionName: 'canWithdrawAfter', args: [toAddress(jobAddress), KLP_KP3R_WETH_ADDR]},
				{...baseArgs, functionName: 'unbondTime'},
				{...baseArgs, functionName: 'pendingJobMigrations', args: [toAddress(jobAddress)]},
				{...baseArgs, functionName: 'disputes', args: [toAddress(jobAddress)]}
			]
		});
		const works = await axios.get(`${getEnv(chainID).BACKEND_URI}/job/${jobAddress}`);
		const jobLiquidityCredits = decodeAsBigInt(results[0]);
		const jobOwner = toAddress(decodeAsString(results[1]));
		const jobPeriodCredits = decodeAsBigInt(results[2]);
		const jobTokenCredits = decodeAsBigInt(results[3]);
		const liquidityAmount = decodeAsBigInt(results[4]);
		const totalJobCredits = decodeAsBigInt(results[5]);
		const pendingUnbonds = decodeAsBigInt(results[6]);
		const canWithdrawAfter = decodeAsBigInt(results[7]);
		const unbondTime = decodeAsBigInt(results[8]);
		const pendingJobMigrations = toAddress(decodeAsString(results[9]));
		const hasDispute = decodeAsBoolean(results[10]);


		const allWorks = works.data || [];
		const lastWork = allWorks?.[0]?.time;
		const totalFees = formatToNormalizedValue((allWorks || [])
			.reduce((acc: bigint, work: {fees: string}): bigint => acc + toBigInt(work?.fees), 0n));
		const totalEarned = formatToNormalizedValue((allWorks || [])
			.reduce((acc: bigint, work: {earned: string}): bigint => acc + toBigInt(work?.earned), 0n));
		const uniqueKeepers = [...new Set((allWorks || []).map((e: {keeper: string}): string => e.keeper))];
		const perDay: {[v: string]: number} = {};
		for (const work of allWorks) {
			const date = new Date(work.time * 1000);
			const day = date.getDate();
			const month = date.getMonth();
			const year = date.getFullYear();
			const dayKey = `${year}-${month}-${day}`;
			if (!perDay[dayKey]) {
				perDay[dayKey] = 0;
			}
			perDay[dayKey] += 1;
		}
		const averageWorkPerDay = Object.values(perDay).reduce((acc: number, v: number): number => acc + v, 0) / Object.keys(perDay).length;

		performBatchedUpdates((): void => {
			set_jobStatus({
				name: chainRegistry[toAddress(jobAddress)]?.name || 'Unverified job',
				address: toAddress(jobAddress),
				pendingJobMigrations: toAddress(pendingJobMigrations),
				jobOwner: toAddress(jobOwner),
				jobLiquidityCredits: toNormalizedBN(jobLiquidityCredits),
				jobPeriodCredits: toNormalizedBN(jobPeriodCredits),
				jobTokenCredits: toNormalizedBN(jobTokenCredits),
				liquidityAmount: toNormalizedBN(liquidityAmount),
				totalJobCredits: toNormalizedBN(totalJobCredits),
				pendingUnbonds: toNormalizedBN(pendingUnbonds),
				canWithdrawAfter: toNormalizedBN(canWithdrawAfter),
				canWithdrawIn: formatDuration((Number(unbondTime) + Number(canWithdrawAfter) * 1000) - (Number(timestamp) * 1000), true),
				canWithdraw: ((Number(timestamp) * 1000) - (Number(unbondTime) + Number(canWithdrawAfter) * 1000)) > 0,
				hasDispute: hasDispute,
				isVerified: chainRegistry[toAddress(jobAddress)]?.name ? true : false,
				isLoaded: true,
				workDone: allWorks.length,
				averageWorkDonePerDay: averageWorkPerDay,
				lastWork: lastWork ? formatDate(Number(lastWork) * 1000, true) : 'Never', //date
				totalFees: totalFees,
				averageFees: totalFees / allWorks.length,
				averageEarned: totalEarned / allWorks.length,
				uniqueKeepers: uniqueKeepers.length,
				workPerKeeper: allWorks.length / uniqueKeepers.length,
				works: works.data
			});
			set_nonce((n: number): number => n + 1);
		});
	}, [jobAddress, chainID, chainRegistry]);

	useEffect((): void => {
		getJobStatus();
	}, [getJobStatus]);

	/* 📰 - Keep3r *************************************************************
	**	Setup and render the Context provider to use in the app.
	***************************************************************************/
	return (
		<JobContext.Provider value={{jobStatus, getJobStatus}}>
			{children}
		</JobContext.Provider>
	);
};


export const useJob = (): TJobContext => useContext(JobContext);
export default useJob;
