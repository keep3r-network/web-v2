import React, {useEffect, useState} from 'react';
import Input from 'components/Input';
import {useJob} from 'contexts/useJob';
import {useKeep3r} from 'contexts/useKeep3r';
import KEEP3RV2_ABI from 'utils/abi/keep3rv2.abi';
import {addTokenCreditsToJob} from 'utils/actions/addTokenCreditsToJob';
import {approveERC20} from 'utils/actions/approveToken';
import {withdrawTokenCreditsFromJob} from 'utils/actions/withdrawTokenCreditsFromJob';
import {getEnv} from 'utils/env';
import {erc20ABI, readContracts} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {isZeroAddress, toAddress} from '@yearn-finance/web-lib/utils/address';
import {decodeAsBigInt, decodeAsNumber, decodeAsString} from '@yearn-finance/web-lib/utils/decoder';
import {toSafeAmount} from '@yearn-finance/web-lib/utils/format';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {performBatchedUpdates} from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {defaultTxStatus, Transaction} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {ReactElement} from 'react';
import type {TAddress} from '@yearn-finance/web-lib/types';

function	SectionAddToken({chainID}: {chainID: number}): ReactElement {
	const {provider, isActive, address} = useWeb3();
	const {getJobs, getKeeperStatus} = useKeep3r();
	const {jobStatus, getJobStatus} = useJob();
	const [txStatusApprove, set_txStatusApprove] = useState(defaultTxStatus);
	const [txStatusAddCredits, set_txStatusAddCredits] = useState(defaultTxStatus);
	const [tokenToAdd, set_tokenToAdd] = useState('');
	const [amountTokenToAdd, set_amountTokenToAdd] = useState('');
	const [tokenToAddData, set_tokenToAddData] = useState({
		balanceOf: 0n,
		allowance: 0n,
		decimals: 18,
		symbol: ''
	});

	async function	getTokenToAdd(_tokenToAdd: string): Promise<void> {
		const results = await readContracts({
			contracts: [
				{address: toAddress(_tokenToAdd), abi: erc20ABI, functionName: 'balanceOf', args: [toAddress(address)]},
				{address: toAddress(_tokenToAdd), abi: erc20ABI, functionName: 'allowance', args: [toAddress(address), getEnv(chainID).KEEP3R_V2_ADDR]},
				{address: toAddress(_tokenToAdd), abi: erc20ABI, functionName: 'decimals'},
				{address: toAddress(_tokenToAdd), abi: erc20ABI, functionName: 'symbol'}
			]
		});
		performBatchedUpdates((): void => {
			set_tokenToAddData({
				balanceOf: decodeAsBigInt(results[0]),
				allowance: decodeAsBigInt(results[1]),
				decimals: decodeAsNumber(results[2]),
				symbol: decodeAsString(results[3])
			});
		});
	}

	useEffect((): void => {
		if (provider) {
			if (!isZeroAddress(tokenToAdd)) {
				getTokenToAdd(tokenToAdd);
			} else {
				performBatchedUpdates((): void => {
					set_amountTokenToAdd('');
					set_tokenToAddData({
						balanceOf: 0n,
						allowance: 0n,
						decimals: 18,
						symbol: ''
					});
				});
			}
		}
	}, [tokenToAdd, provider, chainID]);

	async function	onApprove(): Promise<void> {
		if (!isActive || txStatusApprove.pending) {
			return;
		}
		new Transaction(provider, approveERC20, set_txStatusApprove)
			.populate(
				tokenToAdd,
				getEnv(chainID).KEEP3R_V2_ADDR,
				toSafeAmount(amountTokenToAdd, tokenToAddData?.balanceOf || 0n, tokenToAddData?.decimals || 18)
			).onSuccess(async (): Promise<void> => {
				await getTokenToAdd(tokenToAdd);
			}).perform();
	}

	async function	onAddTokenCreditsToJob(): Promise<void> {
		if (!isActive || txStatusAddCredits.pending) {
			return;
		}
		new Transaction(provider, addTokenCreditsToJob, set_txStatusAddCredits)
			.populate(
				chainID,
				jobStatus.address,
				tokenToAdd,
				toSafeAmount(amountTokenToAdd, tokenToAddData?.balanceOf || 0n, tokenToAddData?.decimals || 18)
			).onSuccess(async (): Promise<void> => {
				await Promise.all([getJobs(), getJobStatus(), getKeeperStatus(), getTokenToAdd(tokenToAdd)]);
				set_amountTokenToAdd('');
			}).perform();
		
	}

	function	addButton(): ReactElement {
		const allowance = toNormalizedBN(tokenToAddData?.allowance || 0, tokenToAddData?.decimals || 18).normalized;
		if (Number(allowance) < Number(amountTokenToAdd)) {
			return (
				<Button
					onClick={onApprove}
					isBusy={txStatusApprove.pending}
					isDisabled={
						!isActive
						|| isZeroAddress(tokenToAdd)
						|| amountTokenToAdd === '' || Number(amountTokenToAdd) === 0 
						|| Number(amountTokenToAdd) > Number(toNormalizedBN(tokenToAddData?.balanceOf || 0n, tokenToAddData?.decimals || 18).normalized)
					}>
					{txStatusApprove.error ? 'Transaction failed' : txStatusApprove.success ? 'Transaction successful' : 'Approve'}
				</Button>
			);
		}
	
		return (
			<Button
				onClick={onAddTokenCreditsToJob}
				isBusy={txStatusAddCredits.pending}
				isDisabled={
					!isActive
					|| toBigInt(tokenToAddData.balanceOf) === 0n
					|| Number(amountTokenToAdd) === 0
					|| !Number(amountTokenToAdd)
				}>
				{txStatusAddCredits.error ? 'Transaction failed' : txStatusAddCredits.success ? 'Transaction successful' : 'Add'}
			</Button>
		);
	}

	return (
		<section aria-label={'Add tokens directly'}>
			<b className={'text-lg'}>{'Add tokens directly'}</b>
			<div aria-label={'Add tokens directly'} className={'mb-10 mt-4 space-y-6'}>
				<div>
					<div className={'my-4 grid grid-cols-1 gap-4 md:grid-cols-2'}>
						<label
							className={'space-y-2'}
							aria-invalid={tokenToAdd !== '' && isZeroAddress(tokenToAdd)}>
							<Input
								value={tokenToAdd}
								onChange={(s: unknown): void => set_tokenToAdd(s as string)}
								onSearch={(s: unknown): void => set_tokenToAdd(s as string)}
								aria-label={'token'}
								placeholder={'0x...'} />
						</label>

						<Input.Bigint
							label={''}
							value={amountTokenToAdd}
							onSetValue={(s: string): void => set_amountTokenToAdd(s)}
							maxValue={tokenToAddData?.balanceOf || 0n}
							decimals={tokenToAddData?.decimals || 18} />
					</div>
					<div>
						{addButton()}
					</div>
				</div>
			</div>
		</section>
	);
}

