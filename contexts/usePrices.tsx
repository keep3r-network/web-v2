import React, {createContext, useContext, useEffect, useState} from 'react';
import axios from 'axios';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {useLocalStorage} from '@yearn-finance/web-lib/hooks/useLocalStorage';

import type {ReactElement} from 'react';
import type * as usePricesTypes from './usePrices.d';

const	PricesContext = createContext<usePricesTypes.TPricesContext>({prices: {}});
export const PricesContextApp = ({children}: {children: ReactElement}): React.ReactElement => {
	const	{chainID} = useChainID();
	const	[nonce, set_nonce] = useState(0);
	const	[prices, set_prices] = useLocalStorage('prices', {}) as [
		usePricesTypes.TPriceElement,
		(prices: usePricesTypes.TPriceElement) => void
	];

	/**************************************************************************
	**	Fetch the prices of the list of CG_TOKENS
	**************************************************************************/
	useEffect((): void => {
		axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${process.env.CG_IDS}&vs_currencies=usd,eth`).then(({data}): void => {
			set_prices(data);
			set_nonce(nonce + 1);
		});
	}, [chainID]);

	return (
		<PricesContext.Provider value={{prices}}>
			{children}
		</PricesContext.Provider>
	);
};

export const usePrices = (): usePricesTypes.TPricesContext => useContext(PricesContext);
export default usePrices;
