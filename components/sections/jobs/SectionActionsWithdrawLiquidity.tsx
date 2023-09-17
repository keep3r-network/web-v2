/* eslint-disable @typescript-eslint/consistent-type-assertions */
import React, {useEffect, useState} from 'react';
import Input from 'components/Input';
import Line from 'components/Line';
import TokenPairDropdown from 'components/TokenPairDropdown';
import {useJob} from 'contexts/useJob';
import {usePairs} from 'contexts/usePairs';
import UNI_V3_PAIR_ABI from 'utils/abi/univ3Pair.abi';
import {burn} from 'utils/actions';
import {unbondLiquidityFromJob} from 'utils/actions/unbondLiquidityFromJob';
import {withdrawLiquidityFromJob} from 'utils/actions/withdrawLiquidityFromJob';
import {getBridgeURI, getEnv} from 'utils/env';
import {isZero, max} from 'utils/helpers';
import {prepareWriteContract} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import {defaultTxStatus, Transaction} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {TUserPairsPosition} from 'contexts/types';
import type {ReactElement} from 'react';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

function	PanelUnbondTokens({chainID}: {chainID: number}): ReactElement {
	const {provider, address, isActive} = useWeb3();
	const {pairs, getPairs, getPairsBalance} = usePairs();
	const {jobStatus, getJobStatus} = useJob();
	const [amountLpToken, set_amountLpToken] = useState(toNormalizedBN(0));
	const [pair, set_pair] = useState(pairs[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]);
	const [txStatusUnbond, set_txStatusUnbond] = useState(defaultTxStatus);

	useEffect((): void => {
		set_pair(pairs[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]);
	}, [pairs, chainID]);

	async function	onUnbondLiquidityFromJob(pairAddress: string, amount: bigint): Promise<void> {
		if (!isActive || txStatusUnbond.pending) {
			return;
		}
		new Transaction(provider, unbondLiquidityFromJob, set_txStatusUnbond)
			.populate(chainID, jobStatus.address, pairAddress, amount)
			.onSuccess(async (): Promise<void> => {
				await Promise.all([getJobStatus(), getPairs(chainID), getPairsBalance(chainID, toAddress(address))]);
			})
			.perform();
	}

	function	renderUnbondButton(): ReactElement {
		const isAmountOverflow = (!Number(amountLpToken) || Number(amountLpToken) > Number(jobStatus?.liquidityAmount.normalized));

		return (
			<Button
				onClick={(): void => {
					onUnbondLiquidityFromJob(
						pair.addressOfPair,
						max(amountLpToken.raw, jobStatus?.liquidityAmount.raw)
					);
				}}
				isBusy={txStatusUnbond.pending}
				isDisabled={
					!isActive
					|| isAmountOverflow
					|| isZero(amountLpToken.raw)
					|| jobStatus.jobOwner !== address
				}>
				{txStatusUnbond.error ? 'Transaction failed' : txStatusUnbond.success ? 'Transaction successful' : 'Unbond'}
			</Button>
		);
	}

	return (
		<div aria-label={'Unbond'} className={'mb-10 flex flex-col'}>
			<b className={'text-lg'}>{'Unbond'}</b>
			<div className={'mt-8 space-y-6'}>
				<div>
					<div className={'mb-4 grid grid-cols-1 gap-4 md:grid-cols-2'}>
						<div className={'space-y-2'}>
							<TokenPairDropdown name={'kLP-KP3R/WETH'} />
						</div>
						<Input.Bigint
							label={''}
							value={String(amountLpToken.normalized)}
							onSetValue={(s: string): void => set_amountLpToken(toNormalizedBN(s))}
							maxValue={jobStatus.jobOwner === address ? toBigInt(jobStatus?.liquidityAmount.raw) : 0n}
							decimals={18} />
					</div>
					<div className={'mb-6 space-y-2'}>
						<b>
							{jobStatus.canWithdraw ? 'Pending unbond' : `Pending unbond (${jobStatus.canWithdrawIn})`}
						</b>
						<dl className={'w-full space-y-2'}>
							<div className={'relative flex w-full flex-row items-center justify-between overflow-hidden'}>
								<dt className={'whitespace-nowrap bg-white pr-2 text-black-1'}>{'kLP-KP3R/WETH'}</dt>
								<dd className={'w-full font-bold'}>
									<div className={'absolute bottom-1.5 w-full'}>
										<Line />
									</div>
									<div className={'flex justify-end'}>
										<p className={'z-10 bg-white pl-1 text-right text-black-1'}>
											{formatAmount(jobStatus?.pendingUnbonds.normalized, 2, 2)}
										</p>
									</div>
								</dd>
							</div>
						</dl>
					</div>
					<div>
						{renderUnbondButton()}
					</div>
				</div>
			</div>
		</div>
	);
}

