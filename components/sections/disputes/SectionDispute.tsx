import React, {useState} from 'react';
import Input from 'components/Input';
import {useKeep3r} from 'contexts/useKeep3r';
import {dispute, resolve} from 'utils/actions';
import {getEnv} from 'utils/env';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {isZeroAddress, toAddress} from '@yearn-finance/web-lib/utils/address';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {ReactElement} from 'react';

function SectionDispute({chainID}: {chainID: number}): ReactElement {
	const {provider, isActive} = useWeb3();
	const {keeperStatus, getKeeperStatus} = useKeep3r();
	const [disputeAddress, set_disputeAddress] = useState('');
	const [resolveAddress, set_resolveAddress] = useState('');
	const [txStatusDispute, set_txStatusDispute] = useState(defaultTxStatus);
	const [txStatusResolve, set_txStatusResolve] = useState(defaultTxStatus);

	async function onDispute(): Promise<void> {
		if (!isActive || txStatusDispute.pending) {
			return;
		}
		const result = await dispute({
			connector: provider,
			contractAddress: getEnv(chainID).KEEP3R_V2_ADDR,
			disputedAddress: toAddress(disputeAddress),
			statusHandler: set_txStatusDispute
		});
		if (result.isSuccessful) {
			await getKeeperStatus();
			set_disputeAddress('');
		}
	}

	async function onResolve(): Promise<void> {
		if (!isActive || txStatusResolve.pending) {
			return;
		}

		const result = await resolve({
			connector: provider,
			contractAddress: getEnv(chainID).KEEP3R_V2_ADDR,
			resolvedAddress: toAddress(resolveAddress),
			statusHandler: set_txStatusResolve
		});
		if (result.isSuccessful) {
			await getKeeperStatus();
			set_resolveAddress('');
		}
	}

	return (
		<div className={'flex flex-col'}>
			<h2 className={'mb-4 text-xl font-bold'}>{'DISPUTES'}</h2>
			<p>{'If your job isn\'t necessary anymore, you are able to unbond your kLPs from it and withdraw the underlying tokens after the unbonding period has passed (default 14 days).'}</p>
			<div className={'mt-6'}>
				<b className={'text-black-1'}>{'Dispute keeper or job'}</b>
				<div className={'mb-8 mt-2 grid grid-cols-5 gap-4'}>
					<label
						aria-invalid={disputeAddress !== '' && isZeroAddress(disputeAddress)}
						className={'col-span-3'}>
						<Input
							value={disputeAddress}
							onChange={(s: unknown): void => set_disputeAddress(s as string)}
							onSearch={(s: unknown): void => set_disputeAddress(s as string)}
							aria-label={'Dispute keeper or job'}
							placeholder={'0x...'} />
					</label>
					<div className={'col-span-2'}>
						<Button
							onClick={onDispute}
							isBusy={txStatusDispute.pending}
							isDisabled={!isActive || !keeperStatus.isDisputer || isZeroAddress(disputeAddress)}>
							{txStatusDispute.error ? 'Dispute failed' : txStatusDispute.success ? 'Dispute successful' : 'Dispute'}
						</Button>
					</div>
				</div>

				<b className={'text-black-1'}>{'Resolve a dispute'}</b>
				<div className={'mb-8 mt-2 grid grid-cols-5 gap-4'}>
					<label
						aria-invalid={resolveAddress !== '' && isZeroAddress(resolveAddress)}
						className={'col-span-3'}>
						<Input
							value={resolveAddress}
							onChange={(s: unknown): void => set_resolveAddress(s as string)}
							onSearch={(s: unknown): void => set_resolveAddress(s as string)}
							aria-label={'Resolve a dispute'}
							placeholder={'0x...'} />
					</label>
					<div className={'col-span-2'}>
						<Button
							onClick={onResolve}
							isBusy={txStatusResolve.pending}
							isDisabled={!isActive || !keeperStatus.isDisputer || isZeroAddress(resolveAddress)}>
							{txStatusResolve.error ? 'Resolve failed' : txStatusResolve.success ? 'Resolve successful' : 'Resolve'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default SectionDispute;
