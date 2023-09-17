/* eslint-disable @typescript-eslint/consistent-type-assertions */
import React, {useEffect, useMemo, useState} from 'react';
import Input from 'components/Input';
import TokenPairDropdown from 'components/TokenPairDropdown';
import {useJob} from 'contexts/useJob';
import {usePairs} from 'contexts/usePairs';
import {addLiquidityToJob} from 'utils/actions/addLiquidityToJob';
import {approveERC20} from 'utils/actions/approveToken';
import {mint} from 'utils/actions/mint';
import {getEnv} from 'utils/env';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {toSafeAmount} from '@yearn-finance/web-lib/utils/format';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {performBatchedUpdates} from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {defaultTxStatus, Transaction} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {TUserPairsPosition} from 'contexts/types';
import type {ReactElement} from 'react';


function	PanelBridgeTokens(): ReactElement {
	const {chainID} = useChainID();
	const chainName = useMemo((): string => {
		if (chainID === 5) {
			return 'Goerli';
		} if (chainID === 10) {
			return 'Optimism';
		} if (chainID === 420) {
			return 'Goerli Optimism';
		} if (chainID === 1337) {
			return 'Mainnet fork';
		}
		return 'Unknown';
	}, [chainID]);

	return (
		<div aria-label={'Bridge tokens'} className={'flex flex-col'}>
			<b className={'text-lg'}>{'Bridge tokens'}</b>
			<p className={'mt-4'}>
				{`You are on ${chainName} right now. To use Keep3r Network and automate your job, you’ll have to bridge kLP-KP3R/WETH from Ethereum to ${chainName}. Once you click “Bridge tokens” you’ll be redirected to Connext. Follow instructions on their website and come back after that.`}
			</p>
			<div className={'mb-10 mt-8'}>
				<a
					href={'https://bridge.connext.network/'}
					target={'_blank'}
					rel={'noreferrer'}>
					<Button>
						{'Bridge tokens'}
					</Button>
				</a>
			</div>
		</div>
	);
}

