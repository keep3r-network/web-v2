/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {useEffect, useMemo, useState} from 'react';
import {usePagination, useSortBy, useTable} from 'react-table';
import Link from 'next/link';
import IconChevronFilled from 'components/icons/IconChevronFilled';
import IconLoader from 'components/icons/IconLoader';
import {getEnv} from 'utils/env';
import REGISTRY from 'utils/registry';
import axios from 'axios';
import {IconChevron} from '@yearn-finance/web-lib/icons/IconChevron';
import {IconLinkOut} from '@yearn-finance/web-lib/icons/IconLinkOut';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {formatToNormalizedValue, toBigInt} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import {formatDate} from '@yearn-finance/web-lib/utils/format.time';
import {performBatchedUpdates} from '@yearn-finance/web-lib/utils/performBatchedUpdates';

import type {ReactElement, ReactNode} from 'react';
import type {TRegistry} from 'utils/registry';

type TLogs = {
	time: number,
	txHash: string,
	job: string,
	keeper: string,
	earned: string,
	fees: string,
	gwei: string,
	normalizedKp3rPrice: number
}
type TWorkLogs = {
	keeperAddress: string,
	searchTerm: string,
	chainID: number
}

function LogsStatsForKeeper({keeperAddress, searchTerm, chainID}: TWorkLogs): ReactElement {
	const [selectedExplorer, set_selectedExplorer] = useState(getEnv(chainID).EXPLORER);
	const [isInit, set_isInit] = useState(false);
	const [logs, set_logs] = useState<TLogs[]>([]);
	const chainRegistry = useMemo((): TRegistry => {
		const _registry: TRegistry = {};
		for (const r of Object.values(REGISTRY[chainID] || {})) {
			_registry[r.address] = r;
		}
		return _registry;
	}, [chainID]);

	useEffect((): void => {
		axios.get(`${getEnv(chainID).BACKEND_URI}/keeper/${toAddress(keeperAddress)}`)
			.then((_logs): void => {
				performBatchedUpdates((): void => {
					set_logs(_logs.data || []);
					set_isInit(true);
				});
			})
			.catch((): void => set_isInit(true));
	}, [keeperAddress, chainID]);

	useEffect((): void => {
		set_selectedExplorer(getEnv(chainID).EXPLORER);
	}, [chainID]);

	const data = useMemo((): unknown[] => (
		logs
			.filter((log): boolean => (
				(log.job).toLowerCase()?.includes(searchTerm.toLowerCase())
				|| (chainRegistry[toAddress(log.job)]?.name || '').toLowerCase()?.includes(searchTerm.toLowerCase())
			))
			.map((log): unknown => ({
				date: formatDate(Number(log.time) * 1000, true),
				jobName: chainRegistry[toAddress(log.job)]?.name || 'Unverified Job',
				earnedKp3r: formatToNormalizedValue(toBigInt(log.earned), 18),
				earnedUsd: formatToNormalizedValue(toBigInt(log.earned), 18),
				fees: formatToNormalizedValue(toBigInt(log.fees), 18),
				gweiPerCall: formatToNormalizedValue(toBigInt(log.gwei), 9),
				linkOut: log.job
			}))
	), [logs, searchTerm, chainRegistry]);

	const columns = useMemo((): unknown[] => [
		{Header: 'Date', accessor: 'date', className: 'pr-8'},
		{Header: 'Job name', accessor: 'jobName', className: 'cell-end pr-8', sortType: 'basic'},
		{
			Header: 'Earned, KP3R',
			accessor: 'earnedKp3r',
			className: 'cell-end pr-8',
			sortType: 'basic',
			Cell: ({value}: {value: number}): ReactNode => formatAmount(value, 6)
		},
		{
			Header: 'Earned, $',
			accessor: 'earnedUsd',
			className: 'cell-end pr-8',
			sortType: 'basic',
			Cell: ({value}: {value: number}): ReactNode => formatAmount(value, 2, 2)
		},
		{
			Header: 'TX fees, ETH',
			accessor: 'fees',
			className: 'cell-end pr-8',
			sortType: 'basic',
			Cell: ({value}: {value: number}): ReactNode => formatAmount(value, 6)
		},
		{
			Header: 'GWEI per call',
			accessor: 'gweiPerCall',
			className: 'cell-end pr-6',
			sortType: 'basic',
			Cell: ({value}: {value: number}): ReactNode => formatAmount(value, 6)
		},
		{
			Header: '',
			accessor: 'linkOut',
			className: 'cell-end',
			disableSortBy: true,
			Cell: ({value}: {value: string}): ReactNode => (
				<div
					role={'button'}
					onClick={(event: any): void => {
						event.stopPropagation();
						window.open(`https://${selectedExplorer}/address/${value}`, '_blank');
					}}>
					<a
						href={`https://${selectedExplorer}/address/${value}`}
						target={'_blank'}
						rel={'noopener noreferrer'}>
						<IconLinkOut className={'h-6 w-6 cursor-pointer text-black'} />
					</a>
				</div>
			)
		}
	], [selectedExplorer]);

	const {
		getTableProps,
		getTableBodyProps,
		headerGroups,
		prepareRow,
		page,
		canPreviousPage,
		canNextPage,
		pageOptions,
		nextPage,
		previousPage,
		state: {pageIndex}
	} = useTable({columns, data, initialState: {pageSize: 50}}, useSortBy, usePagination);
	
	function renderPreviousChevron(): ReactElement {
		if (!canPreviousPage) {
			return (<IconChevron className={'h-4 w-4 cursor-not-allowed opacity-50'} />);
		}
		return (
			<IconChevron
				className={'h-4 w-4 cursor-pointer'}
				onClick={previousPage} />
		);
	}

	function renderNextChevron(): ReactElement {
		if (!canNextPage) {
			return (<IconChevron className={'h-4 w-4 rotate-180 cursor-not-allowed opacity-50'} />);
		}
		return (
			<IconChevron
				className={'h-4 w-4 rotate-180 cursor-pointer'}
				onClick={nextPage} />
		);
	}

	
	if (!isInit || logs.length === 0) {
		return (
			<div className={'flex h-full min-h-[112px] items-center justify-center'}>
				<IconLoader className={'h-6 w-6 animate-spin'} />
			</div>
		);
	}

	return (
		<div className={'flex w-full flex-col overflow-x-scroll'}>
			<table
				{...getTableProps()}
				className={'min-w-full overflow-x-scroll'}>
				<thead>
					{headerGroups.map((headerGroup: any): ReactElement => (
						<tr key={headerGroup.getHeaderGroupProps().key} {...headerGroup.getHeaderGroupProps()}>
							{headerGroup.headers.map((column: any): ReactElement => (
								<th
									key={column.getHeaderProps().key}
									{...column.getHeaderProps(column.getSortByToggleProps([
										{
											className: 'pt-2 pb-8 text-left text-base font-bold whitespace-pre'
										}
									]))}>
									<div className={`flex flex-row items-center ${column.className}`}>
										{column.render('Header')}
										{column.canSort ? (
											<div className={'ml-1'}>
												{column.isSorted
													? column.isSortedDesc
														? <IconChevronFilled className={'h-4 w-4 cursor-pointer text-neutral-500'} />
														: <IconChevronFilled className={'h-4 w-4 rotate-180 cursor-pointer text-neutral-500'} />
													: <IconChevronFilled className={'h-4 w-4 cursor-pointer text-neutral-300 transition-colors hover:text-neutral-500'} />}
											</div>
										) : null}
									</div>
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody {...getTableBodyProps()}>
					{page.map((row: any): ReactElement => {
						prepareRow(row);
						return (
							<Link
								legacyBehavior
								key={row.getRowProps().key}
								href={`/jobs/${chainID}/${row.values.linkOut}`}>
								<tr {...row.getRowProps()} className={'cursor-pointer transition-colors hover:bg-white'}>
									{row.cells.map((cell: any): ReactElement => {
										return (
											<td
												key={cell.getCellProps().key}
												{...cell.getCellProps([
													{
														className: `pt-2 pb-6 text-base font-mono whitespace-pre ${cell.column.className}`,
														style: cell.column.style
													}
												])
												}>
												{cell.render('Cell')}
											</td>
										);
									})}
								</tr>
							</Link>
						);
					})}
				</tbody>
			</table>
			{canPreviousPage || canNextPage ? (
				<div className={'flex flex-row items-center justify-end space-x-2 p-4'}>
					{renderPreviousChevron()}
					<p className={'select-none text-sm tabular-nums'}>
						{`${pageIndex + 1}/${pageOptions.length}`}
					</p>
					{renderNextChevron()}
				</div>
			) : null}
		</div>
	);
}

export default LogsStatsForKeeper;
