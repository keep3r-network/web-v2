import React, {useState} from 'react';
import Input from 'components/Input';
import TokenDropdown from 'components/TokenDropdown';
import {useKeep3r} from 'contexts/useKeep3r';
import {activate, approveERC20, bond} from 'utils/actions';
import {getEnv} from 'utils/env';
import {max} from 'utils/helpers';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {Modal} from '@yearn-finance/web-lib/components/Modal';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {IconCross} from '@yearn-finance/web-lib/icons/IconCross';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {parseUnits, toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {ReactElement} from 'react';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

type TModalBond = {
	chainID: number,
	tokenBonded: string,
	isOpen: boolean,
	onClose: () => void
}
function ModalBond({isOpen, onClose, tokenBonded, chainID}: TModalBond): ReactElement {
	const {provider, isActive} = useWeb3();
	const {keeperStatus, getKeeperStatus} = useKeep3r();
	const [amount, set_amount] = useState<TNormalizedBN>(toNormalizedBN(0));
	const [txStatusBond, set_txStatusBond] = useState(defaultTxStatus);
	const [txStatusApprove, set_txStatusApprove] = useState(defaultTxStatus);
	const [txStatusActivate, set_txStatusActivate] = useState(defaultTxStatus);

	async function onBond(): Promise<void> {
		if (!isActive || txStatusBond.pending || keeperStatus.hasDispute) {
			return;
		}

		const result = await bond({
			connector: provider,
			contractAddress: getEnv(chainID).KEEP3R_V2_ADDR,
			tokenBondedAddress: toAddress(tokenBonded),
			amount: max(amount.raw, keeperStatus.balanceOf.raw),
			statusHandler: set_txStatusBond
		});
		if (result.isSuccessful) {
			await getKeeperStatus();
			set_amount(toNormalizedBN(0));
		}
	}

	async function onApprove(): Promise<void> {
		if (!isActive || txStatusApprove.pending || keeperStatus.hasDispute) {
			return;
		}
		const result = await approveERC20({
			connector: provider,
			contractAddress: toAddress(tokenBonded),
			spenderAddress: getEnv(chainID).KEEP3R_V2_ADDR,
			amount: max(amount.raw, keeperStatus.balanceOf.raw),
			statusHandler: set_txStatusApprove
		});
		if (result.isSuccessful) {
			await getKeeperStatus();
		}
	}
	
	async function onActivate(): Promise<void> {
		if (!isActive || txStatusActivate.pending || keeperStatus.hasDispute) {
			return;
		}
		const result = await activate({
			connector: provider,
			contractAddress: getEnv(chainID).KEEP3R_V2_ADDR,
			bondedTokenAddress: toAddress(tokenBonded),
			statusHandler: set_txStatusActivate
		});
		if (result.isSuccessful) {
			await getKeeperStatus();
			set_amount(toNormalizedBN(0));
		}
	}

	function 	bondButton(): ReactElement {
		const allowance = keeperStatus.allowance.normalized;
		if (Number(allowance) < Number(amount)) {
			return (
				<Button
					onClick={onApprove}
					isBusy={txStatusApprove.pending}
					isDisabled={
						!isActive ||
						keeperStatus.hasDispute ||
						Number(amount) > Number(keeperStatus?.balanceOf.normalized)
					}>
					{txStatusApprove.error ? 'Transaction failed' : txStatusApprove.success ? 'Transaction successful' : 'Approve'}
				</Button>
			);
		}
	
		return (
			<Button
				onClick={onBond}
				isBusy={txStatusBond.pending}
				isDisabled={
					!isActive ||
					keeperStatus.hasDispute ||
					Number(amount) > Number(keeperStatus?.balanceOf.normalized)
				}>
				{txStatusBond.error ? 'Transaction failed' : txStatusBond.success ? 'Transaction successful' : 'Bond'}
			</Button>
		);
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}>
			<div className={'space-y-4 p-6'}>
				<div className={'mb-4 flex items-center justify-between'}>
					<h2 className={'text-xl font-bold'}>{'Bond'}</h2>
					<IconCross className={'h-6 w-6 cursor-pointer text-black'} onClick={onClose} />
				</div>
				
				<div className={'mb-4 grid grid-cols-1 gap-4 md:grid-cols-2'}>
					<div className={'space-y-6'}>
						<p>
							{'To become a keeper, you simply need to call '}
							<code className={'inline text-grey-2'}>{'bond(address,uint)'}</code>
							{'. No funds are required to become a keeper, however, certain jobs might require a minimum amount of funds.'}
						</p>
						<p>
							{'There is a bond time (default 3-day) delay before you can become an active keeper. Once this delay has passed, you will have to call '}
							<code className={'inline text-grey-2'}>{'activate()'}</code>
							{'.'}
						</p>
					</div>
					<div className={'space-y-10 bg-white p-6'}>
						<div>
							<p className={'mb-2'}>{'Balance, KP3R'}</p>
							<b className={'text-xl'}>{formatAmount(keeperStatus.balanceOf.normalized, 2, 2)}</b>
						</div>
						<div>
							<p className={'mb-2'}>{'Pending, KP3R'}</p>
							<b className={'text-xl'}>{formatAmount(keeperStatus.pendingBonds.normalized, 2, 2)}</b>
						</div>
						<div>
							<p className={'mb-2'}>{'Bonded, KP3R'}</p>
							<b className={'text-xl'}>{formatAmount(keeperStatus.bonds.normalized, 2, 2)}</b>
						</div>
					</div>
				</div>

				<div className={'mb-4 grid grid-cols-2 gap-4'}>
					<div className={'mb-4 space-y-2'}>
						<b>{'Token'}</b>
						<TokenDropdown.Fake name={'KP3R'} />
					</div>
					<div className={'space-y-2'}>
						<b>{'Amount'}</b>
						<div>
							<Input.Bigint
								value={String(amount.normalized)}
								onSetValue={(s: string): void => {
									const asRaw = parseUnits(s);
									set_amount(toNormalizedBN(asRaw));
								}}
								maxValue={toBigInt(keeperStatus?.balanceOf.raw)}
								decimals={18}
								canBeZero
								shouldHideBalance/>
						</div>
					</div>
				</div>

				<div className={'mb-4 grid grid-cols-2 gap-4'}>
					<div>
						{bondButton()}
					</div>
					<div>
						<Button
							onClick={onActivate}
							isBusy={txStatusActivate.pending}
							isDisabled={!keeperStatus.canActivate}>
							{
								txStatusActivate.error ? 'Transaction failed' :
									txStatusActivate.success ? 'Transaction successful' :
										keeperStatus.hasPendingActivation ? 
											keeperStatus.canActivate || keeperStatus.canActivateIn === 'Now' ? 'Activate' : `Activate (${keeperStatus.canActivateIn})`
											: 'Activate'
							}
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
}

export {ModalBond};