function	SectionActionsWithdrawLiquidity({chainID}: {chainID: number}): ReactElement {
	const {address, provider, isActive} = useWeb3();
	const {pairs, getPairs, getPairsBalance, userPairsPosition} = usePairs();
	const {jobStatus, getJobStatus} = useJob();
	const {safeChainID} = useChainID();
	const [amountLpToken, set_amountLpToken] = useState<TNormalizedBN>(toNormalizedBN(0n));
	const [expectedUnderlyingAmount, set_expectedUnderlyingAmount] = useState({
		token1: toNormalizedBN(0n),
		token2: toNormalizedBN(0n)
	});
	const [pair, set_pair] = useState(pairs[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]);
	const [userPairPosition, set_userPairPosition] = useState({} as TUserPairsPosition);
	const [txStatus, set_txStatus] = useState(defaultTxStatus);
	const [txStatusBurn, set_txStatusBurn] = useState(defaultTxStatus);

	useEffect((): void => {
		set_pair(pairs[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]);
		set_userPairPosition(userPairsPosition?.[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)] || {});
	}, [pairs, chainID, userPairsPosition]);

	useEffect((): void => {
		if (provider) {
			prepareWriteContract({
				address: toAddress(pair.addressOfPair),
				abi: UNI_V3_PAIR_ABI,
				functionName: 'burn',
				args: [max(amountLpToken.raw, userPairPosition?.balanceOfPair.raw), 0n, 0n, toAddress(address)]
			}).then(({result}): void => {
				set_expectedUnderlyingAmount({
					token1: toNormalizedBN(result[0]),
					token2: toNormalizedBN(result[1])
				});
			});
		}
	}, [pair.addressOfPair, userPairPosition?.balanceOfPair, provider, amountLpToken, chainID]);

	async function	onWithdrawLiquidityFromJob(pairAddress: string): Promise<void> {
		if (!isActive || txStatus.pending) {
			return;
		}
		new Transaction(provider, withdrawLiquidityFromJob, set_txStatus)
			.populate(chainID, jobStatus.address, pairAddress)
			.onSuccess(async (): Promise<void> => {
				await Promise.all([getJobStatus(), getPairs(chainID), getPairsBalance(chainID, toAddress(address))]);
			})
			.perform();
	}

	function	renderWithdrawButton(): ReactElement {
		return (
			<Button
				onClick={(): void => {
					onWithdrawLiquidityFromJob(pair.addressOfPair);
				}}
				isBusy={txStatus.pending}
				isDisabled={
					!isActive
					|| !jobStatus.canWithdraw
					|| toBigInt(jobStatus.pendingUnbonds.raw) === 0n
				}>
				{txStatus.error ? 'Transaction failed' : txStatus.success ? 'Transaction successful' : jobStatus.canWithdraw ? 'Withdraw' : `Withdraw (${jobStatus.canWithdrawIn})`}
			</Button>
		);
	}

	async function	onBurn(pairAddress: string, amount: bigint): Promise<void> {
		if (!isActive || txStatusBurn.pending) {
			return;
		}

		const result = await burn({
			connector: provider,
			contractAddress: toAddress(pairAddress),
			amount: amount,
			statusHandler: set_txStatusBurn
		});
		if (result.isSuccessful) {
			await Promise.all([getJobStatus(), getPairs(chainID), getPairsBalance(chainID, toAddress(address))]);
			set_amountLpToken(toNormalizedBN(0n));
		}
	}

	function	renderBurnButton(): ReactElement {
		if (safeChainID !== 1) {
			return (
				<a
					href={getBridgeURI(safeChainID)}
					target={'_blank'}
					rel={'noreferrer'}>
					<Button>
						{'Bridge tokens'}
					</Button>
				</a>
			);
		}
		return (
			<Button
				onClick={(): void => {
					onBurn(pair.addressOfPair, max(amountLpToken.raw, userPairPosition?.balanceOfPair.raw));
				}}
				isBusy={txStatusBurn.pending}
				isDisabled={
					!isActive
					|| isZero(amountLpToken.raw)
					|| Number(amountLpToken) > Number(userPairPosition?.balanceOfPair.normalized)
				}>
				{txStatusBurn.error ? 'Transaction failed' : txStatusBurn.success ? 'Transaction successful' : 'Burn'}
			</Button>
		);
	}

	return (
		<div aria-label={'Withdraw'} className={'flex flex-col'}>
			<b className={'text-lg'}>
				{[1, 1337, 5].includes(safeChainID) ? 'Withdraw and Burn' : 'Withdraw'}
			</b>
			<div className={'mt-8 space-y-6'}>
				<div>
					<div className={'mb-4 grid grid-cols-1 gap-4 md:grid-cols-2'}>
						<div className={'space-y-2'}>
							<TokenPairDropdown name={'kLP-KP3R/WETH'} />
						</div>
						<Input.Bigint
							label={''}
							value={String(amountLpToken.normalized)}
							onSetValue={(s: string): void => set_amountLpToken(toNormalizedBN(s))}
							maxValue={toBigInt(userPairPosition?.balanceOfPair.raw)}
							decimals={18} />
					</div>
					<div className={`mb-6 space-y-2 ${[1, 1337, 5].includes(safeChainID) ? '' : 'hidden'}`}>
						<b>{'You will receive'}</b>
						<dl className={'w-full space-y-2'}>
							<div className={'relative flex w-full flex-row items-center justify-between overflow-hidden'}>
								<dt className={'whitespace-nowrap bg-white pr-2 text-black-1'}>{'KP3R'}</dt>
								<dd className={'w-full font-bold'}>
									<div className={'absolute bottom-1.5 w-full'}>
										<Line />
									</div>
									<div className={'flex justify-end'}>
										<p className={'z-10 bg-white pl-1 text-right text-black-1'}>
											{formatAmount(expectedUnderlyingAmount?.token1.normalized, 2, 2)}
										</p>
									</div>
								</dd>
							</div>

							<div className={'relative flex w-full flex-row items-center justify-between overflow-hidden'}>
								<dt className={'whitespace-nowrap bg-white pr-2 text-black-1'}>{'wETH'}</dt>
								<dd className={'w-full font-bold'}>
									<div className={'absolute bottom-1.5 w-full'}>
										<Line />
									</div>
									<div className={'flex justify-end'}>
										<p className={'z-10 bg-white pl-1 text-right text-black-1'}>
											{formatAmount(expectedUnderlyingAmount?.token2.normalized, 2, 2)}
										</p>
									</div>
								</dd>
							</div>
						</dl>
					</div>
					<div className={'grid grid-cols-2 gap-4'}>
						{renderWithdrawButton()}
						{renderBurnButton()}
					</div>
				</div>
			</div>
		</div>
	);
}

function	Wrapper({chainID}: {chainID: number}): ReactElement {
	return (
		<div className={'flex flex-col p-6'}>
			<section aria-label={'WITHDRAW LIQUIDITY'}>
				<PanelUnbondTokens chainID={chainID} />
				<SectionActionsWithdrawLiquidity chainID={chainID} />
			</section>
		</div>
	);
}

export default Wrapper;
