import React, {useEffect, useMemo, useState} from 'react';
import Image from 'next/image';
import LogoConvex from 'components/icons/LogoConvex';
import LogoETH from 'components/icons/LogoETH';
import LogoYearn from 'components/icons/LogoYearn';
import {useTreasury} from 'contexts/useTreasury';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';

import type {ReactElement} from 'react';

function	Treasury(): ReactElement {
	const	{treasury} = useTreasury();
	const	[tvlUSD, set_tvlUSD] = useState<number>(0);

	useEffect((): void => {
		const totalUSD = treasury.reduce((acc, curr): number => acc + (curr.name.startsWith('ib') ? 0 : curr.tokenStakedUSD), 0);
		set_tvlUSD(totalUSD);
	}, [treasury]);

	const ethTreasury = useMemo((): any => treasury.find((t): boolean => t.protocol === 'ETH'), [treasury]);

	return (
		<>
			<section aria-label={'general statistics'} className={'mb-6 bg-grey-3'}>
				<div className={'flex items-center justify-center py-6 px-4 md:px-0'}>
					<div className={'space-y-2 text-center'}>
						<p>{'TVL'}</p>
						<div>
							<b className={'text-2xl'}>
								{`$ ${tvlUSD === 0 ? '0.00' : formatAmount(tvlUSD, 2, 2)}`}
							</b>
						</div>
					</div>
				</div> 
			</section>
			<main className={'col-span-12 mx-auto mb-10 flex min-h-[100vh] w-full max-w-6xl flex-col px-4'}>
				<div className={'flex flex-col space-y-6'}>
					{
						ethTreasury ?
							<div className={'bg-white p-6'}>
								<div className={'mt-2 flex items-center space-x-2'}>
									<LogoETH />
									<h3 className={'text-2xl font-bold'}>{'ETH'}</h3>
								</div>
								<div className={'mt-6 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-3'}>
									<div>
										<p>{'Balance'}</p>
										<div className={'py-0 md:pt-2 md:pb-1'}>
											<b className={'text-2xl'}>{formatAmount(ethTreasury.tokenStaked, 2, 2)}</b>
										</div>
										<p className={'text-xs'}>{'ETH + wETH'}</p>
									</div>

									<div>
										<p>{'Balance, $'}</p>
										<div className={'py-0 md:pt-2 md:pb-1'}>
											<b className={'text-2xl'}>
												{formatAmount(ethTreasury.tokenStakedUSD, 2, 2)}
											</b>
										</div>
									</div>
								</div>
							</div> : <div />

					}
					{
						treasury
							.filter((t): boolean => t.tokenStakedUSD > 0)
							.filter((t): boolean => t.protocol !== 'ETH')
							.sort((a, b): number => b.tokenStakedUSD - a.tokenStakedUSD)
							.map((treasure): ReactElement => (
								<div key={treasure.name} className={'bg-white p-6'}>
									<p>{'Protocol'}</p>
									<div className={'mt-2 flex items-center space-x-2'}>
										{
											treasure.protocol === 'Convex' ?
												<LogoConvex /> :
												treasure.protocol === 'Yearn' ?
													<LogoYearn /> : 
													treasure.protocol === 'ETH' ?
														<LogoETH /> : 
														treasure.protocol === 'Curve' ?
															<Image
																alt={''}
																src={'/curveneutral.png'}
																width={32}
																height={32} /> : <div />
										}
										<h3 className={'text-2xl font-bold'}>{treasure.protocol}</h3>
									</div>
									<div className={'mt-6 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-3'}>
										<div>
											<p>{'Token staked'}</p>
											<div className={'py-0 md:pt-2 md:pb-1'}>
												<b className={'text-2xl'}>{formatAmount(treasure.tokenStaked, 2, 2)}</b>
											</div>
											<p className={'text-xs'}>{treasure.name}</p>
										</div>

										<div>
											<p>{'Token staked, $'}</p>
											<div className={'py-0 md:pt-2 md:pb-1'}>
												<b className={'text-2xl'}>
													{formatAmount(treasure.tokenStakedUSD, 2, 2)}
												</b>
											</div>
										</div>

										{treasure.hasNoRewards ? 
											<div /> :
											<>
												<div>
													<p>{'Unclaimed rewards, $'}</p>
													<div className={'py-0 md:pt-2 md:pb-1'}>
														<b className={'text-2xl'}>
															{formatAmount(treasure.unclaimedRewardsUSD, 2, 2)}
														</b>
													</div>
												</div>
											</>
										}
									</div>
								</div>
							))
					}
				</div>
			</main>
		</>
	);
}

export default Treasury;
