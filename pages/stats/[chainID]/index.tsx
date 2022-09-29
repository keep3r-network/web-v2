import React, {ReactElement, useMemo, useState} from 'react';
import {useRouter} from 'next/router';
import axios from 'axios';
import useSWR from 'swr';
import {format} from '@yearn-finance/web-lib/utils';
import Input from 'components/Input';
import LogsStatsPerKeeper from 'components/logs/LogsStatsPerKeeper';

const fetcher = async (url: string): Promise<any> => axios.get(url).then((res): any => res.data);

function	Stats(): ReactElement {
	const	router = useRouter();
	const	{data} = useSWR(router?.query?.chainID ? `/api/stats?chainID=${router?.query?.chainID}` : null, fetcher, {shouldRetryOnError: false});
	const	[searchTerm, set_searchTerm] = useState('');

	const	chainID = useMemo((): number => {
		let	currentChainID = parseInt(router?.query?.chainID as string, 10);
		if (currentChainID === undefined || currentChainID === null || isNaN(Number(currentChainID))) {
			currentChainID = 1;
		}
		return currentChainID;
	}, [router?.query?.chainID]);

	return (
		<>
			<section aria-label={'general statistics'} className={'mb-4 bg-grey-3'}>
				<div className={'mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 py-6 px-4 md:grid-cols-5 md:gap-4'}>
					<div className={'space-y-2'}>
						<p>{'Function calls'}</p>
						<div>
							<b className={'text-2xl'}>{!data?.stats?.isSuccessful ? '-' : format.amount(data?.stats?.workDone || 0, 0, 0)}</b>
						</div>
					</div>
					<div className={'space-y-2'}>
						<p>{'Rewarded, KP3R'}</p>
						<div>
							<b className={'text-2xl'}>{!data?.stats?.isSuccessful ? '-' : format.amount(Number(format.units(data?.stats?.rewardedKp3r || 0, 18)), 2, 2)}</b>
						</div>
					</div>
					<div className={'space-y-2'}>
						<p>{'Keepers'}</p>
						<div>
							<b className={'text-2xl'}>{!data?.stats?.isSuccessful ? '-' : format.amount(data?.stats?.keepers || 0, 0, 0)}</b>
						</div>
					</div>
					<div className={'space-y-2'}>
						<p>{'Bonded, KP3R'}</p>
						<div>
							<b className={'text-2xl'}>{!data?.stats?.isSuccessful ? '-' : format.amount(Number(format.units(data?.stats?.bondedKp3r || 0, 18)), 2, 2)}</b>
						</div>
					</div>
					<div className={'space-y-2'}>
						<p>{'Bonded, $'}</p>
						<div>
							<b className={'text-2xl'}>
								{!data?.stats?.isSuccessful ? '-' : format.amount(Number(format.units(data?.stats?.bondedKp3r || 0, 18)) * Number(data?.prices?.keep3rv1 || 0), 2, 2)}
							</b>
						</div>
					</div>
				</div> 
			</section>
			<main className={'col-span-12 mx-auto mb-10 flex min-h-[100vh] w-full max-w-6xl flex-col px-4'}>
				<div className={'mb-8 space-y-2'}>
					<b>{'Find a Keeper'}</b>
					<Input
						value={searchTerm}
						onChange={(s: unknown): void => set_searchTerm(s as string)}
						onSearch={(s: unknown): void => set_searchTerm(s as string)}
						aria-label={'find a Keeper'}
						placeholder={'0x...'} />
				</div>
				<div>
					<LogsStatsPerKeeper
						chainID={chainID}
						searchTerm={searchTerm} />
				</div>
			</main>
		</>
	);
}

export default Stats;
