import React, {memo} from 'react';
import {Toaster} from 'react-hot-toast';
import {AppWithLayout} from 'components/AppWrapper';
import {DebtContextApp} from 'contexts/useDebt';
import {Keep3rContextApp} from 'contexts/useKeep3r';
import {PairsContextApp} from 'contexts/usePairs';
import {PricesContextApp} from 'contexts/usePrices';
import {TreasuryContextApp} from 'contexts/useTreasury';
import {SUPPORTED_CHAINS} from 'utils/constants';
import {WithYearn} from '@yearn-finance/web-lib/contexts/WithYearn';
import {localhost} from '@yearn-finance/web-lib/utils/wagmi/networks';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import	'../style.css';


const App = memo(function App(props: AppProps): ReactElement {
	const {Component, pageProps} = props;

	return (
		<PricesContextApp>
			<Keep3rContextApp>
				<PairsContextApp>
					<TreasuryContextApp>
						<DebtContextApp>
							<AppWithLayout
								Component={Component}
								pageProps={pageProps}
								router={props.router} />
						</DebtContextApp>
					</TreasuryContextApp>
				</PairsContextApp>
			</Keep3rContextApp>
		</PricesContextApp>
	);
});

/* 📰 - Keep3r *****************************************************************
** Context wrapper for our app.
** WithYearn handles the connection to the blockchain and the wallet.
** Keep3rContext handles some specific keep3r elements
** PairContext handles the data for the supported pairs by Keep3r
** Treasury handles the info needed for the treasury page
******************************************************************************/
function MyApp(props: AppProps): ReactElement {
	const toasterOptions = {
		success: {
			iconTheme: {
				primary: 'black',
				secondary: 'white'
			}
		},
		error: {
			iconTheme: {
				primary: 'black',
				secondary: 'white'
			}
		},
		className: 'text-sm text-neutral-0',
		style: {borderRadius: '0', maxWidth: 500}
	};
	
	return (
		<main id={'main'}>
			<Toaster
				position={'bottom-right'}
				containerClassName={'!z-[1000000]'}
				containerStyle={{zIndex: 1000000}}
				toastOptions={toasterOptions} />
			<WithYearn supportedChains={[...SUPPORTED_CHAINS, localhost]}>
				<App {...props} />
			</WithYearn>
		</main>
	);
}

export default MyApp;
