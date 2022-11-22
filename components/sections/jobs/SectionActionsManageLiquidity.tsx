import React, {ReactElement, useEffect, useState} from 'react';
import {ethers} from 'ethers';
import {Contract} from 'ethcall';
import {Button} from '@yearn-finance/web-lib/components';
import {useWeb3} from '@yearn-finance/web-lib/contexts';
import {Transaction, defaultTxStatus, format, isZeroAddress, performBatchedUpdates, providers} from '@yearn-finance/web-lib/utils';
import Input from 'components/Input';
import {useKeep3r} from 'contexts/useKeep3r';
import {useJob} from 'contexts/useJob';
import {approveERC20} from 'utils/actions/approveToken';
import {addTokenCreditsToJob} from 'utils/actions/addTokenCreditsToJob';
import {withdrawTokenCreditsFromJob} from 'utils/actions/withdrawTokenCreditsFromJob';
import ERC20_ABI from 'utils/abi/keep3rv1.abi';
import KEEP3RV2_ABI from 'utils/abi/keep3rv2.abi';
import {getEnv} from 'utils/env';

function	SectionAddToken({chainID}: {chainID: number}): ReactElement {
	const	{provider, isActive, address} = useWeb3();
	const	{getJobs, getKeeperStatus} = useKeep3r();
	const	{jobStatus, getJobStatus} = useJob();
	const	[txStatusApprove, set_txStatusApprove] = useState(defaultTxStatus);
	const	[txStatusAddCredits, set_txStatusAddCredits] = useState(defaultTxStatus);
	const	[tokenToAdd, set_tokenToAdd] = useState('');
	const	[amountTokenToAdd, set_amountTokenToAdd] = useState('');
	const	[tokenToAddData, set_tokenToAddData] = useState({
		balanceOf: ethers.constants.Zero,
		allowance: ethers.constants.Zero,
		decimals: 18,
		symbol: ''
	});

	async function	getTokenToAdd(_tokenToAdd: string): Promise<void> {
		const	_provider = provider || providers.getProvider(1);
		const	ethcallProvider = await providers.newEthCallProvider(_provider);
		const	tokenToAddContract = new Contract(_tokenToAdd as string, ERC20_ABI);
		const	results = await ethcallProvider.tryAll([
			tokenToAddContract.balanceOf(address),
			tokenToAddContract.allowance(address, getEnv(chainID).KEEP3R_V2_ADDR),
			tokenToAddContract.decimals(),
			tokenToAddContract.symbol()
		]) as unknown[];

		performBatchedUpdates((): void => {
			const	[balanceOf, allowance, decimals, symbol] = results;
			set_tokenToAddData({
				balanceOf: balanceOf as ethers.BigNumber,
				allowance: allowance as ethers.BigNumber,
				decimals: decimals as number,
				symbol: symbol as string
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
						balanceOf: ethers.constants.Zero,
						allowance: ethers.constants.Zero,
						decimals: 18,
						symbol: ''
					});
				});
			}
		}
	}, [tokenToAdd, provider, chainID]); // eslint-disable-line react-hooks/exhaustive-deps

	async function	onApprove(): Promise<void> {
		if (!isActive || txStatusApprove.pending)
			return;
		new Transaction(provider, approveERC20, set_txStatusApprove)
			.populate(
				tokenToAdd,
				getEnv(chainID).KEEP3R_V2_ADDR,
				format.toSafeAmount(amountTokenToAdd, tokenToAddData?.balanceOf || ethers.constants.Zero, tokenToAddData?.decimals || 18)
			).onSuccess(async (): Promise<void> => {
				await getTokenToAdd(tokenToAdd);
			}).perform();
	}

	async function	onAddTokenCreditsToJob(): Promise<void> {
		if (!isActive || txStatusAddCredits.pending)
			return;
		new Transaction(provider, addTokenCreditsToJob, set_txStatusAddCredits)
			.populate(
				chainID,
				jobStatus.address,
				tokenToAdd,
				format.toSafeAmount(amountTokenToAdd, tokenToAddData?.balanceOf || ethers.constants.Zero, tokenToAddData?.decimals || 18)
			).onSuccess(async (): Promise<void> => {
				await Promise.all([getJobs(), getJobStatus(), getKeeperStatus(), getTokenToAdd(tokenToAdd)]);
				set_amountTokenToAdd('');
			}).perform();
		
	}

	function	addButton(): ReactElement {
		const	allowance = ethers.utils.formatUnits(tokenToAddData?.allowance || 0, tokenToAddData?.decimals || 18);
		if (Number(allowance) < Number(amountTokenToAdd)) {
			return (
				<Button
					onClick={onApprove}
					isBusy={txStatusApprove.pending}
					isDisabled={
						!isActive
						|| isZeroAddress(tokenToAdd)
						|| amountTokenToAdd === '' || Number(amountTokenToAdd) === 0 
						|| Number(amountTokenToAdd) > Number(format.units(tokenToAddData?.balanceOf || ethers.constants.Zero, tokenToAddData?.decimals || 18))
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
					|| (tokenToAddData.balanceOf || ethers.constants.Zero).eq(0)
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
			<div aria-label={'Add tokens directly'} className={'mt-4 mb-10 space-y-6'}>
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

						<Input.BigNumber
							label={''}
							value={amountTokenToAdd}
							onSetValue={(s: string): void => set_amountTokenToAdd(s)}
							maxValue={tokenToAddData?.balanceOf || ethers.constants.Zero}
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
	const	{provider, isActive, address} = useWeb3();
	const	{getJobs, getKeeperStatus} = useKeep3r();
	const	{jobStatus, getJobStatus} = useJob();
	const	[txStatusWithdrawCredits, set_txStatusWithdrawCredits] = useState(defaultTxStatus);
	const	[tokenToWithdraw, set_tokenToWithdraw] = useState('');
	const	[amountTokenToWithdraw, set_amountTokenToWithdraw] = useState('');
	const	[receiver, set_receiver] = useState('');
	const	[tokenToWithdrawData, set_tokenToWithdrawData] = useState({
		balanceOf: ethers.constants.Zero,
		decimals: 18,
		symbol: ''
	});

	useEffect((): void => {
		set_receiver(address || '');
	}, [address]);

	async function	getTokenToWithdraw(_tokenToWithdraw: string): Promise<void> {
		const	_provider = provider || providers.getProvider(1);
		const	ethcallProvider = await providers.newEthCallProvider(_provider);
		const	contract = new Contract(getEnv(chainID).KEEP3R_V2_ADDR, KEEP3RV2_ABI);
		const	tokenToWithdrawContract = new Contract(_tokenToWithdraw, ERC20_ABI);
		const	results = await ethcallProvider.tryAll([
			contract.jobTokenCredits(jobStatus.address, _tokenToWithdraw),
			tokenToWithdrawContract.decimals(),
			tokenToWithdrawContract.symbol()
		]) as unknown[];
		performBatchedUpdates((): void => {
			const	[balanceOf, decimals, symbol] = results;
			set_tokenToWithdrawData({
				balanceOf: balanceOf as ethers.BigNumber,
				decimals: decimals as number,
				symbol: symbol as string
			});
		});
	}

	useEffect((): void => {
		if (provider) {
			if (!isZeroAddress(tokenToWithdraw)) {
				getTokenToWithdraw(tokenToWithdraw);
			} else {
				performBatchedUpdates((): void => {
					set_amountTokenToWithdraw('');
					set_tokenToWithdrawData({
						balanceOf: ethers.constants.Zero,
						decimals: 18,
						symbol: ''
					});
				});
			}
		}
	}, [tokenToWithdraw, provider, chainID]); // eslint-disable-line react-hooks/exhaustive-deps

	async function	onWithdrawTokenCreditsFromJob(): Promise<void> {
		if (!isActive || txStatusWithdrawCredits.pending)
			return;
		new Transaction(provider, withdrawTokenCreditsFromJob, set_txStatusWithdrawCredits)
			.populate(
				chainID,
				jobStatus.address,
				tokenToWithdraw,
				format.toSafeAmount(amountTokenToWithdraw, tokenToWithdrawData?.balanceOf || 0, tokenToWithdrawData?.decimals || 18),
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
						<Input.BigNumber
							label={''}
							value={amountTokenToWithdraw}
							onSetValue={(s: string): void => set_amountTokenToWithdraw(s)}
							maxValue={tokenToWithdrawData?.balanceOf || ethers.constants.Zero}
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