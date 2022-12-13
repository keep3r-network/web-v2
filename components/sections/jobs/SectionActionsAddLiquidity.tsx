import React, {useEffect, useMemo, useState} from 'react';
import Input from 'components/Input';
import TokenPairDropdown from 'components/TokenPairDropdown';
import {useJob} from 'contexts/useJob';
import {usePairs} from 'contexts/usePairs';
import {ethers} from 'ethers';
import {addLiquidityToJob} from 'utils/actions/addLiquidityToJob';
import {approveERC20} from 'utils/actions/approveToken';
import {mint} from 'utils/actions/mint';
import {getEnv} from 'utils/env';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {formatBN, formatUnits, toSafeAmount} from '@yearn-finance/web-lib/utils/format';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {defaultTxStatus, Transaction} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {BigNumber} from 'ethers';
import type {ReactElement} from 'react';


function	PanelBridgeTokens(): ReactElement {
	const	{chainID} = useChainID();
	const	chainName = useMemo((): string => {
		if (chainID === 5) {
			return 'Goerli';
		} else if (chainID === 10) {
			return 'Optimism';
		} else if (chainID === 420) {
			return 'Goerli Optimism';
		} else if (chainID === 1337) {
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
			<div className={'mt-8 mb-10'}>
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

function	PanelMintTokens({chainID}: {chainID: number}): ReactElement {
	const	{provider, isActive} = useWeb3();
	const	{pairs, getPairs} = usePairs();
	const	[amountToken1, set_amountToken1] = useState('');
	const	[amountToken2, set_amountToken2] = useState('');
	const	[pair, set_pair] = useState(pairs[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]);
	const	[txStatusApproveToken1, set_txStatusApproveToken1] = useState(defaultTxStatus);
	const	[txStatusApproveToken2, set_txStatusApproveToken2] = useState(defaultTxStatus);
	const	[txStatusMint, set_txStatusMint] = useState(defaultTxStatus);

	useEffect((): void => {
		set_pair(pairs[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]);
	}, [pairs, chainID]);

	async function	onApproveToken1(token: string, spender: string, amount: BigNumber): Promise<void> {
		if (!isActive || txStatusApproveToken1.pending) {
			return;
		}
		new Transaction(provider, approveERC20, set_txStatusApproveToken1)
			.populate(token, spender, amount)
			.onSuccess(async (): Promise<void> => {
				await getPairs();
			})
			.perform();
	}

	async function	onApproveToken2(token: string, spender: string, amount: BigNumber): Promise<void> {
		if (!isActive || txStatusApproveToken2.pending) {
			return;
		}
		new Transaction(provider, approveERC20, set_txStatusApproveToken2)
			.populate(chainID, token, spender, amount)
			.onSuccess(async (): Promise<void> => {
				await getPairs();
			})
			.perform();
	}

	async function	onMint(pairAddress: string, amount1: BigNumber, amount2: BigNumber): Promise<void> {
		if (!isActive || txStatusMint.pending) {
			return;
		}
		new Transaction(provider, mint, set_txStatusMint)
			.populate(pairAddress, amount1, amount2)
			.onSuccess(async (): Promise<void> => {
				await getPairs();
				performBatchedUpdates((): void => {
					set_amountToken1('');
					set_amountToken2('');
				});
			})
			.perform();
	}

	function	renderApproveOrMintButton(): ReactElement {
		const	allowance1 = ethers.utils.formatUnits(pair?.allowanceOfToken1 || 0, 18);
		const	allowance2 = ethers.utils.formatUnits(pair?.allowanceOfToken2 || 0, 18);
		const	isAmountOverflow = (
			!Number(amountToken1) || !Number(amountToken2)
			|| Number(amountToken1) > Number(formatUnits(pair?.balanceOfToken1 || 0, 18))
			|| Number(amountToken2) > Number(formatUnits(pair?.balanceOfToken2 || 0, 18))
		);

		if (Number(allowance1) < Number(amountToken1)) {
			return (
				<Button
					onClick={(): void => {
						onApproveToken1(
							pair.addressOfToken1,
							pair.addressOfPair,
							toSafeAmount(amountToken1, pair.balanceOfToken1)
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
							toSafeAmount(amountToken2, pair.balanceOfToken2)
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
						toSafeAmount(amountToken1, pair.balanceOfToken1),
						toSafeAmount(amountToken2, pair.balanceOfToken2)
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
			<div className={'mt-8 mb-10 space-y-6'}>
				<TokenPairDropdown name={'kLP-KP3R/WETH'} />
				<div>
					<div className={'mb-4 grid grid-cols-1 gap-4 md:grid-cols-2'}>
						<Input.BigNumber
							label={'KP3R'}
							value={amountToken1}
							onSetValue={(s: string): void => set_amountToken1(s)}
							onValueChange={(s: string): void => !pair.hasPrice ? undefined : set_amountToken2(s === '' ? '' : (Number(s) * pair.priceOfToken2).toString())}
							maxValue={formatBN(pair?.balanceOfToken1 || 0)}
							decimals={18} />
						<Input.BigNumber
							label={'WETH'}
							value={amountToken2}
							onSetValue={(s: string): void => set_amountToken2(s)}
							onValueChange={(s: string): void => !pair.hasPrice ? undefined : set_amountToken1(s === '' ? '' : (Number(s) * pair.priceOfToken1).toString())}
							maxValue={formatBN(pair?.balanceOfToken2 || 0)}
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
	const	{provider, isActive} = useWeb3();
	const	{pairs, getPairs} = usePairs();
	const	{jobStatus, getJobStatus} = useJob();
	const	[amountLpToken, set_amountLpToken] = useState('');
	const	[pair, set_pair] = useState(pairs[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]);
	const	[txStatusAddLiquidity, set_txStatusAddLiquidity] = useState(defaultTxStatus);
	const	[txStatusApprove, set_txStatusApprove] = useState(defaultTxStatus);

	useEffect((): void => {
		set_pair(pairs[toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]);
	}, [pairs, chainID]);

	async function	onApprove(token: string, spender: string, amount: BigNumber): Promise<void> {
		if (!isActive || txStatusApprove.pending) {
			return;
		}
		new Transaction(provider, approveERC20, set_txStatusApprove)
			.populate(token, spender, amount)
			.onSuccess(async (): Promise<void> => {
				await getPairs();
			})
			.perform();
	}

	async function	onAddLiquidityToJob(pairAddress: string, amount: BigNumber): Promise<void> {
		if (!isActive || txStatusAddLiquidity.pending) {
			return;
		}
		new Transaction(provider, addLiquidityToJob, set_txStatusAddLiquidity)
			.populate(chainID, jobStatus.address, pairAddress, amount)
			.onSuccess(async (): Promise<void> => {
				await Promise.all([getJobStatus(), getPairs()]);
			})
			.perform();
	}

	function	renderApproveOrAddLiquidityButton(): ReactElement {
		const	allowancePair = ethers.utils.formatUnits(pair?.allowanceOfPair || 0, 18);
		const	isAmountOverflow = (
			amountLpToken !== '' && (
				!Number(amountLpToken)
				|| Number(amountLpToken) > Number(formatUnits(pair?.balanceOfPair || 0, 18))
			)
		);

		if (Number(allowancePair) < Number(amountLpToken)) {
			return (
				<Button
					onClick={(): void => {
						onApprove(
							pair.addressOfPair,
							getEnv(chainID).KEEP3R_V2_ADDR,
							toSafeAmount(amountLpToken, pair.balanceOfPair)
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
						toSafeAmount(amountLpToken, pair.balanceOfPair)
					);
				}}
				isBusy={txStatusAddLiquidity.pending}
				isDisabled={
					!isActive
					|| !Number(amountLpToken)
					|| Number(amountLpToken) > Number(formatUnits(pair?.balanceOfPair || 0, 18))
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
						<Input.BigNumber
							value={amountLpToken}
							onSetValue={(s: string): void => set_amountLpToken(s)}
							maxValue={formatBN(pair?.balanceOfPair || 0)}
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
	if (chainID === 1) {
		return (
			<div className={'flex flex-col p-6'}>
				<section aria-label={'ADD LIQUIDITY'}>
					<PanelMintTokens chainID={chainID}/>
					<SectionActionsAddLiquidity chainID={chainID}/>
				</section>
			</div>
		);	
	}
	return (
		<div className={'flex flex-col p-6'}>
			<section aria-label={'ADD LIQUIDITY'}>
				<PanelBridgeTokens />
				<SectionActionsAddLiquidity chainID={chainID}/>
			</section>
		</div>
	);
}

export default Wrapper;
