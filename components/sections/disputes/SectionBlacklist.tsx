import React, {useState} from 'react';
import Input from 'components/Input';
import {useKeep3r} from 'contexts/useKeep3r';
import {revoke} from 'utils/actions';
import {getEnv} from 'utils/env';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {isZeroAddress, toAddress} from '@yearn-finance/web-lib/utils/address';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {ReactElement} from 'react';

function SectionBlacklist({chainID}: {chainID: number}): ReactElement {
	const {provider, isActive} = useWeb3();
	const {keeperStatus, getKeeperStatus} = useKeep3r();
	const [blackListAddress, set_blackListAddress] = useState('');
	const [txStatus, set_txStatus] = useState(defaultTxStatus);

	async function onRevoke(): Promise<void> {
		if (!isActive || txStatus.pending) {
			return;
		}

		const result = await revoke({
			connector: provider,
			contractAddress: getEnv(chainID).KEEP3R_V2_ADDR,
			revokedAddress: toAddress(blackListAddress),
			statusHandler: set_txStatus
		});
		if (result.isSuccessful) {
			await getKeeperStatus();
			set_blackListAddress('');
		}
	}

	return (
		<div className={'flex flex-col'}>
			<h2 className={'text-xl font-bold'}>{'BLACKLIST'}</h2>
			<div className={'mt-6'}>
				<div className={'grid grid-cols-5 gap-4'}>
					<div className={'col-span-3 flex flex-col space-y-2'}>
						<span>
							<b className={'hidden text-black-1 md:block'}>{'Blacklist keeper from network'}</b>
							<b className={'block text-black-1 md:hidden'}>{'Blacklist keeper'}</b>
						</span>
						<label aria-invalid={blackListAddress !== '' && isZeroAddress(blackListAddress)}>
							<Input
								value={blackListAddress}
								onChange={(s: unknown): void => set_blackListAddress(s as string)}
								onSearch={(s: unknown): void => set_blackListAddress(s as string)}
								aria-label={'Blacklist keeper from network'}
								placeholder={'0x...'} />
						</label>
					</div>
					<div className={'col-span-2 flex flex-col space-y-2'}>
						<b className={'text-black-1/0'}>{'-'}</b>
						<Button
							onClick={onRevoke}
							isBusy={txStatus.pending}
							isDisabled={!isActive || !keeperStatus.isGovernance || isZeroAddress(blackListAddress)}>
							{txStatus.error ? 'Blacklist failed' : txStatus.success ? 'Blacklist successful' : 'Blacklist'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default SectionBlacklist;
