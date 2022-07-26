import	React, {ReactElement}				from	'react';
import	{Toaster}							from	'react-hot-toast';
import	Link								from	'next/link';
import	{AppProps}							from	'next/app';
import	NProgress							from	'nprogress';
import	{WithYearn, useWeb3}				from	'@yearn-finance/web-lib/contexts';
import	{format, truncateHex}				from	'@yearn-finance/web-lib/utils';
import	{ModalMobileMenu}					from	'@yearn-finance/web-lib/components';
import	{Keep3rContextApp}					from	'contexts/useKeep3r';
import	usePrices, {PricesContextApp}		from	'contexts/usePrices';
import	{TreasuryContextApp}				from	'contexts/useTreasury';
import	{PairsContextApp}					from	'contexts/usePairs';
import	{JobContextApp}						from	'contexts/useJob';
import	Meta								from	'components/Meta';
import	Footer								from	'components/Footer';
import	LogoKeep3r							from	'components/icons/Keep3r';

import	'../style.css';

/* 📰 - Keep3r *****************************************************************
** Little hack in order to get the correct context based on the page. In short,
** if the router is on the /jobs pages, we need to get the jobContext.
******************************************************************************/
function	AppWithContexts(props: AppProps): ReactElement {
	const	{Component, pageProps, router} = props;

	React.useEffect((): (() => void) => {
		const handleStart = (): void => NProgress.start();
		const handleStop = (): void => NProgress.done();
	
		router.events.on('routeChangeStart', handleStart);
		router.events.on('routeChangeComplete', handleStop);
		router.events.on('routeChangeError', handleStop);

		return (): void => {
			router.events.off('routeChangeStart', handleStart);
			router.events.off('routeChangeComplete', handleStop);
			router.events.off('routeChangeError', handleStop);
		};
	}, [router]);

	if (router.asPath.startsWith('/jobs/')) {
		return (
			<JobContextApp jobAddress={router?.query?.address as string}>
				<Component {...pageProps} />
			</JobContextApp>
		);
	}
	return (
		<Component {...pageProps} />
	);
}