const defaultPairPosition: TUserPairsPosition = {
	balanceOfPair: toNormalizedBN(0),
	allowanceOfPair: toNormalizedBN(0),
	balanceOfToken1: toNormalizedBN(0),
	allowanceOfToken1: toNormalizedBN(0),
	balanceOfToken2: toNormalizedBN(0),
	allowanceOfToken2: toNormalizedBN(0)
};
function	PanelMintTokens({chainID}: {chainID: number}): ReactElement {
	const {address, provider, isActive} = useWeb3();
	const {pairs, getPairs, getPairsBalance, userPairsPosition} = usePairs();
	const {safeChainID} = useChainID();
	const [amountToken1, set_amountToken1] = useState('');
	const [amountToken2, set_amountToken2] = useState('');
	const [pair, set_pair] = useState(pairs[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]);
	const [userPairPosition, set_userPairPosition] = useState<TUserPairsPosition>(defaultPairPosition);
	const [txStatusApproveToken1, set_txStatusApproveToken1] = useState(defaultTxStatus);
	const [txStatusApproveToken2, set_txStatusApproveToken2] = useState(defaultTxStatus);
	const [txStatusMint, set_txStatusMint] = useState(defaultTxStatus);

	useEffect((): void => {
		set_pair(pairs[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]);
		set_userPairPosition(userPairsPosition?.[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)] || defaultPairPosition);
	}, [pairs, userPairsPosition, chainID]);

	async function	onApproveToken1(token: string, spender: string, amount: bigint): Promise<void> {
		if (!isActive || txStatusApproveToken1.pending) {
			return;
		}
		new Transaction(provider, approveERC20, set_txStatusApproveToken1)
			.populate(token, spender, amount)
			.onSuccess(async (): Promise<void> => {
				await Promise.all([getPairs(safeChainID), getPairsBalance(safeChainID, toAddress(address))]);
			})
			.perform();
	}

	async function	onApproveToken2(token: string, spender: string, amount: bigint): Promise<void> {
		if (!isActive || txStatusApproveToken2.pending) {
			return;
		}
		new Transaction(provider, approveERC20, set_txStatusApproveToken2)
			.populate(token, spender, amount)
			.onSuccess(async (): Promise<void> => {
				await Promise.all([getPairs(safeChainID), getPairsBalance(safeChainID, toAddress(address))]);
			})
			.perform();
	}

	async function	onMint(pairAddress: string, amount1: bigint, amount2: bigint): Promise<void> {
		if (!isActive || txStatusMint.pending) {
			return;
		}
		new Transaction(provider, mint, set_txStatusMint)
			.populate(pairAddress, amount1, amount2)
			.onSuccess(async (): Promise<void> => {
				await Promise.all([getPairs(safeChainID), getPairsBalance(safeChainID, toAddress(address))]);
				performBatchedUpdates((): void => {
					set_amountToken1('');
					set_amountToken2('');
				});
			})
			.perform();
	}

	function	renderApproveOrMintButton(): ReactElement {
		const allowance1 = userPairPosition?.allowanceOfToken1;
		const allowance2 = userPairPosition?.allowanceOfToken2;
		const isAmountOverflow = (
			!Number(amountToken1) || !Number(amountToken2)
			|| Number(amountToken1) > Number(userPairPosition?.balanceOfToken1.normalized || 0)
			|| Number(amountToken2) > Number(userPairPosition?.balanceOfToken2.normalized || 0)
		);

		if (Number(allowance1) < Number(amountToken1)) {
			return (
				<Button
					onClick={(): void => {
						onApproveToken1(
							pair.addressOfToken1,
							pair.addressOfPair,
							toSafeAmount(amountToken1, userPairPosition?.balanceOfToken1 || 0)
						);
					}}
					isBusy={txStatusApproveToken1.pending}
					isDisabled={!isActive || isAmountOverflow}>
					{txStatusApproveToken1.error ? 'Transaction failed' : txStatusApproveToken1.success ? 'Transaction successful' : `Approve ${pair?.nameOfToken1 || ''}`}
				</Button>
			);
		} if (Number(allowance2) < Number(amountToken2)) {
			return (
				<Button
					onClick={(): void => {
						onApproveToken2(
							pair.addressOfToken2,
							pair.addressOfPair,
							toSafeAmount(amountToken2, userPairPosition?.balanceOfToken2 || 0)
						);
					}}
					isBusy={txStatusApproveToken2.pending}
					isDisabled={!isActive || isAmountOverflow}>
					{txStatusApproveToken2.error ? 'Transaction failed' : txStatusApproveToken2.success ? 'Transaction successful' : `Approve ${pair?.nameOfToken2 || ''}`}
				</Button>
			);
		}
		return (
			<Button
				onClick={(): void => {
					onMint(
						pair.addressOfPair,
						toSafeAmount(amountToken1, userPairPosition?.balanceOfToken1 || 0),
						toSafeAmount(amountToken2, userPairPosition?.balanceOfToken2 || 0)
					);
				}}
				isBusy={txStatusMint.pending}
				isDisabled={!isActive || isAmountOverflow}>
				{txStatusMint.error ? 'Transaction failed' : txStatusMint.success ? 'Transaction successful' : 'Mint'}
			</Button>
		);
	}
	
	return (
		<div aria-label={'Mint tokens (Optional)'} className={'flex flex-col'}>
			<b className={'text-lg'}>{'Mint tokens (Optional)'}</b>
			<div className={'mb-10 mt-8 space-y-6'}>
				<TokenPairDropdown name={'kLP-KP3R/WETH'} />
				<div>
					<div className={'mb-4 grid grid-cols-1 gap-4 md:grid-cols-2'} key={`numbers_${safeChainID}`}>
						<Input.Bigint
							label={'KP3R'}
							value={amountToken1}
							onSetValue={(s: string): void => set_amountToken1(s)}
							onValueChange={(s: string): void => !pair.hasPrice ? undefined : set_amountToken2(s === '' ? '' : (Number(s) * pair.priceOfToken2).toString())}
							maxValue={toBigInt(userPairPosition?.balanceOfToken1.raw)}
							decimals={18} />
						<Input.Bigint
							label={'WETH'}
							value={amountToken2}
							onSetValue={(s: string): void => set_amountToken2(s)}
							onValueChange={(s: string): void => !pair.hasPrice ? undefined : set_amountToken1(s === '' ? '' : (Number(s) * pair.priceOfToken1).toString())}
							maxValue={toBigInt(userPairPosition?.balanceOfToken2.raw)}
							decimals={18} />
					</div>
					<div>
						{renderApproveOrMintButton()}
					</div>
				</div>
			</div>
		</div>
	);
}

