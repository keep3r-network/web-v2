import React, {ReactElement, useEffect, useState} from 'react';
import {format, truncateHex} from '@yearn-finance/web-lib/utils';
import {useDebt} from 'contexts/useDebt';
import useSWR from 'swr';
import axios from 'axios';

const	fetcher = async (url: string): Promise<any> => axios.get(url).then((res): any => res.data);

function	Debt(): ReactElement {
	const	{debt} = useDebt();
	const	[tvlUSD, set_tvlUSD] = useState<number>(0);

	const	{data: ibAPIData} = useSWR('https://api.ib.xyz/api/v1/itoken?comptroller=eth', fetcher);

	useEffect((): void => {
		const	totalUSD = debt.reduce((acc, curr): number => acc + curr.totalBorrowValue, 0);
		set_tvlUSD(totalUSD);
	}, [debt]);

	return (
		<>
			<section aria-label={'general statistics'} className={'mb-6 bg-grey-3'}>
				<div className={'flex items-center justify-center py-6 px-4 md:px-0'}>
					<div className={'space-y-2 text-center'}>
						<p>{'Debt'}</p>
						<div>
							<b className={'text-2xl tabular-nums'}>
								{`$ ${tvlUSD == 0 ? '0.00' : format.amount(tvlUSD, 2, 2)}`}
							</b>
						</div>
					</div>
				</div> 
			</section>
			<main className={'col-span-12 mx-auto mb-10 flex min-h-[100vh] w-full max-w-6xl flex-col px-4'}>
				<div className={'flex flex-col space-y-6'}>
					{
						debt
							.sort((a, b): number => b.totalBorrowValue - a.totalBorrowValue)
							.map((debt): ReactElement => {
								const	data = ibAPIData?.find((ib: any): boolean => ib.underlying_symbol.toLowerCase() === debt.name.toLowerCase());
								return (
									<div key={debt.name} className={'bg-white p-6 md:pt-6 md:pl-6 md:pr-10 md:pb-8'}>
										<p>{debt.name}</p>
										<div className={'mt-2 flex flex-row items-center space-x-10 md:space-x-10'}>
											<div className={'flex flex-col justify-center space-y-1'}>
												<h3 className={'text-2xl font-bold tabular-nums md:text-3xl'}>
													{format.amount(format.toNormalizedValue(debt.totalBorrowBalance, 18), 2, 2)}
												</h3>
												<p className={'text-sm md:text-base'}>
													{`$ ${format.amount(debt.totalBorrowValue, 2, 2)}`}
												</p>
											</div>
											<div className={'flex flex-col justify-center space-y-1'}>
												<h3 className={'text-2xl font-bold tabular-nums md:text-3xl'}>
													{`${format.amount((data?.borrow_apy?.value * 100) || 0, 2, 2)} %`}
												</h3>
												<p className={'text-sm md:text-base'}>
													{'Borrow APY'}
												</p>
											</div>
										</div>
										<div className={'mt-6 grid grid-cols-1 gap-6'}>
											<div className={'hidden grid-cols-5 md:grid'}>
												<b className={'col-span-3'}>{'Borrower'}</b>
												<b className={'text-right'}>{`Debt, ${debt.name}`}</b>
												<b className={'text-right'}>{'Debt, $'}</b>
											</div>

											{Object.entries(debt.borrowBalance).map(([borrower, balance]): ReactElement => (
												<div key={borrower} className={'grid grid-cols-1 md:grid-cols-5'}>
													<p className={'col-span-3 hidden underline md:block'}>{borrower}</p>
													<p className={'col-span-1 flex flex-row justify-between md:hidden'}>
														<span className={'block text-xs text-neutral-400 md:hidden'}>{'Borrower'}</span>
														{truncateHex(borrower, 6)}
													</p>
													<p className={'flex flex-row justify-between text-left md:block md:text-right'}>
														<span className={'block text-xs text-neutral-400 md:hidden'}>{`Debt, ${debt.name}`}</span>
														{format.amount(balance.normalized, 2, 2)}
													</p>
													<p className={'flex flex-row justify-between text-left md:block md:text-right'}>
														<span className={'block text-xs text-neutral-400 md:hidden'}>{'Debt, $'}</span>
														{format.amount(balance.normalizedValue, 2, 2)}
													</p>
												</div>
											))}
										</div>
									</div>
								);
							})
					}
				</div>
			</main>
		</>
	);
}

export default Debt;
