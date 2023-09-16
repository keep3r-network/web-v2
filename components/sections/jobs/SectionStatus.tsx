import React from 'react';
import {useJob} from 'contexts/useJob';
import {usePrices} from 'contexts/usePrices';
import {getEnv} from 'utils/env';
import {IconCopy} from '@yearn-finance/web-lib/icons/IconCopy';
import {IconLinkOut} from '@yearn-finance/web-lib/icons/IconLinkOut';
import {truncateHex} from '@yearn-finance/web-lib/utils/address';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import {copyToClipboard} from '@yearn-finance/web-lib/utils/helpers';

import type {ReactElement} from 'react';

function	SectionStatus({chainID}: {chainID: number}): ReactElement {
	const {jobStatus} = useJob();
	const {prices} = usePrices();

	return (
		<div className={'flex flex-col space-y-6 bg-white p-6'}>
			<b className={'text-xl'}>{'STATUS'}</b>
			<div className={'space-y-2'}>
				<b>{'Credits'}</b>
				<dl className={'space-y-2'}>
					<div className={'flex flex-row'}>
						<dt className={'w-1/2'}>{'Current credits, KP3R'}</dt>
						<dd>
							{!jobStatus.isLoaded ? '-' : formatAmount(jobStatus?.jobLiquidityCredits.normalized, 2, 2)}
						</dd>
					</div>
					<div className={'flex flex-row'}>
						<dt className={'w-1/2'}>{'Pending credits, KP3R'}</dt>
						<dd>
							{!jobStatus.isLoaded ? '-' : formatAmount(jobStatus?.totalJobCredits.normalized, 2, 2)}
						</dd>
					</div>
					<div className={'flex flex-row'}>
						<dt className={'w-1/2'}>{'Per call, KP3R'}</dt>
						<dd>
							{!jobStatus.isLoaded ? '-' : formatAmount(jobStatus?.averageEarned || 0, 6, 6)}
						</dd>
					</div>
					<div className={'flex flex-row'}>
						<dt className={'w-1/2'}>{'Refill schedule, KP3R/Days'}</dt>
						<dd>
							{!jobStatus.isLoaded ? '-' : formatAmount(Number(jobStatus?.jobPeriodCredits.normalized) / 5, 6, 6)}
						</dd>
					</div>
				</dl>
			</div>

			<div className={'space-y-2'}>
				<b>{'Liquidity'}</b>
				<dl className={'space-y-2'}>
					<div className={'flex flex-row'}>
						<dt className={'w-1/2'}>{'Total, kLP-KP3R/WETH'}</dt>
						<dd>
							{!jobStatus.isLoaded ? '-' : formatAmount(jobStatus?.liquidityAmount.normalized, 2, 2)}
						</dd>
					</div>
				</dl>
			</div>

			<div className={'space-y-2'}>
				<b>{'Function calls'}</b>
				<dl className={'space-y-2'}>
					<div className={'flex flex-row'}>
						<dt className={'w-1/2'}>{'Total, #'}</dt>
						<dd>
							{!jobStatus.isLoaded ? '-' : jobStatus?.workDone || 0}
						</dd>
					</div>
					<div className={'flex flex-row'}>
						<dt className={'w-1/2'}>{'Per day, #'}</dt>
						<dd>
							{!jobStatus.isLoaded ? '-' : formatAmount(jobStatus?.averageWorkDonePerDay || 0, 2, 2)}
						</dd>
					</div>
					<div className={'flex flex-row'}>
						<dt className={'w-1/2'}>{'Last'}</dt>
						<dd>
							{!jobStatus.isLoaded ? '-' : jobStatus?.lastWork || 0}
						</dd>
					</div>
				</dl>
			</div>

			<div className={'space-y-2'}>
				<b>{'Fees'}</b>
				<dl className={'space-y-2'}>
					<div className={'flex flex-row'}>
						<dt className={'w-1/2'}>{'Total, $'}</dt>
						<dd>
							{!jobStatus.isLoaded ? '-' : formatAmount((jobStatus?.totalFees || 0) * Number(prices?.ethereum?.usd || 0), 2, 2)}
						</dd>
					</div>
					<div className={'flex flex-row'}>
						<dt className={'w-1/2'}>{'Per call, $'}</dt>
						<dd>
							{!jobStatus.isLoaded ? '-' : formatAmount((jobStatus?.averageFees || 0) * Number(prices?.ethereum?.usd || 0), 2, 2)}
						</dd>
					</div>
				</dl>
			</div>

			<div className={'space-y-2'}>
				<b>{'Keepers'}</b>
				<dl className={'space-y-2'}>
					<div className={'flex flex-row'}>
						<dt className={'w-1/2'}>{'Active keepers, #'}</dt>
						<dd>
							{!jobStatus.isLoaded ? '-' : formatAmount(jobStatus?.uniqueKeepers || 0, 0, 0)}
						</dd>
					</div>
					<div className={'flex flex-row'}>
						<dt className={'w-1/2'}>{'Calls per keeper, #'}</dt>
						<dd>
							{!jobStatus.isLoaded ? '-' : formatAmount(jobStatus?.workPerKeeper || 0, 2, 2)}
						</dd>
					</div>
				</dl>
			</div>

			<div>
				<dl>
					<div className={'flex flex-row'}>
						<dt className={'w-1/2'}>{'Owner'}</dt>
						<dd className={'flex flex-row items-center space-x-2'}>
							<b>{jobStatus?.jobOwner ? truncateHex(jobStatus?.jobOwner, 5) : '-'}</b>
							<div><IconCopy onClick={(): void => copyToClipboard(jobStatus?.jobOwner || '-')} className={'h-6 w-6 cursor-pointer text-black'} /></div>
							<div>
								<a
									href={`https://${getEnv(chainID).EXPLORER}/address/${jobStatus.jobOwner}`}
									target={'_blank'}
									rel={'noopener noreferrer'}>
									<IconLinkOut className={'h-6 w-6 cursor-pointer text-black'} />
								</a>
							</div>
						</dd>
					</div>
				</dl>
			</div>
		</div>
	);
}

export default SectionStatus;