function	SectionActionsAddLiquidity({chainID}: {chainID: number}): ReactElement {
	const {address, provider, isActive} = useWeb3();
	const {pairs, getPairs, getPairsBalance, userPairsPosition} = usePairs();
	const {jobStatus, getJobStatus} = useJob();
	const [amountLpToken, set_amountLpToken] = useState('');
	const [pair, set_pair] = useState(pairs[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]);
	const [userPairPosition, set_userPairPosition] = useState<TUserPairsPosition>(defaultPairPosition);
	const [txStatusAddLiquidity, set_txStatusAddLiquidity] = useState(defaultTxStatus);
	const [txStatusApprove, set_txStatusApprove] = useState(defaultTxStatus);

	useEffect((): void => {
		set_pair(pairs[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]);
		set_userPairPosition(userPairsPosition?.[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)] || defaultPairPosition);
	}, [pairs, userPairsPosition, chainID]);

	async function	onApprove(token: string, spender: string, amount: bigint): Promise<void> {
		if (!isActive || txStatusApprove.pending) {
			return;
		}
		new Transaction(provider, approveERC20, set_txStatusApprove)
			.populate(token, spender, amount)
			.onSuccess(async (): Promise<void> => {
				await Promise.all([getPairs(chainID), getPairsBalance(chainID, toAddress(address))]);
			})
			.perform();
	}

	async function	onAddLiquidityToJob(pairAddress: string, amount: bigint): Promise<void> {
		if (!isActive || txStatusAddLiquidity.pending) {
			return;
		}
		new Transaction(provider, addLiquidityToJob, set_txStatusAddLiquidity)
			.populate(chainID, jobStatus.address, pairAddress, amount)
			.onSuccess(async (): Promise<void> => {
				await Promise.all([getJobStatus(), getPairs(chainID), getPairsBalance(chainID, toAddress(address))]);
			})
			.perform();
	}

	function	renderApproveOrAddLiquidityButton(): ReactElement {
		const allowancePair = userPairPosition?.allowanceOfPair.normalized;
		const isAmountOverflow = (
			amountLpToken !== '' && (
				!Number(amountLpToken)
				|| Number(amountLpToken) > Number(userPairPosition.balanceOfPair.normalized)
			)
		);

		if (Number(allowancePair) < Number(amountLpToken)) {
			return (
				<Button
					onClick={(): void => {
						onApprove(
							pair.addressOfPair,
							getEnv(chainID).KEEP3R_V2_ADDR,
							toSafeAmount(`${Number(amountLpToken)}`, userPairPosition.balanceOfPair.raw)
						);
					}}
					isBusy={txStatusApprove.pending}
					isDisabled={!isActive || isAmountOverflow}>
					{txStatusApprove.error ? 'Transaction failed' : txStatusApprove.success ? 'Transaction successful' : 'Approve liquidity'}
				</Button>
			);
		}
		return (
			<Button
				onClick={(): void => {
					onAddLiquidityToJob(
						pair.addressOfPair,
						toSafeAmount(`${Number(amountLpToken)}`, userPairPosition.balanceOfPair.raw)
					);
				}}
				isBusy={txStatusAddLiquidity.pending}
				isDisabled={
					!isActive
					|| !Number(amountLpToken)
					|| Number(amountLpToken) > Number(userPairPosition.balanceOfPair.normalized)
				}>
				{txStatusAddLiquidity.error ? 'Transaction failed' : txStatusAddLiquidity.success ? 'Transaction successful' : 'Add liquidity to job'}
			</Button>
		);
	}

	return (
		<div aria-label={'Add liquidity'} className={'flex flex-col'}>
			<b className={'text-lg'}>{'Add liquidity'}</b>
			<div className={'mt-8 space-y-6'}>
				<div>
					<div className={'mb-4 grid grid-cols-1 gap-4 md:grid-cols-2'}>
						<div className={'space-y-2'}>
							<TokenPairDropdown name={'kLP-KP3R/WETH'} />
						</div>
						<Input.Bigint
							value={amountLpToken}
							onSetValue={(s: string): void => set_amountLpToken(s)}
							maxValue={toBigInt(userPairPosition.balanceOfPair.raw)}
							decimals={18} />
					</div>
					<div>
						{renderApproveOrAddLiquidityButton()}
					</div>
				</div>
			</div>
		</div>
	);
}

function	Wrapper({chainID}: {chainID: number}): ReactElement {
	const {address} = useWeb3();
	if ([1, 1337, 5].includes(chainID)) {
		return (
			<div
				className={'flex flex-col p-6'}
				key={`${chainID}_${address}`}>
				<section aria-label={'ADD LIQUIDITY'}>
					<PanelMintTokens chainID={chainID}/>
					<SectionActionsAddLiquidity chainID={chainID}/>
				</section>
			</div>
		);	
	}
	return (
		<div
			className={'flex flex-col p-6'}
			key={`${chainID}_${address}`}>
			<section aria-label={'ADD LIQUIDITY'}>
				<PanelBridgeTokens />
				<SectionActionsAddLiquidity chainID={chainID}/>
			</section>
		</div>
	);
}

export default Wrapper;
