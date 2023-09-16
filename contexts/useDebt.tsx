import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import CY_TOKEN_ABI from 'utils/abi/cy.abi';
import LENS_PRICE_ABI from 'utils/abi/lens.abi';
import {getEnv} from 'utils/env';
import {readContracts} from 'wagmi';
import {decodeAsBigInt} from '@yearn-finance/web-lib/utils/decoder';
import {formatToNormalizedValue, toBigInt} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {performBatchedUpdates} from '@yearn-finance/web-lib/utils/performBatchedUpdates';

import type {ReactElement} from 'react';

export type	TDebt = {
	name: string;
	totalBorrowBalance: bigint;
	totalBorrowValue: number;
	borrowBalance: {[key: string]: {
		raw: bigint;
		normalized: number;
		normalizedValue: number;
	}};
}
type	TDebtContext = {
	debt: TDebt[],
}

const DebtContext = createContext<TDebtContext>({debt: []});
export const DebtContextApp = ({children}: {children: ReactElement}): ReactElement => {
	const [debt, set_debt] = useState<TDebt[]>([]);
	const [, set_nonce] = useState(0);

	const getDebt = useCallback(async (): Promise<void> => {
		const debts = await readContracts({
			contracts: [
				// Calls for cyAUDContract | Borrow balance stored for ibAMM and ibAMM2 then price
				{
					chainId: 1,
					abi: CY_TOKEN_ABI,
					address: getEnv(1).CY_AUD_TOKEN_ADDR,
					functionName: 'borrowBalanceStored',
					args: [getEnv(1).IB_AMM_ADDR]
				},
				{
					chainId: 1,
					abi: CY_TOKEN_ABI,
					address: getEnv(1).CY_AUD_TOKEN_ADDR,
					functionName: 'borrowBalanceStored',
					args: [getEnv(1).IB_AMM_2_ADDR]
				},
				{
					chainId: 1,
					abi: LENS_PRICE_ABI,
					address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030',
					functionName: 'getPriceUsdcRecommended',
					args: [getEnv(1).CY_AUD_TOKEN_ADDR]
				},
				// Calls for cyCHFContract | Borrow balance stored for ibAMM and ibAMM2 then price
				{
					chainId: 1,
					abi: CY_TOKEN_ABI,
					address: getEnv(1).CY_CHF_TOKEN_ADDR,
					functionName: 'borrowBalanceStored',
					args: [getEnv(1).IB_AMM_ADDR]
				},
				{
					chainId: 1,
					abi: CY_TOKEN_ABI,
					address: getEnv(1).CY_CHF_TOKEN_ADDR,
					functionName: 'borrowBalanceStored',
					args: [getEnv(1).IB_AMM_2_ADDR]
				},
				{
					chainId: 1,
					abi: LENS_PRICE_ABI,
					address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030',
					functionName: 'getPriceUsdcRecommended',
					args: [getEnv(1).CY_CHF_TOKEN_ADDR]
				},
				// Calls for cyGBPContract | Borrow balance stored for ibAMM and ibAMM2 then price
				{
					chainId: 1,
					abi: CY_TOKEN_ABI,
					address: getEnv(1).CY_GBP_TOKEN_ADDR,
					functionName: 'borrowBalanceStored',
					args: [getEnv(1).IB_AMM_ADDR]
				},
				{
					chainId: 1,
					abi: CY_TOKEN_ABI,
					address: getEnv(1).CY_GBP_TOKEN_ADDR,
					functionName: 'borrowBalanceStored',
					args: [getEnv(1).IB_AMM_2_ADDR]
				},
				{
					chainId: 1,
					abi: LENS_PRICE_ABI,
					address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030',
					functionName: 'getPriceUsdcRecommended',
					args: [getEnv(1).CY_GBP_TOKEN_ADDR]
				},
				// Calls for cyJPYContract | Borrow balance stored for ibAMM and ibAMM2 then price
				{
					chainId: 1,
					abi: CY_TOKEN_ABI,
					address: getEnv(1).CY_JPY_TOKEN_ADDR,
					functionName: 'borrowBalanceStored',
					args: [getEnv(1).IB_AMM_ADDR]
				},
				{
					chainId: 1,
					abi: CY_TOKEN_ABI,
					address: getEnv(1).CY_JPY_TOKEN_ADDR,
					functionName: 'borrowBalanceStored',
					args: [getEnv(1).IB_AMM_2_ADDR]
				},
				{
					chainId: 1,
					abi: LENS_PRICE_ABI,
					address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030',
					functionName: 'getPriceUsdcRecommended',
					args: [getEnv(1).CY_JPY_TOKEN_ADDR]
				},
				// Calls for cyEURContract | Borrow balance stored for ibAMM and ibAMM2 then price
				{
					chainId: 1,
					abi: CY_TOKEN_ABI,
					address: getEnv(1).CY_EUR_TOKEN_ADDR,
					functionName: 'borrowBalanceStored',
					args: [getEnv(1).IB_AMM_ADDR]
				},
				{
					chainId: 1,
					abi: CY_TOKEN_ABI,
					address: getEnv(1).CY_EUR_TOKEN_ADDR,
					functionName: 'borrowBalanceStored',
					args: [getEnv(1).IB_AMM_2_ADDR]
				},
				{
					chainId: 1,
					abi: LENS_PRICE_ABI,
					address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030',
					functionName: 'getPriceUsdcRecommended',
					args: [getEnv(1).CY_EUR_TOKEN_ADDR]
				},
				// Calls for cyKRWContract | Borrow balance stored for ibAMM and ibAMM2 then price
				{
					chainId: 1,
					abi: CY_TOKEN_ABI,
					address: getEnv(1).CY_KRW_TOKEN_ADDR,
					functionName: 'borrowBalanceStored',
					args: [getEnv(1).IB_AMM_ADDR]
				},
				{
					chainId: 1,
					abi: CY_TOKEN_ABI,
					address: getEnv(1).CY_KRW_TOKEN_ADDR,
					functionName: 'borrowBalanceStored',
					args: [getEnv(1).IB_AMM_2_ADDR]
				},
				{
					chainId: 1,
					abi: LENS_PRICE_ABI,
					address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030',
					functionName: 'getPriceUsdcRecommended',
					args: [getEnv(1).CY_KRW_TOKEN_ADDR]
				},
				// Calls for cyZARContract | Borrow balance stored for ibAMM and ibAMM2 then price
				{
					chainId: 1,
					abi: CY_TOKEN_ABI,
					address: getEnv(1).CY_ZAR_TOKEN_ADDR,
					functionName: 'borrowBalanceStored',
					args: [getEnv(1).IB_AMM_ADDR]
				},
				{
					chainId: 1,
					abi: CY_TOKEN_ABI,
					address: getEnv(1).CY_ZAR_TOKEN_ADDR,
					functionName: 'borrowBalanceStored',
					args: [getEnv(1).IB_AMM_2_ADDR]
				},
				{
					chainId: 1,
					abi: LENS_PRICE_ABI,
					address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030',
					functionName: 'getPriceUsdcRecommended',
					args: [getEnv(1).CY_ZAR_TOKEN_ADDR]
				}
			]
		});
		const _debt: TDebt[] = [];
		const ibs = ['ibAUD', 'ibCHF', 'ibGBP', 'ibJPY', 'ibEUR', 'ibKRW', 'ibZAR'];
		let	rIndex = 0;
		for (const ib of ibs) {
			const ibAMMDebt = decodeAsBigInt(debts[rIndex++]);
			const ibAMM2Debt = decodeAsBigInt(debts[rIndex++]);
			const rawPrice = decodeAsBigInt(debts[rIndex++]);

			const totalBorrowBalance = toBigInt(ibAMMDebt) + toBigInt(ibAMM2Debt);
			const normalizedPrice = formatToNormalizedValue(rawPrice, 4);
			_debt.push({
				name: ib,
				totalBorrowBalance: totalBorrowBalance,
				totalBorrowValue: formatToNormalizedValue(totalBorrowBalance, 18) * normalizedPrice,
				borrowBalance: {
					[getEnv(1).IB_AMM_ADDR]: {
						raw: ibAMMDebt,
						normalized: formatToNormalizedValue(ibAMMDebt, 18),
						normalizedValue: formatToNormalizedValue(ibAMMDebt, 18) * normalizedPrice
					},
					[getEnv(1).IB_AMM_2_ADDR]: {
						raw: ibAMM2Debt,
						normalized: formatToNormalizedValue(ibAMM2Debt, 18),
						normalizedValue: formatToNormalizedValue(ibAMM2Debt, 18) * normalizedPrice
					}
				}
			});
		}

		performBatchedUpdates((): void => {
			set_debt(_debt);
			set_nonce((n: number): number => n + 1);
		});
	}, []);

	useEffect((): void => {
		getDebt();
	}, [getDebt]);

	return (
		<DebtContext.Provider value={{debt}}>
			{children}
		</DebtContext.Provider>
	);
};


export const useDebt = (): TDebtContext => useContext(DebtContext);
export default useDebt;

