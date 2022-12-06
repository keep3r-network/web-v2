import React, {useEffect, useState} from 'react';
import {Toaster} from 'react-hot-toast';
import Link from 'next/link';
import Footer from 'components/Footer';
import LogoKeep3r from 'components/icons/Keep3r';
import Meta from 'components/Meta';
import NetworkSelector from 'components/NetworkSelector';
import {DebtContextApp} from 'contexts/useDebt';
import {JobContextApp} from 'contexts/useJob';
import {Keep3rContextApp} from 'contexts/useKeep3r';
import {PairsContextApp} from 'contexts/usePairs';
import {PricesContextApp, usePrices} from 'contexts/usePrices';
import {TreasuryContextApp} from 'contexts/useTreasury';
import NProgress from 'nprogress';
import {ModalMobileMenu} from '@yearn-finance/web-lib/components';
import {useWeb3, WithYearn} from '@yearn-finance/web-lib/contexts';
import {format} from '@yearn-finance/web-lib/utils';
import {truncateHex} from '@yearn-finance/web-lib/utils/address';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import	'../style.css';

/* 📰 - Keep3r *****************************************************************
** Little hack in order to get the correct context based on the page. In short,
** if the router is on the /jobs pages, we need to get the jobContext.
******************************************************************************/
function	AppWithContexts(props: AppProps): ReactElement {
	const	{Component, pageProps, router} = props;

	useEffect((): (() => void) => {
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
		let	currentChainID = parseInt(router?.query?.chainID as string, 10);
		if (currentChainID === undefined || currentChainID === null || isNaN(Number(currentChainID))) {
			currentChainID = 1;
		}

		return (
			<JobContextApp
				chainID={currentChainID}
				jobAddress={router?.query?.address as string}>
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
	const	{isActive, openLoginModal, onSwitchChain, address, ens, onDesactivate, chainID} = useWeb3();
	const	[hasMobileMenu, set_hasMobileMenu] = useState(false);
	const	[tokenPrice, set_tokenPrice] = useState('0');
	const	[walletIdentity, set_walletIdentity] = useState('Connect wallet');

	useEffect((): void => {
		set_tokenPrice(format.amount(Number(prices?.keep3rv1?.usd || 0), 2));
	}, [prices]);

	useEffect((): void => {
		if (!isActive && address) {
			set_walletIdentity('Invalid Network');
		} else if (ens) {
			set_walletIdentity(ens);
		} else if (address) {
			set_walletIdentity(truncateHex(address, 4));
		} else {
			set_walletIdentity('Connect wallet');
		}
	}, [ens, address, isActive]);

	function	onLoginClick(): void {
		if (isActive) {
			onDesactivate();
		} else if (!isActive && address) {
			onSwitchChain(1, true);
		} else {
			openLoginModal();
		}
	}

	return (
		<>
			<Meta />
			<div className={'bg-black px-4'}>
				<Link href={'/'}>
					<div className={'flex h-32 items-center justify-center'}>
						<LogoKeep3r />
					</div>
				</Link>
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
						<Link href={`/stats/${chainID}`}>
							<div aria-selected={pathname.startsWith('/stats/')} className={'menu_item px-5'}>
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
						<Link href={'/debt'}>
							<div aria-selected={pathname === '/debt'} className={'menu_item px-5'}>
								<b>{'Debt'}</b>
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
								className={'text-grey-2 font-bold underline'}
								target={'_blank'}
								href={'https://cowswap.exchange/#/swap?outputCurrency=0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44&referral=0x0D5Dc686d0a2ABBfDaFDFb4D0533E886517d4E83'}
								rel={'noreferrer'}>
								{`KP3R: $${tokenPrice ? tokenPrice : '0.00'}`}
							</a>
							<div className={'h-1 w-full bg-transparent'} />
						</div>

						<div className={'mr-5 flex flex-col space-y-3'}>
							<NetworkSelector />
							<div className={'h-1 w-full bg-transparent'} />
						</div>

						<div className={'flex flex-col space-y-3'}>
							<button
								onClick={onLoginClick}
								className={`text-intermediate h-auto truncate p-0 font-bold hover:bg-black ${walletIdentity !== 'Connect wallet' ? 'text-white' : 'text-grey-2'}`}>
								{walletIdentity}
							</button>
							<div className={'h-1 w-full bg-transparent'} />
						</div>
					</div>
				</div>
			</div>
			<AppWithContexts
				Component={Component}
				pageProps={pageProps}
				router={router} />
			<Footer />
			<ModalMobileMenu
				shouldUseWallets
				shouldUseNetworks
				isOpen={hasMobileMenu}
				onClose={(): void => set_hasMobileMenu(false)}>
				<div className={'flex flex-col space-y-2'}>
					<Link href={'/'} key={'/'}>
						<div
							onClick={(): void => set_hasMobileMenu(false)}
							aria-selected={pathname === '/'}
							className={'bg-grey-4 flex flex-row items-center justify-between px-4 py-3 text-base font-bold'}>
							<div className={'flex flex-row items-center space-x-3'}>
								<svg
									xmlns={'http://www.w3.org/2000/svg'}
									viewBox={'0 0 384 512'}
									className={'h-4 w-4'}><path d={'M240.5 224H352C365.3 224 377.3 232.3 381.1 244.7C386.6 257.2 383.1 271.3 373.1 280.1L117.1 504.1C105.8 513.9 89.27 514.7 77.19 505.9C65.1 497.1 60.7 481.1 66.59 467.4L143.5 288H31.1C18.67 288 6.733 279.7 2.044 267.3C-2.645 254.8 .8944 240.7 10.93 231.9L266.9 7.918C278.2-1.92 294.7-2.669 306.8 6.114C318.9 14.9 323.3 30.87 317.4 44.61L240.5 224z'} fill={'currentcolor'} />
								</svg>
								<b>{'Jobs'}</b>
							</div>
							<svg
								xmlns={'http://www.w3.org/2000/svg'}
								viewBox={'0 0 512 512'}
								className={'text-grey-2/50 h-4 w-4'}><path d={'M256 0C114.6 0 0 114.6 0 256c0 141.4 114.6 256 256 256s256-114.6 256-256C512 114.6 397.4 0 256 0zM358.6 278.6l-112 112c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25L290.8 256L201.4 166.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l112 112C364.9 239.6 368 247.8 368 256S364.9 272.4 358.6 278.6z'} fill={'currentcolor'} />
							</svg>
						</div>
					</Link>

					<Link href={`/stats/${chainID}`} key={`/stats/${chainID}`}>
						<div
							onClick={(): void => set_hasMobileMenu(false)}
							aria-selected={pathname.startsWith('/stats/')}
							className={'bg-grey-4 flex flex-row items-center justify-between px-4 py-3 text-base font-bold'}>
							<div className={'flex flex-row items-center space-x-3'}>
								<svg
									xmlns={'http://www.w3.org/2000/svg'}
									viewBox={'0 0 512 512'}
									className={'h-4 w-4'}><path d={'M160 80C160 53.49 181.5 32 208 32H240C266.5 32 288 53.49 288 80V432C288 458.5 266.5 480 240 480H208C181.5 480 160 458.5 160 432V80zM0 272C0 245.5 21.49 224 48 224H80C106.5 224 128 245.5 128 272V432C128 458.5 106.5 480 80 480H48C21.49 480 0 458.5 0 432V272zM400 96C426.5 96 448 117.5 448 144V432C448 458.5 426.5 480 400 480H368C341.5 480 320 458.5 320 432V144C320 117.5 341.5 96 368 96H400z'} fill={'currentcolor'} />
								</svg>
								<b>{'Stats'}</b>
							</div>
							<svg
								xmlns={'http://www.w3.org/2000/svg'}
								viewBox={'0 0 512 512'}
								className={'text-grey-2/50 h-4 w-4'}><path d={'M256 0C114.6 0 0 114.6 0 256c0 141.4 114.6 256 256 256s256-114.6 256-256C512 114.6 397.4 0 256 0zM358.6 278.6l-112 112c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25L290.8 256L201.4 166.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l112 112C364.9 239.6 368 247.8 368 256S364.9 272.4 358.6 278.6z'} fill={'currentcolor'} />
							</svg>
						</div>
					</Link>

					<Link href={'/treasury'} key={'/treasury'}>
						<div
							onClick={(): void => set_hasMobileMenu(false)}
							aria-selected={pathname === '/treasury'}
							className={'bg-grey-4 flex flex-row items-center justify-between px-4 py-3 text-base font-bold'}>
							<div className={'flex flex-row items-center space-x-3'}>
								<svg
									xmlns={'http://www.w3.org/2000/svg'}
									viewBox={'0 0 512 512'}
									className={'h-4 w-4'}><path d={'M256 64C397.4 64 512 128.5 512 208C512 287.5 397.4 352 256 352C114.6 352 0 287.5 0 208C0 128.5 114.6 64 256 64zM0 290.1C13.21 305.8 29.72 319.5 48 330.1V394.6C17.79 373.6 0 347.9 0 320V290.1zM80 412.1V348.3C108.4 361.4 140.9 371.3 176 377.3V441.6C139.8 435.7 107.1 425.8 80 412.1zM208 381.6C223.7 383.2 239.7 384 256 384C272.3 384 288.3 383.2 304 381.6V445.8C288.5 447.2 272.4 448 256 448C239.6 448 223.5 447.2 208 445.8V381.6zM336 441.6V377.3C371.1 371.3 403.6 361.4 432 348.3V412.1C404.9 425.8 372.2 435.7 336 441.6zM464 330.1C482.3 319.5 498.8 305.8 512 290.1V320C512 347.9 494.2 373.6 464 394.6V330.1z'} fill={'currentcolor'} />
								</svg>
								<b>{'Treasury'}</b>
							</div>
							<svg
								xmlns={'http://www.w3.org/2000/svg'}
								viewBox={'0 0 512 512'}
								className={'text-grey-2/50 h-4 w-4'}><path d={'M256 0C114.6 0 0 114.6 0 256c0 141.4 114.6 256 256 256s256-114.6 256-256C512 114.6 397.4 0 256 0zM358.6 278.6l-112 112c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25L290.8 256L201.4 166.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l112 112C364.9 239.6 368 247.8 368 256S364.9 272.4 358.6 278.6z'} fill={'currentcolor'} />
							</svg>
						</div>
					</Link>

					<Link href={'/debt'} key={'/debt'}>
						<div
							onClick={(): void => set_hasMobileMenu(false)}
							aria-selected={pathname === '/debt'}
							className={'bg-grey-4 flex flex-row items-center justify-between px-4 py-3 text-base font-bold'}>
							<div className={'flex flex-row items-center space-x-3'}>
								<svg
									xmlns={'http://www.w3.org/2000/svg'}
									viewBox={'0 0 384 512'}
									className={'h-4 w-4'}><path d={'M14 2.2C22.5-1.7 32.5-.3 39.6 5.8L80 40.4 120.4 5.8c9-7.7 22.3-7.7 31.2 0L192 40.4 232.4 5.8c9-7.7 22.2-7.7 31.2 0L304 40.4 344.4 5.8c7.1-6.1 17.1-7.5 25.6-3.6s14 12.4 14 21.8V488c0 9.4-5.5 17.9-14 21.8s-18.5 2.5-25.6-3.6L304 471.6l-40.4 34.6c-9 7.7-22.2 7.7-31.2 0L192 471.6l-40.4 34.6c-9 7.7-22.3 7.7-31.2 0L80 471.6 39.6 506.2c-7.1 6.1-17.1 7.5-25.6 3.6S0 497.4 0 488V24C0 14.6 5.5 6.1 14 2.2zM96 144c-8.8 0-16 7.2-16 16s7.2 16 16 16H288c8.8 0 16-7.2 16-16s-7.2-16-16-16H96zM80 352c0 8.8 7.2 16 16 16H288c8.8 0 16-7.2 16-16s-7.2-16-16-16H96c-8.8 0-16 7.2-16 16zM96 240c-8.8 0-16 7.2-16 16s7.2 16 16 16H288c8.8 0 16-7.2 16-16s-7.2-16-16-16H96z'}/>
								</svg>
								<b>{'Debt'}</b>
							</div>
							<svg
								xmlns={'http://www.w3.org/2000/svg'}
								viewBox={'0 0 512 512'}
								className={'text-grey-2/50 h-4 w-4'}><path d={'M256 0C114.6 0 0 114.6 0 256c0 141.4 114.6 256 256 256s256-114.6 256-256C512 114.6 397.4 0 256 0zM358.6 278.6l-112 112c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25L290.8 256L201.4 166.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l112 112C364.9 239.6 368 247.8 368 256S364.9 272.4 358.6 278.6z'} fill={'currentcolor'} />
							</svg>
						</div>
					</Link>

					<Link href={'/disputes'} key={'/disputes'}>
						<div
							onClick={(): void => set_hasMobileMenu(false)}
							aria-selected={pathname === '/disputes'}
							className={'bg-grey-4 flex flex-row items-center justify-between px-4 py-3 text-base font-bold'}>
							<div className={'flex flex-row items-center space-x-3'}>
								<svg
									xmlns={'http://www.w3.org/2000/svg'}
									viewBox={'0 0 640 512'}
									className={'h-4 w-4'}><path d={'M93.13 257.7C71.25 275.1 53 313.5 38.63 355.1L99 333.1c5.75-2.125 10.62 4.749 6.625 9.499L11 454.7C3.75 486.1 0 510.2 0 510.2s206.6 13.62 266.6-34.12c60-47.87 76.63-150.1 76.63-150.1L256.5 216.7C256.5 216.7 153.1 209.1 93.13 257.7zM633.2 12.34c-10.84-13.91-30.91-16.45-44.91-5.624l-225.7 175.6l-34.99-44.06C322.5 131.9 312.5 133.1 309 140.5L283.8 194.1l86.75 109.2l58.75-12.5c8-1.625 11.38-11.12 6.375-17.5l-33.19-41.79l225.2-175.2C641.6 46.38 644.1 26.27 633.2 12.34z'} fill={'currentcolor'} />
								</svg>
								<b>{'Disputes'}</b>
							</div>
							<svg
								xmlns={'http://www.w3.org/2000/svg'}
								viewBox={'0 0 512 512'}
								className={'text-grey-2/50 h-4 w-4'}><path d={'M256 0C114.6 0 0 114.6 0 256c0 141.4 114.6 256 256 256s256-114.6 256-256C512 114.6 397.4 0 256 0zM358.6 278.6l-112 112c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25L290.8 256L201.4 166.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l112 112C364.9 239.6 368 247.8 368 256S364.9 272.4 358.6 278.6z'} fill={'currentcolor'} />
							</svg>
						</div>
					</Link>
				</div>
			</ModalMobileMenu>
			<button
				onClick={(): void => set_hasMobileMenu(!hasMobileMenu)}
				className={'fixed bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-white text-black shadow-xl md:hidden'}>
				<svg
					xmlns={'http://www.w3.org/2000/svg'}
					viewBox={'0 0 448 512'}
					className={'h-6 w-6'}><path d={'M120 256C120 286.9 94.93 312 64 312C33.07 312 8 286.9 8 256C8 225.1 33.07 200 64 200C94.93 200 120 225.1 120 256zM280 256C280 286.9 254.9 312 224 312C193.1 312 168 286.9 168 256C168 225.1 193.1 200 224 200C254.9 200 280 225.1 280 256zM328 256C328 225.1 353.1 200 384 200C414.9 200 440 225.1 440 256C440 286.9 414.9 312 384 312C353.1 312 328 286.9 328 256z'} fill={'currentcolor'} />
				</svg>
			</button>
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
					shouldUseThemes: false
				},
				web3: {
					defaultChainID: 1,
					supportedChainID: [1, 5, 10, 250, 1337]
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
			</>
		</WithYearn>
	);
}

export default MyApp;
