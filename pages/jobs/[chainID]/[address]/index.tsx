import React, {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import IconBadgeCheck from 'components/icons/IconBadgeCheck';
import {ModalMigrate} from 'components/modals/ModalMigrate';
import SectionActions from 'components/sections/jobs/SectionActions';
import SectionDocumentation from 'components/sections/jobs/SectionDocumentation';
import SectionStatus from 'components/sections/jobs/SectionStatus';
import {useJob} from 'contexts/useJob';
import {getEnv} from 'utils/env';
import axios from 'axios';
import useSWR from 'swr';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {IconCopy} from '@yearn-finance/web-lib/icons/IconCopy';
import {IconLinkOut} from '@yearn-finance/web-lib/icons/IconLinkOut';
import {IconSocialGithub} from '@yearn-finance/web-lib/icons/IconSocialGithub';
import {toAddress, truncateHex} from '@yearn-finance/web-lib/utils/address';
import {copyToClipboard} from '@yearn-finance/web-lib/utils/helpers';

import type {ReactElement} from 'react';

const fetcher = async (url: string): Promise<any> => axios.get(url).then((res): any => res.data);

function	StatsJob(): ReactElement {
	const router = useRouter();
	const {jobStatus} = useJob();
	const {data: stats} = useSWR(
		router?.query?.address && router.query.chainID ? `/api/jobs?&address=${router?.query?.address}&chainID=${router.query.chainID}` : null,
		fetcher,
		{shouldRetryOnError: false}
	);

	const chainID = useMemo((): number => {
		let	currentChainID = parseInt(router?.query?.chainID as string, 10);
		if (currentChainID === undefined || currentChainID === null || isNaN(Number(currentChainID))) {
			currentChainID = 1;
		}
		return currentChainID;
	}, [router?.query?.chainID]);

	const [isModalMigrateOpen, set_isModalMigrateOpen] = useState(false);
	const [selectedExplorer, set_selectedExplorer] = useState(getEnv(chainID).EXPLORER);

	useEffect((): void => {
		set_selectedExplorer(getEnv(chainID).EXPLORER);
	}, [chainID]);

	const Keep3rButton = Button as any;
	return (
		<main className={'col-span-12 mx-auto mb-10 mt-6 flex min-h-[100vh] w-full max-w-6xl flex-col px-4'}>
			<div className={'mb-6 flex flex-row items-center space-x-2'}>
				<p>
					<Link href={'/'}>{'Jobs / '}</Link>
					<b>{stats?.shortName || ''}</b>
				</p>
			</div>

			<div className={'mb-12 grid grid-cols-1 gap-4 md:grid-cols-2'}>
				<div className={'grid grid-cols-1 gap-4'}>
					<div className={'flex flex-col bg-white p-6'}>
						<div className={'mb-2 flex flex-row items-center space-x-4'}>
							<h2 className={'text-2xl font-bold'}>
								{stats?.name || ''}
							</h2>
							{stats?.isVerified ? <IconBadgeCheck className={'h-6 w-6'} /> : null}
						</div>

						<div className={'flex flex-row items-center space-x-2'}>
							<b>{truncateHex(stats?.job || '', 5)}</b>
							<div><IconCopy onClick={(): void => copyToClipboard(stats?.job || '')} className={'h-4 w-4 cursor-pointer text-black'} /></div>
							<div>
								<a
									href={`https://${selectedExplorer}/address/${stats?.job || ''}`}
									target={'_blank'}
									rel={'noopener noreferrer'}>
									<IconLinkOut className={'h-4 w-4 cursor-pointer text-black'} />
								</a>
							</div>
							<div>
								{stats?.repository ? (
									<a
										href={stats?.repository}
										target={'_blank'}
										rel={'noopener noreferrer'}>
										<IconSocialGithub className={'ml-0.5 h-4 w-4 cursor-pointer text-black'} />
									</a>
								) : null}
							</div>
						</div>
					</div>
					<SectionStatus chainID={chainID} />
				</div>
				<div className={'flex flex-col space-y-4'}>
					<div className={'bg-white'}>
						<SectionActions chainID={chainID} />
					</div>
					<div>
						<div className={'flex-center flex h-full justify-center space-x-4 bg-white px-8 py-6'}>
							<div className={'w-1/2'}>
								<Keep3rButton
									onClick={(): void => set_isModalMigrateOpen(true)}
									variant={'reverted'}>
									{'Migrate'}
								</Keep3rButton>
							</div>
							<div className={'w-1/2'}>
								<Link href={`/jobs/${chainID}/${toAddress(jobStatus.address)}/calls`}>
									<Keep3rButton variant={'reverted'}>{'View calls'}</Keep3rButton>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>

			<SectionDocumentation />

			<ModalMigrate
				currentAddress={toAddress(jobStatus.address)}
				chainID={chainID}
				isOpen={isModalMigrateOpen}
				onClose={(): void => set_isModalMigrateOpen(false)} />
		</main>
	);
}

export default StatsJob;
