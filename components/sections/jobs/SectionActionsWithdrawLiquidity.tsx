import React, {useEffect, useState} from 'react';
import Input from 'components/Input';
import Line from 'components/Line';
import TokenPairDropdown from 'components/TokenPairDropdown';
import {useJob} from 'contexts/useJob';
import {usePairs} from 'contexts/usePairs';
import {ethers} from 'ethers';
import {burn, simulateBurn} from 'utils/actions/burn';
import {unbondLiquidityFromJob} from 'utils/actions/unbondLiquidityFromJob';
import {withdrawLiquidityFromJob} from 'utils/actions/withdrawLiquidityFromJob';
import {getBridgeURI, getEnv} from 'utils/env';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {toSafeAmount} from '@yearn-finance/web-lib/utils/format';
import {formatToNormalizedAmount, formatUnits} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {defaultTxStatus, Transaction} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {BigNumber} from 'ethers';
import type {ReactElement} from 'react';

function	PanelUnbondTokens({chainID}: {chainID: number}): ReactElement {
	const	{provider, address, isActive} = useWeb3();
	const	{pairs, getPairs} = usePairs();
	const	{jobStatus, getJobStatus} = useJob();
	const	[amountLpToken, set_amountLpToken] = useState('');
	const	[pair, set_pair] = useState(pairs[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]);
	const	[txStatusUnbond, set_txStatusUnbond] = useState(defaultTxStatus);

	useEffect((): void => {
		set_pair(pairs[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]);
	}, [pairs, chainID]);

	async function	onUnbondLiquidityFromJob(pairAddress: string, amount: BigNumber): Promise<void> {
		if (!isActive || txStatusUnbond.pending) {
			return;
		}
		new Transaction(provider, unbondLiquidityFromJob, set_txStatusUnbond)
			.populate(chainID, jobStatus.address, pairAddress, amount)
			.onSuccess(async (): Promise<void> => {
				await Promise.all([getJobStatus(), getPairs()]);
			})
			.perform();
	}

	function	renderUnbondButton(): ReactElement {
		const	isAmountOverflow = (amountLpToken !== '' && (!Number(amountLpToken) || Number(amountLpToken) > Number(formatUnits(jobStatus?.liquidityAmount || 0, 18))));

		return (
			<Button
				onClick={(): void => {
					onUnbondLiquidityFromJob(
						pair.addressOfPair,
						toSafeAmount(amountLpToken, jobStatus?.liquidityAmount)
					);
				}}
				isBusy={txStatusUnbond.pending}
				isDisabled={
					!isActive
					|| isAmountOverflow
					|| ethers.utils.parseUnits(amountLpToken || '0', 18).isZero()
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
						<Input.BigNumber
							label={''}
							value={amountLpToken}
							onSetValue={(s: string): void => set_amountLpToken(s)}
							maxValue={jobStatus.jobOwner === address ? jobStatus?.liquidityAmount || ethers.constants.Zero : ethers.constants.Zero}
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
											{formatToNormalizedAmount(jobStatus?.pendingUnbonds || 0, 18)}
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
	const	{provider, isActive} = useWeb3();
	const	{pairs, getPairs} = usePairs();
	const	{jobStatus, getJobStatus} = useJob();
	const	{safeChainID} = useChainID();
	const	[amountLpToken, set_amountLpToken] = useState('');
	const	[expectedUnderlyingAmount, set_expectedUnderlyingAmount] = useState({
		token1: ethers.constants.Zero,
		token2: ethers.constants.Zero
	});
	const	[pair, set_pair] = useState(pairs[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]);
	const	[txStatus, set_txStatus] = useState(defaultTxStatus);
	const	[txStatusBurn, set_txStatusBurn] = useState(defaultTxStatus);

	useEffect((): void => {
		set_pair(pairs[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]);
	}, [pairs, chainID]);

	useEffect((): void => {
		if (provider) {
			simulateBurn(
				provider as ethers.providers.Web3Provider,
				chainID,
				pair.addressOfPair,
				toSafeAmount(amountLpToken, pair.balanceOfPair)
			).then((result): void => {
				set_expectedUnderlyingAmount({
					token1: result[0],
					token2: result[1]
				});
			});
		}
	}, [pair.addressOfPair, pair.balanceOfPair, provider, amountLpToken, chainID]);

	async function	onWithdrawLiquidityFromJob(pairAddress: string): Promise<void> {
		if (!isActive || txStatus.pending) {
			return;
		}
		new Transaction(provider, withdrawLiquidityFromJob, set_txStatus)
			.populate(chainID, jobStatus.address, pairAddress)
			.onSuccess(async (): Promise<void> => {
				await Promise.all([getJobStatus(), getPairs()]);
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
					|| jobStatus.pendingUnbonds.isZero()
				}>
				{txStatus.error ? 'Transaction failed' : txStatus.success ? 'Transaction successful' : jobStatus.canWithdraw ? 'Withdraw' : `Withdraw (${jobStatus.canWithdrawIn})`}
			</Button>
		);
	}

	async function	onBurn(pairAddress: string, amount: BigNumber): Promise<void> {
		if (!isActive || txStatusBurn.pending) {
			return;
		}
		new Transaction(provider, burn, set_txStatusBurn)
			.populate(pairAddress, amount)
			.onSuccess(async (): Promise<void> => {
				await Promise.all([getJobStatus(), getPairs()]);
				set_amountLpToken('');
			})
			.perform();
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
					onBurn(pair.addressOfPair, toSafeAmount(amountLpToken, pair.balanceOfPair));
				}}
				isBusy={txStatusBurn.pending}
				isDisabled={
					!isActive
					|| ethers.utils.parseUnits(amountLpToken || '0', 18).isZero()
					|| Number(amountLpToken) > Number(formatUnits(pair?.balanceOfPair || 0, 18))
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
						<Input.BigNumber
							label={''}
							value={amountLpToken}
							onSetValue={(s: string): void => set_amountLpToken(s)}
							maxValue={pair?.balanceOfPair || 0}
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
											{formatToNormalizedAmount(expectedUnderlyingAmount?.token1 || 0, 18)}
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
											{formatToNormalizedAmount(expectedUnderlyingAmount?.token2 || 0, 18)}
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
