import React, {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import Input from 'components/Input';
import LogsStatsForKeeper from 'components/logs/LogsStatsForKeeper';
import {ModalBond} from 'components/modals/ModalBond';
import {getEnv} from 'utils/env';
import axios from 'axios';
import useSWR from 'swr';
import {Button} from '@yearn-finance/web-lib/components/Button';
import Copy from '@yearn-finance/web-lib/icons/IconCopy';
import LinkOut from '@yearn-finance/web-lib/icons/IconLinkOut';
import {toAddress, truncateHex} from '@yearn-finance/web-lib/utils/address';
import {formatToNormalizedAmount, formatToNormalizedValue} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import {copyToClipboard} from '@yearn-finance/web-lib/utils/helpers';

import type {ReactElement} from 'react';

const fetcher = async (url: string): Promise<any> => axios.get(url).then((res): any => res.data);

function	StatsKeeper(): ReactElement {
	const	router = useRouter();
	const	{data} = useSWR(
		router?.query?.address && router?.query?.chainID ? `/api/statsForAddress?chainID=${router?.query?.chainID}&address=${router?.query?.address}` : null,
		fetcher,
		{shouldRetryOnError: false}
	);
	const	chainID = useMemo((): number => {
		let	currentChainID = parseInt(router?.query?.chainID as string, 10);
		if (currentChainID === undefined || currentChainID === null || isNaN(Number(currentChainID))) {
			currentChainID = 1;
		}
		return currentChainID;
	}, [router?.query?.chainID]);

	const	[selectedToken, set_selectedToken] = useState(toAddress(getEnv(chainID).KP3R_TOKEN_ADDR));
	const	[selectedExplorer, set_selectedExplorer] = useState(getEnv(chainID).EXPLORER);
	const	[searchTerm, set_searchTerm] = useState('');
	const	[isModalBondOpen, set_isModalBondOpen] = useState(false);

	useEffect((): void => {
		set_selectedToken(toAddress(getEnv(chainID).KP3R_TOKEN_ADDR));
		set_selectedExplorer(getEnv(chainID).EXPLORER);
	}, [chainID]);

	const	Keep3rButton = Button as any;
	return (
		<main className={'col-span-12 mx-auto mt-6 mb-10 flex min-h-[100vh] w-full max-w-6xl flex-col px-4'}>
			<div className={'mb-6 flex flex-row items-center space-x-2'}>
				<p>
					<Link suppressHydrationWarning href={`/stats/${chainID}`}>{'Keepers / '}</Link>
					<b>{`Keeper ${truncateHex(data?.stats?.keeper || '-', 5)}`}</b>
				</p>
				<div><Copy onClick={(): void => copyToClipboard(data?.stats?.keeper || '-')} className={'h-6 w-6 cursor-pointer text-black'} /></div>
				<div>
					<a
						href={`https://${selectedExplorer}/address/${data?.stats?.keeper || '-'}`}
						target={'_blank'}
						rel={'noopener noreferrer'}>
						<LinkOut className={'h-6 w-6 cursor-pointer text-black'} />
					</a>
				</div>
			</div>
			<div className={'mb-6 grid grid-cols-2 gap-4 md:grid-cols-4'}>
				<div className={'flex flex-col space-y-2 bg-white p-6'}>
					<p>{'Earned, KP3R'}</p>
					<div><b className={'text-xl'}>{!data?.stats?.isSuccessful ? '-' : formatAmount(Number(data?.stats?.earned || 0), 2, 2)}</b></div>
					<p className={'text-xs'}>{`Earned, $: ${!data?.stats?.isSuccessful ? '-' : formatAmount(Number(data?.stats?.earned || 0), 2, 2)}`}</p>
				</div>

				<div className={'flex flex-col space-y-2 bg-white p-6'}>
					<p>{'TX fees, ETH'}</p>
					<div><b className={'text-xl'}>{!data?.stats?.isSuccessful ? '-' : formatAmount(Number(data?.stats?.fees || 0), 2, 2)}</b></div>
					<p className={'text-xs'}>{`TX fees, $: ${!data?.stats?.isSuccessful ? '-' : formatAmount(Number(data?.stats?.fees || 0), 2, 2)}`}</p>
				</div>

				<div className={'flex flex-col space-y-2 bg-white p-6'}>
					<p>{'Net earnings, $'}</p>
					<div>
						<b className={'text-xl'}>
							{!data?.stats?.isSuccessful ? '-' : formatAmount(Number(data?.stats?.earned || 0) - Number(data?.stats?.fees || 0), 2, 2)}
						</b>
					</div>
				</div>

				<div className={'flex flex-col space-y-2 bg-white p-6'}>
					<p>{'Function calls'}</p>
					<div><b className={'text-xl'}>{!data?.stats?.isSuccessful ? '-' : Number(data?.stats?.workDone || 0)}</b></div>
				</div>

				<div className={'flex flex-col space-y-2 bg-white p-6'}>
					<p>{'KP3R per call'}</p>
					<div><b className={'text-xl'}>{!data?.stats?.isSuccessful ? '-' : formatAmount(Number(data?.stats?.earned || 0) / data?.stats?.workDone || 0, 2, 2)}</b></div>
					<p className={'text-xs'}>{`$ per call ${!data?.stats?.isSuccessful ? '-' : formatAmount(Number(data?.stats?.earned || 0) / data?.stats?.workDone || 0, 2, 2)}`}</p>
				</div>

				<div className={'flex flex-col space-y-2 bg-white p-6'}>
					<p>{'Bonded, KP3R'}</p>
					<div><b className={'text-xl'}>{!data?.stats?.isSuccessful ? '-' : formatToNormalizedAmount(data?.stats?.bonds || 0, 18)}</b></div>
					<p className={'text-xs'}>{`Bonded, $: ${!data?.stats?.isSuccessful ? '-' : formatAmount(formatToNormalizedValue(data?.stats?.bonds || 0, 18) * data?.prices?.keep3rv1 || 0, 2, 2)}`}</p>
				</div>

				<div className={'flex flex-col space-y-2 bg-white p-6'}>
					<p>{'Balance, KP3R'}</p>
					<div>
						<b className={'text-xl'}>{!data?.stats?.isSuccessful ? '-' : formatToNormalizedAmount(data?.stats?.balanceOf || 0, 18)}</b>
					</div>
				</div>

				<div className={'flex flex-col items-center justify-center bg-white p-6'}>
					<Keep3rButton
						onClick={(): void => set_isModalBondOpen(true)}
						variant={'reverted'}>
						{'Become a Keeper'}
					</Keep3rButton>
				</div>

			</div>
			<div className={'mb-6 space-y-2'}>
				<b className={'text-black-1'}>{'Find a Job'}</b>
				<Input
					value={searchTerm}
					onChange={(s: unknown): void => set_searchTerm(s as string)}
					onSearch={(s: unknown): void => set_searchTerm(s as string)}
					aria-label={'Find a Job'}
					placeholder={'Find a Job'} />
			</div>
			<div>
				<LogsStatsForKeeper
					searchTerm={searchTerm}
					chainID={chainID}
					keeperAddress={data?.stats?.keeper || 0} />
			</div>
			<ModalBond
				isOpen={isModalBondOpen}
				onClose={(): void => set_isModalBondOpen(false)}
				chainID={chainID}
				tokenBonded={selectedToken} />
		</main>
	);
}

export default StatsKeeper;
