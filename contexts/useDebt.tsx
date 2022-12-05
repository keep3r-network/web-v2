import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {Contract} from 'ethcall';
import CY_TOKEN_ABI from 'utils/abi/cy.abi';
import LENS_PRICE_ABI from 'utils/abi/lens.abi';
import {getEnv} from 'utils/env';
import {format, performBatchedUpdates, providers} from '@yearn-finance/web-lib/utils';

import type {BigNumber} from 'ethers';
import type {ReactElement} from 'react';

export type	TDebt = {
	name: string;
	totalBorrowBalance: BigNumber;
	totalBorrowValue: number;
	borrowBalance: {[key: string]: {
		raw: BigNumber;
		normalized: number;
		normalizedValue: number;
	}};
}
type	TDebtContext = {
	debt: TDebt[],
}

const	DebtContext = createContext<TDebtContext>({debt: []});
export const DebtContextApp = ({children}: {children: ReactElement}): ReactElement => {
	const	[debt, set_debt] = useState<TDebt[]>([]);
	const	[, set_nonce] = useState(0);

	const getDebt = useCallback(async (): Promise<void> => {
		const	currentProvider = providers.getProvider(1);
		const	ethcallProvider = await providers.newEthCallProvider(currentProvider);
		const	lensPriceContract = new Contract('0x83d95e0D5f402511dB06817Aff3f9eA88224B030', LENS_PRICE_ABI);
		const	cyAUDContract = new Contract(getEnv(1).CY_AUD_TOKEN_ADDR, CY_TOKEN_ABI);
		const	cyCHFContract = new Contract(getEnv(1).CY_CHF_TOKEN_ADDR, CY_TOKEN_ABI);
		const	cyGBPContract = new Contract(getEnv(1).CY_GBP_TOKEN_ADDR, CY_TOKEN_ABI);
		const	cyJPYContract = new Contract(getEnv(1).CY_JPY_TOKEN_ADDR, CY_TOKEN_ABI);
		const	cyEURContract = new Contract(getEnv(1).CY_EUR_TOKEN_ADDR, CY_TOKEN_ABI);
		const	cyKRWContract = new Contract(getEnv(1).CY_KRW_TOKEN_ADDR, CY_TOKEN_ABI);
		const	cyZARContract = new Contract(getEnv(1).CY_ZAR_TOKEN_ADDR, CY_TOKEN_ABI);
		const	debtCalls = [
			cyAUDContract.borrowBalanceStored(getEnv(1).IB_AMM_ADDR),
			cyAUDContract.borrowBalanceStored(getEnv(1).IB_AMM_2_ADDR),
			lensPriceContract.getPriceUsdcRecommended(getEnv(1).CY_AUD_TOKEN_ADDR),

			cyCHFContract.borrowBalanceStored(getEnv(1).IB_AMM_ADDR),
			cyCHFContract.borrowBalanceStored(getEnv(1).IB_AMM_2_ADDR),
			lensPriceContract.getPriceUsdcRecommended(getEnv(1).CY_CHF_TOKEN_ADDR),

			cyGBPContract.borrowBalanceStored(getEnv(1).IB_AMM_ADDR),
			cyGBPContract.borrowBalanceStored(getEnv(1).IB_AMM_2_ADDR),
			lensPriceContract.getPriceUsdcRecommended(getEnv(1).CY_GBP_TOKEN_ADDR),

			cyJPYContract.borrowBalanceStored(getEnv(1).IB_AMM_ADDR),
			cyJPYContract.borrowBalanceStored(getEnv(1).IB_AMM_2_ADDR),
			lensPriceContract.getPriceUsdcRecommended(getEnv(1).CY_JPY_TOKEN_ADDR),

			cyEURContract.borrowBalanceStored(getEnv(1).IB_AMM_ADDR),
			cyEURContract.borrowBalanceStored(getEnv(1).IB_AMM_2_ADDR),
			lensPriceContract.getPriceUsdcRecommended(getEnv(1).CY_EUR_TOKEN_ADDR),

			cyKRWContract.borrowBalanceStored(getEnv(1).IB_AMM_ADDR),
			cyKRWContract.borrowBalanceStored(getEnv(1).IB_AMM_2_ADDR),
			lensPriceContract.getPriceUsdcRecommended(getEnv(1).CY_KRW_TOKEN_ADDR),

			cyZARContract.borrowBalanceStored(getEnv(1).IB_AMM_ADDR),
			cyZARContract.borrowBalanceStored(getEnv(1).IB_AMM_2_ADDR),
			lensPriceContract.getPriceUsdcRecommended(getEnv(1).CY_ZAR_TOKEN_ADDR)
		];
		const	debts = await ethcallProvider.tryAll(debtCalls) as BigNumber[];
		const	_debt: TDebt[] = [];

		const	ibs = ['ibAUD', 'ibCHF', 'ibGBP', 'ibJPY', 'ibEUR', 'ibKRW', 'ibZAR'];
		let	rIndex = 0;
		for (const ib of ibs) {
			const	ibAMMDebt = debts[rIndex++];
			const	ibAMM2Debt = debts[rIndex++];
			const	rawPrice = debts[rIndex++];

			const	totalBorrowBalance = ibAMMDebt.add(ibAMM2Debt);
			const	normalizedPrice = format.toNormalizedValue(rawPrice, 4);
			_debt.push({
				name: ib,
				totalBorrowBalance: totalBorrowBalance,
				totalBorrowValue: format.toNormalizedValue(totalBorrowBalance, 18) * normalizedPrice,
				borrowBalance: {
					[getEnv(1).IB_AMM_ADDR]: {
						raw: ibAMMDebt,
						normalized: format.toNormalizedValue(ibAMMDebt, 18),
						normalizedValue: format.toNormalizedValue(ibAMMDebt, 18) * normalizedPrice
					},
					[getEnv(1).IB_AMM_2_ADDR]: {
						raw: ibAMM2Debt,
						normalized: format.toNormalizedValue(ibAMM2Debt, 18),
						normalizedValue: format.toNormalizedValue(ibAMM2Debt, 18) * normalizedPrice
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

