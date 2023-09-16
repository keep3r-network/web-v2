import React, {Fragment, useEffect, useMemo, useState} from 'react';
import IconKeep3r from 'components/icons/IconKeep3r';
import IconWEth from 'components/icons/IconWEth';
import LogoConvex from 'components/icons/LogoConvex';
import LogoLido from 'components/icons/LogoLido';
import {getEnv} from 'utils/env';
import {Listbox, Transition} from '@headlessui/react';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {IconChevron} from '@yearn-finance/web-lib/icons/IconChevron';
import {toAddress} from '@yearn-finance/web-lib/utils/address';

import type {ReactElement} from 'react';

type	TDropdownToken = {
	name: string,
	address: string,
	icon: ReactElement,
}
type	TTokenDropdown = {
	onSelect: (s: string) => void,
	chainID: number,
	withKeeper?: boolean
}
function	TokenDropdownBase({onSelect, withKeeper, chainID = 1}: TTokenDropdown): ReactElement {
	const {safeChainID} = useChainID();
	const keeperToken = useMemo((): TDropdownToken => ({
		name: 'kLP-KP3R/WETH',
		address: toAddress(getEnv(chainID).KLP_KP3R_WETH_ADDR),
		icon: <IconKeep3r className={'h-8 w-8'}/>
	}), [chainID]);
	
	const tokenList = useMemo((): TDropdownToken[] => {
		if (safeChainID === 1) {
			return ([
				{
					name: 'CVX',
					address: toAddress(getEnv(chainID).CVX_TOKEN_ADDR),
					icon: <LogoConvex className={'h-8 w-8'}/>
				},
				{
					name: 'Lido',
					address: toAddress(getEnv(chainID).LIDO_TOKEN_ADDR),
					icon: <LogoLido className={'h-8 w-8'}/>
				}
			]);
		}
		return [];
	}, [safeChainID, chainID]);
	
	const [selected, set_selected] = useState(withKeeper ? keeperToken : tokenList[0]);

	useEffect((): void => {
		if (withKeeper) {
			onSelect(keeperToken.address);
		} else {
			onSelect(tokenList[0].address);
		}
	}, []);

	return (
		<Listbox
			value={selected}
			onChange={(v): void => {
				set_selected(v);
				onSelect(v.address);
			}}>
			{({open}): ReactElement => (
				<div className={'relative'}>
					<Listbox.Button className={'flex w-full flex-row items-center justify-between !bg-grey-3 p-2 hover:!bg-grey-4'}>
						<div className={'flex flex-row items-center space-x-2'}>
							{toAddress(selected.address) === toAddress(getEnv(chainID).KEEP3R_V1_ADDR) ? (
								<div className={'flex h-8 w-12 flex-row -space-x-4'}>
									<IconWEth className={'h-8 w-8'} />
									<IconKeep3r className={'h-8 w-8'} />
								</div>
							) : (
								<div className={'h-8 w-8'}>
									{selected.icon}
								</div>
							)}
							<b className={'text-base'}>{selected.name}</b>
						</div>
						<span className={'pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'}>
							<IconChevron className={`text-black transition-transform ${open ? '-rotate-90' : '-rotate-180'}`}/>
						</span>
					</Listbox.Button>
					<Transition
						as={Fragment}
						leave={'transition ease-in duration-100'}
						leaveFrom={'opacity-100'}
						leaveTo={'opacity-0'}>
						<Listbox.Options className={'absolute z-10 mt-1 max-h-60 w-full overflow-auto bg-grey-3'}>
							{(withKeeper ? [keeperToken, ...tokenList] : tokenList).map((token, tokenIdx): ReactElement => (
								<Listbox.Option
									key={tokenIdx}
									className={'relative cursor-pointer select-none bg-grey-3 p-2 transition-colors hover:bg-grey-4'}
									value={token}>
									<div className={'flex flex-row items-center space-x-2'}>
										{toAddress(token.address) === toAddress(getEnv(chainID).KEEP3R_V1_ADDR) ? (
											<div className={'flex h-8 w-12 flex-row -space-x-4'}>
												<IconWEth className={'h-8 w-8'} />
												<IconKeep3r className={'h-8 w-8'} />
											</div>
										) : (
											<div className={'h-8 w-8'}>
												{token.icon}
											</div>
										)}
										<b>{token.name}</b>
									</div>
								</Listbox.Option>
							))}
						</Listbox.Options>
					</Transition>
				</div>
			)}
		</Listbox>
	);
}
  

type		TTokenDropdownFake = {name: string}
function	TokenDropdownFake({name}: TTokenDropdownFake): ReactElement {
	return (
		<div className={'flex flex-row items-center justify-between bg-grey-3 p-2'}>
			<div className={'flex flex-row items-center space-x-2'}>
				<div className={'h-8 w-8 rounded-full bg-black'}>
					<IconKeep3r className={'h-8 w-8'} />
				</div>
				<b className={'text-base'}>{name}</b>
			</div>
			<IconChevron className={'-rotate-90 opacity-0'}/>
		</div>
	);
}

const TokenDropdown = Object.assign(TokenDropdownBase, {Fake: TokenDropdownFake});
export default TokenDropdown;
