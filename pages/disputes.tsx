import React from 'react';
import LogsDispute from 'components/logs/LogsDispute';
import SectionBlacklist from 'components/sections/disputes/SectionBlacklist';
import SectionDispute from 'components/sections/disputes/SectionDispute';
import SectionSlash from 'components/sections/disputes/SectionSlash';
import axios from 'axios';
import useSWR from 'swr';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {IconCopy} from '@yearn-finance/web-lib/icons/IconCopy';
import {copyToClipboard} from '@yearn-finance/web-lib/utils/helpers';

import type {ReactElement} from 'react';

const fetcher = async (url: string): Promise<any> => axios.get(url).then((res): any => res.data);

function	Disputes(): ReactElement {
	const {chainID} = useChainID();
	const {data: stats} = useSWR(`/api/dispute?chainID=${chainID}`, fetcher, {shouldRetryOnError: false});

	return (
		<main className={'col-span-12 mx-auto mb-10 mt-6 flex min-h-[100vh] w-full max-w-6xl flex-col px-4'}>
			<div className={'mb-14 grid grid-cols-1 gap-8 md:grid-cols-2'}>
				<div className={'flex flex-col space-y-12 pt-6'}>
					<SectionDispute chainID={chainID} />
					<SectionSlash chainID={chainID} />
					<SectionBlacklist chainID={chainID} />
				</div>
				<div className={'flex flex-col space-y-10 bg-white p-6'}>
					<div className={'flex flex-col'}>
						<h2 className={'mb-4 text-xl font-bold'}>{'DISPUTERS'}</h2>
						<p>{'Disputers are governance-approved addresses with permission to dispute keepers or jobs that may have acted in bad faith. Once a dispute has started, a slasher will be in charge of evaluating what measures to take.'}</p>
						<div className={'flex flex-col space-y-4'}>
							{(stats?.disputers || []).map((s: string, i: number): ReactElement => (
								<div key={s} className={`flex flex-row space-x-2 ${i === 0 ? 'mt-6' : ''}`}>
									<code>{s}</code>
									<IconCopy
										onClick={(): void => copyToClipboard(s)}
										className={'h-6 w-6 cursor-pointer text-black'} />
								</div>
							))}
						</div>
					</div>
				
					<div className={'flex flex-col'}>
						<h2 className={'mb-4 text-xl font-bold'}>{'SLASHERS'}</h2>
						<p>{'Slashers are governance-approved addresses with permission to exercise last resort punishments over keepers and jobs that act in bad faith. '}</p>
						<div className={'flex flex-col space-y-4'}>
							{(stats?.slashers || []).map((s: string, i: number): ReactElement => (
								<div key={s} className={`flex flex-row space-x-2 ${i === 0 ? 'mt-6' : ''}`}>
									<code>{s}</code>
									<IconCopy
										onClick={(): void => copyToClipboard(s)}
										className={'h-6 w-6 cursor-pointer text-black'} />
								</div>
							))}
						</div>
					</div>

					<div className={'flex flex-col'}>
						<h2 className={'mb-4 text-xl font-bold'}>{'GOVERNANCE'}</h2>
						<p>{'Keep3r governance focus is mostly put on reviewing jobs. However, it can perform other tasks:'}</p>
						<ul>
							<li>{'- Manage slashers and disputers'}</li>
							<li>{'- Adjust protocol parameters'}</li>
							<li>{'- Manage approved liquidities'}</li>
							<li>{'- Force-mint credits to a job'}</li>
						</ul>
						<div className={'mt-6 flex flex-row space-x-2'}>
							<code className={'overflow-hidden text-ellipsis'}>{stats?.governance || '-'}</code>
							<IconCopy
								onClick={(): void => copyToClipboard(stats?.governance || '-')}
								className={'h-6 w-6 cursor-pointer text-black'} />
						</div>
					</div>
				</div>

				<div className={'col-span-2 mt-0 md:mt-8'}>
					<div className={'flex flex-col'}>
						<h2 className={'mb-4 text-xl font-bold'}>{'HISTORY'}</h2>
						<LogsDispute chainID={chainID} />
					</div>
				</div>
			</div>
		</main>
	);
}
	
export default Disputes;