function	SectionActionsManageLiquidity({chainID}: {chainID: number}): ReactElement {
	const {provider, isActive, address} = useWeb3();
	const {getJobs, getKeeperStatus} = useKeep3r();
	const {jobStatus, getJobStatus} = useJob();
	const [txStatusWithdrawCredits, set_txStatusWithdrawCredits] = useState(defaultTxStatus);
	const [tokenToWithdraw, set_tokenToWithdraw] = useState('');
	const [amountTokenToWithdraw, set_amountTokenToWithdraw] = useState('');
	const [receiver, set_receiver] = useState('');
	const [tokenToWithdrawData, set_tokenToWithdrawData] = useState({
		balanceOf: 0n,
		decimals: 18,
		symbol: ''
	});

	useEffect((): void => {
		set_receiver(address || '');
	}, [address]);

	async function	getTokenToWithdraw(_tokenToWithdraw: TAddress): Promise<void> {
		const results = await readContracts({
			contracts: [
				{address: getEnv(chainID).KEEP3R_V2_ADDR, abi: KEEP3RV2_ABI, functionName: 'jobTokenCredits', args: [jobStatus.address, _tokenToWithdraw]},
				{address: _tokenToWithdraw, abi: erc20ABI, functionName: 'balanceOf', args: [toAddress(address)]},
				{address: _tokenToWithdraw, abi: erc20ABI, functionName: 'decimals'}
			]
		});
		performBatchedUpdates((): void => {
			set_tokenToWithdrawData({
				balanceOf: decodeAsBigInt(results[0]),
				decimals: decodeAsNumber(results[1]),
				symbol: decodeAsString(results[2])
			});
		});
	}

	useEffect((): void => {
		if (provider) {
			if (!isZeroAddress(tokenToWithdraw)) {
				getTokenToWithdraw(toAddress(tokenToWithdraw));
			} else {
				performBatchedUpdates((): void => {
					set_amountTokenToWithdraw('');
					set_tokenToWithdrawData({
						balanceOf: 0n,
						decimals: 18,
						symbol: ''
					});
				});
			}
		}
	}, [tokenToWithdraw, provider, chainID]);

	async function	onWithdrawTokenCreditsFromJob(): Promise<void> {
		if (!isActive || txStatusWithdrawCredits.pending) {
			return;
		}
		new Transaction(provider, withdrawTokenCreditsFromJob, set_txStatusWithdrawCredits)
			.populate(
				chainID,
				jobStatus.address,
				tokenToWithdraw,
				toSafeAmount(amountTokenToWithdraw, tokenToWithdrawData?.balanceOf || 0, tokenToWithdrawData?.decimals || 18),
				receiver
			).onSuccess(async (): Promise<void> => {
				await Promise.all([getJobs(), getJobStatus(), getKeeperStatus(), getTokenToWithdraw(tokenToWithdraw)]);
				set_amountTokenToWithdraw('');
			}).perform();
		
	}

	function	withdrawButton(): ReactElement {
		return (
			<Button
				onClick={onWithdrawTokenCreditsFromJob}
				isBusy={txStatusWithdrawCredits.pending}
				isDisabled={
					!isActive
					|| tokenToWithdrawData.balanceOf.eq(0)
					|| Number(amountTokenToWithdraw) === 0
					|| !Number(amountTokenToWithdraw)
				}>
				{txStatusWithdrawCredits.error ? 'Transaction failed' : txStatusWithdrawCredits.success ? 'Transaction successful' : 'Withdraw'}
			</Button>
		);
	}

	return (
		<section aria-label={'Withdraw tokens directly'}>
			<b className={'text-lg'}>{'Withdraw tokens'}</b>
			<div aria-label={'Withdraw tokens'} className={'mt-4 space-y-6'}>
				<div>
					<div className={'my-4 grid grid-cols-1 gap-4 md:grid-cols-2'}>
						<label
							className={'space-y-2'}
							aria-invalid={tokenToWithdraw !== '' && isZeroAddress(tokenToWithdraw)}>
							<Input
								value={tokenToWithdraw}
								onChange={(s: unknown): void => set_tokenToWithdraw(s as string)}
								onSearch={(s: unknown): void => set_tokenToWithdraw(s as string)}
								aria-label={'token'}
								placeholder={'0x...'} />
						</label>
						<Input.Bigint
							label={''}
							value={amountTokenToWithdraw}
							onSetValue={(s: string): void => set_amountTokenToWithdraw(s)}
							maxValue={tokenToWithdrawData?.balanceOf || 0n}
							decimals={tokenToWithdrawData?.decimals || 18} />
					</div>

					<label
						className={'space-y-2'}
						aria-invalid={receiver !== '' && isZeroAddress(receiver)}>
						<p className={'text-black-1'}>{'Receiver'}</p>
						<Input
							value={receiver}
							onChange={(s: unknown): void => set_receiver(s as string)}
							onSearch={(s: unknown): void => set_receiver(s as string)}
							aria-label={'receiver'}
							placeholder={'0x...'} />
					</label>

					<div className={'mt-6'}>
						{withdrawButton()}
					</div>

				</div>
			</div>
		</section>
	);
}

function	PanelManageLiquidity({chainID}: {chainID: number}): ReactElement {
	return (
		<div className={'flex flex-col p-6'}>
			<SectionAddToken chainID={chainID} />
			<SectionActionsManageLiquidity chainID={chainID} />
		</div>
	);
}


export default PanelManageLiquidity;
