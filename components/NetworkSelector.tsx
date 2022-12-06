import React, {Fragment, useEffect, useMemo, useState} from 'react';
import {Menu, Transition} from '@headlessui/react';
import {useWeb3} from '@yearn-finance/web-lib/contexts';
import {Chevron} from '@yearn-finance/web-lib/icons';

import type {ReactElement} from 'react';

type TOptions = {label: string, value: number};

const	options: TOptions[] = [
	{label: 'Ethereum Mainnet', value: 1},
	{label: 'Goerli Testnet', value: 5},
	{label: 'Fantom Opera', value: 250},
	{label: 'Forknet', value: 1337}
];

function	NetworkSelector(): ReactElement {
	const	[isInit, set_isInit] = useState(false);
	const	{chainID, onSwitchChain} = useWeb3();
	const	selected = useMemo((): TOptions => (options.find((e): boolean => e.value === Number(chainID)) || options[0]), [chainID]);
	
	useEffect((): void => {
		set_isInit(true);
	}, []);

	return (
		<Menu as={'menu'} className={'relative inline-block text-left'}>
			{({open}): ReactElement => (
				<>
					<Menu.Button className={'flex h-auto items-center justify-between p-0 hover:bg-black'}>
						<b className={'text-grey-2'}>{isInit ? selected?.label || '' : options[0].label}</b>
						<Chevron className={`text-grey-2 ml-3 h-4 w-4 transition-transform ${open ? '-rotate-90' : '-rotate-180'}`} />
					</Menu.Button>
					<Transition
						as={Fragment}
						show={open}
						enter={'transition duration-100 ease-out'}
						enterFrom={'transform scale-95 opacity-0'}
						enterTo={'transform scale-100 opacity-100'}
						leave={'transition duration-75 ease-out'}
						leaveFrom={'transform scale-100 opacity-100'}
						leaveTo={'transform scale-95 opacity-0'}>
						<Menu.Items className={'bg-black-2 absolute right-[-75%] mt-4 flex max-h-60 w-full min-w-[180px] -translate-x-1/2 flex-col overflow-y-scroll border-0'}>
							{options.map((option): ReactElement => (
								<Menu.Item key={option.value}>
									{({active}): ReactElement => (
										<div
											onClick={(): void => onSwitchChain(option.value, true)}
											className={`text-grey-2 flex cursor-pointer flex-row items-center py-2 pr-4 pl-3 font-bold transition-colors ${active ? 'text-white' : ''}`}>
											<p className={'text-inherit'}>{option.label}</p>
										</div>
									)}
								</Menu.Item>
							))}
						</Menu.Items>
					</Transition>
				</>
			)}
		</Menu>
	);
}

export default NetworkSelector;