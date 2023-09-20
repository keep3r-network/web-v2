import React, {useState} from 'react';
import Input from 'components/Input';
import TokenDropdown from 'components/TokenDropdown';
import {useKeep3r} from 'contexts/useKeep3r';
import {unbond, withdraw} from 'utils/actions';
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

type TModalUnbond = {
	tokenBonded: string,
	chainID: number,
	isOpen: boolean,
	onClose: () => void,
}
function ModalUnbond({isOpen, onClose, tokenBonded, chainID}: TModalUnbond): ReactElement {
	const {provider, isActive} = useWeb3();
	const {keeperStatus, getKeeperStatus} = useKeep3r();
	const [amount, set_amount] = useState<TNormalizedBN>(toNormalizedBN(0));
	const [txStatusUnbond, set_txStatusUnbond] = useState(defaultTxStatus);
	const [txStatusWithdraw, set_txStatusWithdraw] = useState(defaultTxStatus);

	async function onUnbond(): Promise<void> {
		if (!isActive || txStatusUnbond.pending) {
			return;
		}
		const result = await unbond({
			connector: provider,
			contractAddress: getEnv(chainID).KEEP3R_V2_ADDR,
			tokenAddress: toAddress(tokenBonded),
			amount: max(amount.raw, keeperStatus.bonds.raw),
			statusHandler: set_txStatusUnbond
		});
		if (result.isSuccessful) {
			await getKeeperStatus();
			set_amount(toNormalizedBN(0));
		}
	}

	async function onWithdraw(): Promise<void> {
		if (!isActive || txStatusWithdraw.pending || keeperStatus.hasDispute) {
			return;
		}
		const result = await withdraw({
			connector: provider,
			contractAddress: getEnv(chainID).KEEP3R_V2_ADDR,
			tokenAddress: toAddress(tokenBonded),
			statusHandler: set_txStatusWithdraw
		});
		if (result.isSuccessful) {
			await getKeeperStatus();
			onClose();
		}
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}>
			<div className={'space-y-4 p-6'}>
				<div className={'mb-4 flex items-center justify-between'}>
					<h2 className={'text-xl font-bold'}>{'Unbond'}</h2>
					<IconCross className={'h-6 w-6 cursor-pointer text-black'} onClick={onClose} />
				</div>
				
				<div className={'mb-4 grid grid-cols-1 gap-4 md:grid-cols-2'}>
					<div className={'space-y-6'}>
						<p>
							{'If you no longer wish to be a keeper you have to call '}
							<code className={'inline text-grey-2'}>{'unbond(address,uint)'}</code>
							{' and deactivate your account.'}
						</p>
						<p>
							{'There is an unbond time (default 14-day) delay before you can withdraw any bonded assets. Once this delay has passed, you will have to call '}
							<code className={'inline text-grey-2'}>{'withdraw(address)'}</code>
							{' and claim the assets.'}
						</p>
					</div>
					<div className={'space-y-10 bg-white p-6'}>
						<div>
							<p className={'mb-2'}>{'Balance, KP3R'}</p>
							<b className={'text-xl'}>{
								formatAmount(keeperStatus.balanceOf.normalized, 2, 2)}
							</b>
						</div>
						<div>
							<p className={'mb-2'}>{'Pending, KP3R'}</p>
							<b className={'text-xl'}>{
								formatAmount(keeperStatus.pendingUnbonds.normalized, 2, 2)}
							</b>
						</div>
						<div>
							<p className={'mb-2'}>{'Bonded, KP3R'}</p>
							<b className={'text-xl'}>{
								formatAmount(keeperStatus.bonds.normalized, 2, 2)}
							</b>
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
						<Input.Bigint
							value={String(amount.normalized)}
							onSetValue={(s: string): void => {
								const asRaw = parseUnits(s);
								set_amount(toNormalizedBN(asRaw));
							}}
							decimals={18}
							placeholder={'0.00000000'}
							maxValue={toBigInt(keeperStatus?.balanceOf.raw)} />
					</div>
				</div>

				<div className={'mb-4 grid grid-cols-2 gap-4'}>
					<div>
						<Button
							onClick={onUnbond}
							isBusy={txStatusUnbond.pending}
							isDisabled={!isActive || keeperStatus.hasDispute}>
							{txStatusUnbond.error ? 'Transaction failed' : txStatusUnbond.success ? 'Transaction successful' : 'Unbond'}
						</Button>
					</div>
					<div>
						<Button
							onClick={onWithdraw}
							isBusy={txStatusWithdraw.pending}
							isDisabled={!keeperStatus.canWithdraw || toBigInt(keeperStatus.pendingUnbonds.raw) === 0n}>
							{txStatusWithdraw.error ? 'Transaction failed' : txStatusWithdraw.success ? 'Transaction successful' : keeperStatus.canWithdraw ? 'Withdraw' : `Withdraw (${keeperStatus.canWithdrawIn})`}
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
}

export {ModalUnbond};
