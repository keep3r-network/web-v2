import	React, {ReactElement, useMemo, useState}			from	'react';
import	Link							from	'next/link';
import {useRouter} from 'next/router';
import axios from 'axios';
import useSWR from 'swr';
import	Input							from	'components/Input';
import	LogsForJobCalls					from	'components/logs/LogsForJobCalls';

const fetcher = async (url: string): Promise<any> => axios.get(url).then((res): any => res.data);

function	StatsCall(): ReactElement {
	const	router = useRouter();
	const	{data: stats} = useSWR(
		router?.query?.address && router.query.chainID ? `/api/jobsCalls?&address=${router?.query?.address}&chainID=${router.query.chainID}` : null,
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


	const	[searchTerm, set_searchTerm] = useState('');

	return (
		<main className={'col-span-12 mx-auto mt-6 mb-10 flex min-h-[100vh] w-full max-w-6xl flex-col px-4'}>
			<div className={'mb-6 flex flex-row items-center space-x-2'}>
				<p>
					<Link href={'/'}>{'Jobs / '}</Link>
					<Link href={`/jobs/${chainID}/${stats?.job || '-'}`}>
						{`${stats?.shortName || '-'} /`}
					</Link>
					<b>{'Calls'}</b>
				</p>
			</div>

			<div className={'flex flex-col'}>
				<div className={'mb-8 space-y-2'}>
					<b>{'Find a call'}</b>
					<Input
						value={searchTerm}
						onChange={(s: unknown): void => set_searchTerm(s as string)}
						onSearch={(s: unknown): void => set_searchTerm(s as string)}
						aria-label={'Find a call'}
						placeholder={'Find a call'} />
				</div>
				<div>
					{stats?.job ? <LogsForJobCalls
						chainID={chainID}
						jobAddress={stats.job}
						searchTerm={searchTerm} /> : null}
				</div>
			</div>

		</main>
	);
}

export default StatsCall;