import React, {useEffect, useState} from 'react';
import Input from 'components/Input';
import {useJob} from 'contexts/useJob';
import {useKeep3r} from 'contexts/useKeep3r';
import KEEP3RV2_ABI from 'utils/abi/keep3rv2.abi';
import {addTokenCreditsToJob, approveERC20, withdrawTokenCreditsFromJob} from 'utils/actions';
import {getEnv} from 'utils/env';
import {max} from 'utils/helpers';
import {erc20ABI, readContracts} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {isZeroAddress, toAddress} from '@yearn-finance/web-lib/utils/address';
import {decodeAsBigInt, decodeAsNumber, decodeAsString} from '@yearn-finance/web-lib/utils/decoder';
import {parseUnits, toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {performBatchedUpdates} from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {ReactElement} from 'react';
import type {TAddress} from '@yearn-finance/web-lib/types';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

function SectionAddToken({chainID}: {chainID: number}): ReactElement {
	const {provider, isActive, address} = useWeb3();
	const {getJobs, getKeeperStatus} = useKeep3r();
	const {jobStatus, getJobStatus} = useJob();
	const [txStatusApprove, set_txStatusApprove] = useState(defaultTxStatus);
	const [txStatusAddCredits, set_txStatusAddCredits] = useState(defaultTxStatus);
	const [tokenToAdd, set_tokenToAdd] = useState('');
	const [amountTokenToAdd, set_amountTokenToAdd] = useState<TNormalizedBN>(toNormalizedBN(0));
	const [tokenToAddData, set_tokenToAddData] = useState({
		balanceOf: toNormalizedBN(0),
		allowance: toNormalizedBN(0),
		decimals: 18,
		symbol: ''
	});

	async function getTokenToAdd(_tokenToAdd: string): Promise<void> {
		const results = await readContracts({
			contracts: [
				{address: toAddress(_tokenToAdd), abi: erc20ABI, functionName: 'balanceOf', args: [toAddress(address)]},
				{address: toAddress(_tokenToAdd), abi: erc20ABI, functionName: 'allowance', args: [toAddress(address), getEnv(chainID).KEEP3R_V2_ADDR]},
				{address: toAddress(_tokenToAdd), abi: erc20ABI, functionName: 'decimals'},
				{address: toAddress(_tokenToAdd), abi: erc20ABI, functionName: 'symbol'}
			]
		});
		performBatchedUpdates((): void => {
			const decimals = decodeAsNumber(results[2]);
			set_tokenToAddData({
				balanceOf: toNormalizedBN(decodeAsBigInt(results[0]), decimals),
				allowance: toNormalizedBN(decodeAsBigInt(results[1]), decimals),
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
					set_amountTokenToAdd(toNormalizedBN(0));
					set_tokenToAddData({
						balanceOf: toNormalizedBN(0),
						allowance: toNormalizedBN(0),
						decimals: 18,
						symbol: ''
					});
				});
			}
		}
	}, [tokenToAdd, provider, chainID]);

	async function onApprove(): Promise<void> {
		if (!isActive || txStatusApprove.pending) {
			return;
		}
		const result = await approveERC20({
			connector: provider,
			contractAddress: toAddress(tokenToAdd),
			spenderAddress: getEnv(chainID).KEEP3R_V2_ADDR,
			amount: max(amountTokenToAdd.raw, tokenToAddData?.balanceOf.raw),
			statusHandler: set_txStatusApprove
		});
		if (result.isSuccessful) {
			await getTokenToAdd(tokenToAdd);
		}
	}

	async function onAddTokenCreditsToJob(): Promise<void> {
		if (!isActive || txStatusAddCredits.pending) {
			return;
		}
		const result = await addTokenCreditsToJob({
			connector: provider,
			contractAddress: getEnv(chainID).KEEP3R_V2_ADDR,
			jobAddress: jobStatus.address,
			tokenAddress: toAddress(tokenToAdd),
			tokenAmount: max(amountTokenToAdd.raw, tokenToAddData.balanceOf.raw),
			statusHandler: set_txStatusAddCredits
		});
		if (result.isSuccessful) {
			await Promise.all([getJobs(), getJobStatus(), getKeeperStatus(), getTokenToAdd(tokenToAdd)]);
			set_amountTokenToAdd(toNormalizedBN(0));
		}
	}

	function addButton(): ReactElement {
		if (toBigInt(tokenToAddData.allowance.raw) < toBigInt(amountTokenToAdd.raw)) {
			return (
				<Button
					onClick={onApprove}
					isBusy={txStatusApprove.pending}
					isDisabled={
						!isActive
						|| isZeroAddress(tokenToAdd)
						|| toBigInt(amountTokenToAdd.raw) === 0n
						|| toBigInt(amountTokenToAdd.raw) > toBigInt(tokenToAddData.balanceOf.raw)
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
					|| toBigInt(tokenToAddData.balanceOf.raw) === 0n
					|| toBigInt(amountTokenToAdd.raw) === 0n
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
							value={String(amountTokenToAdd.normalized)}
							onSetValue={(s: string): void => {
								const asRaw = parseUnits(s, tokenToAddData?.decimals || 18);
								set_amountTokenToAdd(toNormalizedBN(asRaw, tokenToAddData?.decimals || 18));
							}}
							maxValue={toBigInt(tokenToAddData.balanceOf.raw)}
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

function SectionActionsManageLiquidity({chainID}: {chainID: number}): ReactElement {
	const {provider, isActive, address} = useWeb3();
	const {getJobs, getKeeperStatus} = useKeep3r();
	const {jobStatus, getJobStatus} = useJob();
	const [txStatusWithdrawCredits, set_txStatusWithdrawCredits] = useState(defaultTxStatus);
	const [tokenToWithdraw, set_tokenToWithdraw] = useState('');
	const [amountTokenToWithdraw, set_amountTokenToWithdraw] = useState<TNormalizedBN>(toNormalizedBN(0));
	const [receiver, set_receiver] = useState('');
	const [tokenToWithdrawData, set_tokenToWithdrawData] = useState({
		balanceOf: toNormalizedBN(0),
		decimals: 18,
		symbol: ''
	});

	useEffect((): void => {
		set_receiver(address || '');
	}, [address]);

	async function getTokenToWithdraw(_tokenToWithdraw: TAddress): Promise<void> {
		const results = await readContracts({
			contracts: [
				{address: getEnv(chainID).KEEP3R_V2_ADDR, abi: KEEP3RV2_ABI, functionName: 'jobTokenCredits', args: [jobStatus.address, _tokenToWithdraw]},
				{address: _tokenToWithdraw, abi: erc20ABI, functionName: 'balanceOf', args: [toAddress(address)]},
				{address: _tokenToWithdraw, abi: erc20ABI, functionName: 'decimals'}
			]
		});
		performBatchedUpdates((): void => {
			const decimals = decodeAsNumber(results[2]);
			set_tokenToWithdrawData({
				balanceOf: toNormalizedBN(decodeAsBigInt(results[0]), decimals),
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
					set_amountTokenToWithdraw(toNormalizedBN(0));
					set_tokenToWithdrawData({
						balanceOf: toNormalizedBN(0),
						decimals: 18,
						symbol: ''
					});
				});
			}
		}
	}, [tokenToWithdraw, provider, chainID]);

	async function onWithdrawTokenCreditsFromJob(): Promise<void> {
		if (!isActive || txStatusWithdrawCredits.pending) {
			return;
		}
		const result = await withdrawTokenCreditsFromJob({
			connector: provider,
			contractAddress: getEnv(chainID).KEEP3R_V2_ADDR,
			jobAddress: toAddress(jobStatus.address),
			tokenAddress: toAddress(tokenToWithdraw),
			receiver: toAddress(receiver),
			amount: max(amountTokenToWithdraw.raw, toBigInt(tokenToWithdrawData?.balanceOf.raw)),
			statusHandler: set_txStatusWithdrawCredits
		});
		if (result.isSuccessful) {
			await Promise.all([
				getJobs(),
				getJobStatus(),
				getKeeperStatus(),
				getTokenToWithdraw(toAddress(tokenToWithdraw))
			]);
			set_amountTokenToWithdraw(toNormalizedBN(0));
		}		
	}

	function withdrawButton(): ReactElement {
		return (
			<Button
				onClick={onWithdrawTokenCreditsFromJob}
				isBusy={txStatusWithdrawCredits.pending}
				isDisabled={
					!isActive
					|| toBigInt(tokenToWithdrawData.balanceOf.raw) === 0n
					|| toBigInt(amountTokenToWithdraw.raw) === 0n
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
							value={String(amountTokenToWithdraw.normalized)}
							onSetValue={(s: string): void => {
								const asRaw = parseUnits(s, tokenToWithdrawData?.decimals || 18);
								set_amountTokenToWithdraw(toNormalizedBN(asRaw, tokenToWithdrawData?.decimals || 18));
							}}
							maxValue={toBigInt(tokenToWithdrawData?.balanceOf.raw)}
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

function PanelManageLiquidity({chainID}: {chainID: number}): ReactElement {
	return (
		<div className={'flex flex-col p-6'}>
			<SectionAddToken chainID={chainID} />
			<SectionActionsManageLiquidity chainID={chainID} />
		</div>
	);
}


export default PanelManageLiquidity;
