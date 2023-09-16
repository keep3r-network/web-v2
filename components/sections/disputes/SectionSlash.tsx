import React, {useEffect, useState} from 'react';
import Input from 'components/Input';
import TokenDropdown from 'components/TokenDropdown';
import {useKeep3r} from 'contexts/useKeep3r';
import {ethers} from 'ethers';
import KEEP3RV2_ABI from 'utils/abi/keep3rv2.abi';
import {slash} from 'utils/actions/slash';
import {slashLiquidityFromJob} from 'utils/actions/slashLiquidityFromJob';
import {slashTokenFromJob} from 'utils/actions/slashTokenFromJob';
import {getEnv} from 'utils/env';
import {readContracts} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {isZeroAddress, toAddress} from '@yearn-finance/web-lib/utils/address';
import {decodeAsBigInt, decodeAsBoolean} from '@yearn-finance/web-lib/utils/decoder';
import {toSafeAmount} from '@yearn-finance/web-lib/utils/format';
import {toBigInt} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {performBatchedUpdates} from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {defaultTxStatus, Transaction} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {ReactElement} from 'react';
import type {TAddress} from '@yearn-finance/web-lib/types';

function	SectionSlash({chainID}: {chainID: number}): ReactElement {
	const {provider, isActive} = useWeb3();
	const {jobs, keeperStatus, getKeeperStatus} = useKeep3r();
	const [slashTokenAddress, set_slashTokenAddress] = useState('');
	const [slashAddress, set_slashAddress] = useState('');
	const [amountOfTokenBonded, set_amountOfTokenBonded] = useState('');
	const [amountOfTokenUnbonded, set_amountOfTokenUnbonded] = useState('');
	const [isKeeper, set_isKeeper] = useState(false);
	const [txStatusSlash, set_txStatusSlash] = useState(defaultTxStatus);
	const [slashed, set_slashed] = useState({
		bonds: 0n,
		pendingUnbonds: 0n,
		hasDispute: false
	});

	async function	getSlashed(_slashAddress: TAddress, _slashTokenAddress: TAddress, _isKeeper: boolean): Promise<void> {
		const isKLPKP3RWETH = toAddress(slashTokenAddress) === toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR);
		let	isKP3R = toAddress(slashTokenAddress) === toAddress(getEnv(chainID).KP3R_TOKEN_ADDR);
		if (_isKeeper) {
			_slashTokenAddress = toAddress(getEnv(chainID).KP3R_TOKEN_ADDR);
			isKP3R = true;
		}

		const results = await readContracts({
			contracts: [
				{address: getEnv(chainID).KEEP3R_V2_ADDR, abi: KEEP3RV2_ABI, functionName: 'bonds', args: [_slashAddress, _slashTokenAddress]},
				{address: getEnv(chainID).KEEP3R_V2_ADDR, abi: KEEP3RV2_ABI, functionName: 'pendingUnbonds', args: [_slashAddress, _slashTokenAddress]},
				{address: getEnv(chainID).KEEP3R_V2_ADDR, abi: KEEP3RV2_ABI, functionName: 'jobTokenCredits', args: [_slashAddress, _slashTokenAddress]},
				{address: getEnv(chainID).KEEP3R_V2_ADDR, abi: KEEP3RV2_ABI, functionName: 'liquidityAmount', args: [_slashAddress, toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)]},
				{address: getEnv(chainID).KEEP3R_V2_ADDR, abi: KEEP3RV2_ABI, functionName: 'disputes', args: [_slashAddress]}
			]
		});
		const bonds = decodeAsBigInt(results[0]);
		const pendingUnbonds = decodeAsBigInt(results[1]);
		const tokenCredits = decodeAsBigInt(results[2]);
		const liquidityAmount = decodeAsBigInt(results[3]);
		const hasDisputes = decodeAsBoolean(results[4]);

		if (_isKeeper && isKP3R) {
			performBatchedUpdates((): void => {
				set_slashed({
					bonds: bonds,
					pendingUnbonds: pendingUnbonds,
					hasDispute: hasDisputes
				});
				set_amountOfTokenBonded('');
				set_amountOfTokenUnbonded('');
			});
		} else if (_isKeeper) {
			performBatchedUpdates((): void => {
				set_slashed({
					bonds: tokenCredits,
					pendingUnbonds: 0n,
					hasDispute: hasDisputes
				});
				set_amountOfTokenBonded('');
				set_amountOfTokenUnbonded('');
			});
		} else if (isKLPKP3RWETH) {
			performBatchedUpdates((): void => {
				set_slashed({
					bonds: liquidityAmount,
					pendingUnbonds: 0n,
					hasDispute: hasDisputes
				});
				set_amountOfTokenBonded('');
				set_amountOfTokenUnbonded('');
			});
		} else {
			performBatchedUpdates((): void => {
				set_slashed({
					bonds: tokenCredits,
					pendingUnbonds: 0n,
					hasDispute: hasDisputes
				});
				set_amountOfTokenBonded('');
				set_amountOfTokenUnbonded('');
			});
		}
	}

	async function	onSlash(): Promise<void> {
		if (!isActive || txStatusSlash.pending) {
			return;
		}

		if (isKeeper) {
			new Transaction(provider, slash, set_txStatusSlash)
				.populate(
					chainID,
					slashAddress,
					getEnv(chainID).KP3R_TOKEN_ADDR, //always KP3R
					toSafeAmount(amountOfTokenBonded, slashed.bonds),
					toSafeAmount(amountOfTokenUnbonded, slashed.pendingUnbonds)
				)
				.onSuccess(async (): Promise<void> => {
					await Promise.all([getKeeperStatus(), getSlashed(slashAddress, slashTokenAddress, true)]);
					set_amountOfTokenBonded('');
				})
				.perform();
		} else { //is a job
			if (toAddress(slashTokenAddress) === toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR)) {
				new Transaction(provider, slashLiquidityFromJob, set_txStatusSlash)
					.populate(
						chainID,
						slashAddress,
						getEnv(chainID).KLP_KP3R_WETH_ADDR, //The LP
						toSafeAmount(amountOfTokenBonded, slashed.bonds)
					)
					.onSuccess(async (): Promise<void> => {
						await Promise.all([getKeeperStatus(), getSlashed(slashAddress, slashTokenAddress, false)]);
						set_amountOfTokenBonded('');
					})
					.perform();
			} else {
				new Transaction(provider, slashTokenFromJob, set_txStatusSlash)
					.populate(
						chainID,
						slashAddress,
						slashTokenAddress,
						toSafeAmount(amountOfTokenBonded, slashed.bonds)
					)
					.onSuccess(async (): Promise<void> => {
						await Promise.all([getKeeperStatus(), getSlashed(slashAddress, slashTokenAddress, false)]);
						set_amountOfTokenBonded('');
					})
					.perform();
			}
		}
	}

	useEffect((): void => {
		const isAddrKeeper = jobs.findIndex((job): boolean => toAddress(job.address) === toAddress(slashAddress)) === -1;
		set_isKeeper(isAddrKeeper);
		if (!isZeroAddress(slashAddress) && !isZeroAddress(slashTokenAddress)) {
			getSlashed(toAddress(slashAddress), toAddress(slashTokenAddress), isAddrKeeper);
		}
	}, [slashAddress, slashTokenAddress]);

	return (
		<div className={'flex flex-col'}>
			<h2 className={'text-xl font-bold'}>{'SLASHES'}</h2>
			<div className={'mt-6'}>
				<div className={'mb-8 grid grid-cols-5 gap-4'}>
					<div className={'col-span-3 flex flex-col space-y-2'}>
						<span>
							<b className={'hidden text-black-1 md:block'}>{'Slash keeper and its bonded assets'}</b>
							<b className={'block text-black-1 md:hidden'}>{'Slash keeper'}</b>
						</span>
						<label
							aria-invalid={slashAddress !== '' && isZeroAddress(slashAddress)}
							className={'col-span-3'}>
							<Input
								value={slashAddress}
								onChange={(s: unknown): void => set_slashAddress(s as string)}
								onSearch={(s: unknown): void => set_slashAddress(s as string)}
								aria-label={'Slash keeper and its bonded assets'}
								placeholder={'0x...'} />
						</label>
					</div>
					<div className={'col-span-2 flex flex-col space-y-2'}>
						<b className={'text-black-1'}>{'Token bonded'}</b>
						<div>
							{isKeeper ? 
								<TokenDropdown.Fake name={'KP3R'} />
								:
								<TokenDropdown
									chainID={chainID}
									withKeeper
									onSelect={(s: string): void => set_slashTokenAddress(s)} />
							}
						</div>
					</div>
				</div>

				<div className={'mb-8 mt-2 grid grid-cols-2 gap-4'}>
					<label
						aria-invalid={ethers.utils.parseUnits(amountOfTokenBonded || '0', 18).gt(slashed?.bonds || 0)}
						className={'space-y-2'}>
						<b className={'text-black-1'}>{'Amount of bonded tokens'}</b>
						<div>
							<Input.Bigint
								value={amountOfTokenBonded}
								onSetValue={(s: unknown): void => set_amountOfTokenBonded(s as string)}
								decimals={18}
								placeholder={'0.00000000'}
								maxValue={toBigInt(slashed?.bonds)}
								shouldHideBalance />
						</div>
					</label>
					<label
						aria-invalid={ethers.utils.parseUnits(amountOfTokenUnbonded || '0', 18).gt(slashed.bonds)}
						className={`space-y-2 ${!isKeeper ? 'cursor-not-allowed opacity-40' : ''}`}>
						<b className={'text-black-1'}>{'Amount of unbonded tokens'}</b>
						<div className={!isKeeper ? 'pointer-events-none cursor-not-allowed' : ''}>
							<Input.Bigint
								disabled={!isKeeper}
								value={amountOfTokenUnbonded}
								onSetValue={(s: unknown): void => set_amountOfTokenUnbonded(s as string)}
								maxValue={toBigInt(slashed?.pendingUnbonds)}
								decimals={18}
								placeholder={'0.00000000'}
								shouldHideBalance />
						</div>
					</label>
				</div>
				<div>
					<div className={'col-span-2'}>
						<Button
							onClick={onSlash}
							isBusy={txStatusSlash.pending}
							isDisabled={
								!isActive
								|| !keeperStatus.isSlasher
								|| !slashed.hasDispute
								|| (Number(amountOfTokenBonded) === 0 && Number(amountOfTokenUnbonded) === 0)
								|| ethers.utils.parseUnits(amountOfTokenBonded || '0', 18).gt(slashed.bonds)
								|| ethers.utils.parseUnits(amountOfTokenUnbonded || '0', 18).gt(slashed.pendingUnbonds)
								|| isZeroAddress(slashAddress)
							}>
							{txStatusSlash.error ? 'Slash failed' : txStatusSlash.success ? 'Slash successful' : 'Slash'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default SectionSlash;