/* 📰 - Keep3r *****************************************************************
** Add some layout to our app, aka a header with the token price and the
** current wallet (network selector later too), the footer and some extra
** elements.
******************************************************************************/
function	AppWithLayout(props: AppProps): ReactElement {
	const	{Component, pageProps, router} = props;
	const	{pathname} = router;
	const	{prices} = usePrices();
	const	{isActive, hasProvider, openLoginModal, onSwitchChain, address, ens, onDesactivate} = useWeb3();
	const	[hasMobileMenu, set_hasMobileMenu] = React.useState(false);
	const	[tokenPrice, set_tokenPrice] = React.useState('0');
	const	[walletIdentity, set_walletIdentity] = React.useState('Connect wallet');

	React.useEffect((): void => {
		set_tokenPrice(format.amount(Number(prices?.keep3rv1?.usd || 0), 2));
	}, [prices]);

	React.useEffect((): void => {
		if (!isActive && address) {
			set_walletIdentity('Switch chain');
		} else if (ens) {
			set_walletIdentity(ens);
		} else if (address) {
			set_walletIdentity(truncateHex(address, 4));
		} else {
			set_walletIdentity('Connect wallet');
		}
	}, [ens, address, isActive]);

	function	onLoginClick(): void {
		if (!isActive && !hasProvider) {
			openLoginModal();
		} else if (!isActive && hasProvider) {
			onSwitchChain(1, true);
		} else {
			onDesactivate();
		}
	}

	return (
		<>
			<Meta />
			<div className={'bg-black px-4 pt-8'}>
				<Link href={'/'}>
					<div className={'flex h-auto items-center justify-center md:h-32'}>
						<LogoKeep3r />
					</div>
				</Link>
				<button
					onClick={(): void => set_hasMobileMenu(!hasMobileMenu)}
					className={'mx-auto block w-full py-4 text-center text-white md:hidden'}>
					{'Menu'}
				</button>
			</div>
			<div className={'sticky top-0 z-50 bg-black'}>
				<div className={'mx-auto hidden h-14 w-full max-w-6xl flex-row justify-between md:flex'}>
					<nav className={'flex flex-row items-end'}>
						<Link href={'/'}>
							<div aria-selected={pathname === '/'} className={'menu_item pr-5'}>
								<b>{'Jobs'}</b>
								<div />
							</div>
						</Link>
						<Link href={'/stats'}>
							<div aria-selected={pathname.startsWith('/stats')} className={'menu_item px-5'}>
								<b>{'Stats'}</b>
								<div />
							</div>
						</Link>
						<Link href={'/treasury'}>
							<div aria-selected={pathname === '/treasury'} className={'menu_item px-5'}>
								<b>{'Treasury'}</b>
								<div />
							</div>
						</Link>
						<Link href={'/disputes'}>
							<div aria-selected={pathname === '/disputes'} className={'menu_item px-5'}>
								<b>{'Disputes'}</b>
								<div />
							</div>
						</Link>
						<Link href={'/press'}>
							<div aria-selected={pathname === '/press'} className={'menu_item pl-5'}>
								<b>{'Press kit'}</b>
								<div />
							</div>
						</Link>
					</nav>
					<div className={'flex flex-row items-end'}>
						<div className={'mr-5 flex flex-col space-y-3'}>
							<a
								className={'font-bold text-grey-2 underline'}
								target={'_blank'}
								href={'https://cowswap.exchange/#/swap?outputCurrency=0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44&referral=0x0D5Dc686d0a2ABBfDaFDFb4D0533E886517d4E83'} rel={'noreferrer'}>
								{`KP3R: $${tokenPrice}`}
							</a>
							<div className={'h-1 w-full bg-transparent'} />
						</div>
						<div className={'flex flex-col space-y-3'}>
							<button
								onClick={onLoginClick}
								className={`h-auto min-w-[147px] truncate p-0 text-intermediate font-bold hover:bg-black ${walletIdentity !== 'Connect wallet' ? 'text-white' : 'text-grey-2'}`}>
								{walletIdentity}
							</button>
							<div className={'h-1 w-full bg-transparent'} />
						</div>
					</div>
				</div>
			</div>
			<AppWithContexts Component={Component} pageProps={pageProps} router={router} />
			<Footer />
			<ModalMobileMenu
				shouldUseWallets={true}
				isOpen={hasMobileMenu}
				onClose={(): void => set_hasMobileMenu(false)}
				menuClassName={''}
				menu={[
					<Link href={'/'} key={'/'}>
						<div
							onClick={(): void => set_hasMobileMenu(false)}
							aria-selected={pathname === '/'}
							className={'text-base font-bold'}>
							<b>{'Jobs'}</b>
						</div>
					</Link>,
					<Link href={'/stats'} key={'/stats'}>
						<div
							onClick={(): void => set_hasMobileMenu(false)}
							aria-selected={pathname.startsWith('/stats')}
							className={'text-base font-bold'}>
							<b>{'Stats'}</b>
						</div>
					</Link>,
					<Link href={'/treasury'} key={'/treasury'}>
						<div
							onClick={(): void => set_hasMobileMenu(false)}
							aria-selected={pathname === '/treasury'}
							className={'text-base font-bold'}>
							<b>{'Treasury'}</b>
						</div>
					</Link>,
					<Link href={'/disputes'} key={'/disputes'}>
						<div
							onClick={(): void => set_hasMobileMenu(false)}
							aria-selected={pathname === '/disputes'}
							className={'text-base font-bold'}>
							<b>{'Disputes'}</b>
						</div>
					</Link>
				]}/>
		</>
	);
}

/* 📰 - Keep3r *****************************************************************
** Context wrapper for our app.
** WithYearn handles the connection to the blockchain and the wallet.
** Keep3rContext handles some specific keep3r elements
** PairContext handles the data for the supported pairs by Keep3r
** Treasury handles the info needed for the treasury page
******************************************************************************/
function	MyApp(props: AppProps): ReactElement {
	const	{Component, pageProps} = props;
	const	toasterOptions = {
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
		<WithYearn
			options={{
				ui: {
					shouldUseDefaultToaster: false,
					shouldUseTheme: false
				},
				web3: {
					shouldUseWallets: true,
					shouldUseStrictChainMode: false,
					defaultChainID: 1,
					supportedChainID: [1, 1337]
				}
			}}>
			<>
				<Toaster
					position={'bottom-right'}
					containerClassName={'!z-[1000000]'}
					containerStyle={{zIndex: 1000000}}
					toastOptions={toasterOptions} />
				<PricesContextApp>
					<Keep3rContextApp>
						<PairsContextApp>
							<TreasuryContextApp>
								<AppWithLayout
									Component={Component}
									pageProps={pageProps}
									router={props.router} />
							</TreasuryContextApp>
						</PairsContextApp>
					</Keep3rContextApp>
				</PricesContextApp>
			</>
		</WithYearn>
	);
}

export default MyApp;
