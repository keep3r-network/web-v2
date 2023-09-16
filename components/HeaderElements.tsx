import React, {Fragment, useEffect, useMemo, useState} from 'react';
import assert from 'assert';
import {useConnect, usePublicClient} from 'wagmi';
import {Listbox, Transition} from '@headlessui/react';
import {useAccountModal, useChainModal} from '@rainbow-me/rainbowkit';
import {useIsMounted} from '@react-hookz/web';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {toSafeChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {IconChevronBottom} from '@yearn-finance/web-lib/icons/IconChevronBottom';
import {truncateHex} from '@yearn-finance/web-lib/utils/address';

import type {ReactElement} from 'react';
import type {Chain} from 'wagmi';

function NetworkButton({label, isDisabled, onClick}: {
	label: string,
	isDisabled?: boolean,
	onClick?: () => void,
}): ReactElement {
	return (
		<button
			disabled={isDisabled}
			onClick={onClick}
			suppressHydrationWarning
			className={'yearn--header-nav-item mr-4 hidden !cursor-default flex-row items-center border-0 p-0 text-sm hover:!text-neutral-500 md:flex'}>
			<div suppressHydrationWarning className={'relative flex flex-row items-center'}>
				{label}
			</div>
		</button>
	);
}

function CurrentNetworkButton({label, isOpen}: {
	label: string,
	value: number,
	isOpen: boolean
}): ReactElement {
	return (
		<Listbox.Button
			suppressHydrationWarning
			className={'yearn--header-nav-item flex flex-row items-center border-0 p-0'}>
			<div
				suppressHydrationWarning
				className={'relative flex flex-row items-center truncate whitespace-nowrap text-grey-2'}>
				<b className={'text-base font-bold leading-6 text-grey-2'}>{label}</b>
			</div>
			<div className={'ml-1 md:ml-2'}>
				<IconChevronBottom
					className={`h-3 w-3 transition-transform md:h-5 md:w-4 ${isOpen ? '-rotate-180' : 'rotate-0'}`} />
			</div>
		</Listbox.Button>
	);
}

type TNetwork = {value: number, label: string};
export function NetworkSelector({networks}: {networks: number[]}): ReactElement {
	const {onSwitchChain} = useWeb3();
	const publicClient = usePublicClient();
	const {connectors} = useConnect();
	const safeChainID = toSafeChainID(publicClient?.chain.id, Number(process.env.BASE_CHAINID));

	const supportedNetworks = useMemo((): TNetwork[] => {
		const injectedConnector = connectors.find((e): boolean => (e.id).toLocaleLowerCase() === 'injected');
		assert(injectedConnector, 'No injected connector found');
		const chainsForInjected = injectedConnector.chains;

		return (
			chainsForInjected
				.filter(({id}): boolean => id !== 1337 && ((networks.length > 0 && networks.includes(id)) || true))
				.map((network: Chain): TNetwork => (
					{value: network.id, label: network.name}
				))
		);
	}, [connectors, networks]);

	const	currentNetwork = useMemo((): TNetwork | undefined => (
		supportedNetworks.find((network): boolean => network.value === safeChainID)
	), [safeChainID, supportedNetworks]);

	if (supportedNetworks.length === 1) {
		if (publicClient?.chain.id === 1337) {
			return <NetworkButton label={'Localhost'} isDisabled />;
		}
		if (currentNetwork?.value === supportedNetworks[0]?.value) {
			return <NetworkButton label={supportedNetworks[0]?.label || 'Ethereum'} isDisabled />;
		}
		return (
			<NetworkButton
				label={'Invalid Network'}
				onClick={(): void => onSwitchChain(supportedNetworks[0].value)} />
		);
	}

	return (
		<div className={'relative z-50 mb-4 mr-5 flex flex-col'}>
			<Listbox
				value={safeChainID}
				onChange={(value: unknown): void => onSwitchChain((value as {value: number}).value)}>
				{({open}): ReactElement => (
					<>
						<CurrentNetworkButton
							label={currentNetwork?.label || 'Ethereum'}
							value={currentNetwork?.value || 1}
							isOpen={open} />
						<Transition
							appear
							show={open}
							as={Fragment}>
							<div>
								<Transition.Child
									as={Fragment}
									enter={'ease-out duration-300'}
									enterFrom={'opacity-0'}
									enterTo={'opacity-100'}
									leave={'ease-in duration-200'}
									leaveFrom={'opacity-100'}
									leaveTo={'opacity-0'}>
									<div className={'fixed inset-0 bg-neutral-0/60'} />
								</Transition.Child>
								<Transition.Child
									as={Fragment}
									enter={'transition duration-100 ease-out'}
									enterFrom={'transform scale-95 opacity-0'}
									enterTo={'transform scale-100 opacity-100'}
									leave={'transition duration-75 ease-out'}
									leaveFrom={'transform scale-100 opacity-100'}
									leaveTo={'transform scale-95 opacity-0'}>
									<Listbox.Options className={'absolute -inset-x-24 z-50 flex items-center justify-center pt-2 opacity-0 transition-opacity'}>
										<div className={'text-xxs w-fit border border-neutral-300 bg-neutral-100 p-1 px-2 text-center text-neutral-900'}>
											{supportedNetworks.map((network): ReactElement => (
												<Listbox.Option key={network.value} value={network}>
													{({active}): ReactElement => (
														<div
															data-active={active}
															className={'yearn--listbox-menu-item text-sm'}>
															{network?.label || 'Ethereum'}
														</div>
													)}
												</Listbox.Option>
											))}
										</div>
									</Listbox.Options>
								</Transition.Child>
							</div>
						</Transition>
					</>
				)}
			</Listbox>
		</div>
	);
}

export function WalletSelector(): ReactElement {
	const {openAccountModal} = useAccountModal();
	const {openChainModal} = useChainModal();
	const {isActive, address, ens, lensProtocolHandle, openLoginModal} = useWeb3();

	const [walletIdentity, set_walletIdentity] = useState<string | undefined>(undefined);
	const isMounted = useIsMounted();

	useEffect((): void => {
		if (!isMounted()) {
			return;
		}
		if (!isActive && address) {
			set_walletIdentity('Invalid Network');
		} else if (ens) {
			set_walletIdentity(ens);
		} else if (lensProtocolHandle) {
			set_walletIdentity(lensProtocolHandle);
		} else if (address) {
			set_walletIdentity(truncateHex(address, 6));
		} else {
			set_walletIdentity(undefined);
		}
	}, [ens, lensProtocolHandle, address, isActive, isMounted]);

	return (
		<div
			className={'mb-4 flex flex-col space-y-3 text-base font-bold leading-6 text-grey-2'}
			onClick={(): void => {
				if (isActive) {
					openAccountModal?.();
				} else if (!isActive && address) {
					openChainModal?.();
				} else {
					openLoginModal();
				}
			}}>
			<div suppressHydrationWarning className={'cursor-pointer'}>
				{walletIdentity ? (walletIdentity) : 'Connect wallet'}
			</div>
		</div>
	);
}
