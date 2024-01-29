import	React		from	'react';
import	IconDiscourse				from	'components/icons/IconDiscourse';
import	IconMedium					from	'components/icons/IconMedium';
import	IconTwitter					from	'components/icons/IconTwitter';

import IconDiscord from './icons/IconDiscord';
import IconTelegram from './icons/IconTelegram';

import type {ReactElement} from 'react';

function Footer(): ReactElement {
	return (
		<footer className={'mt-auto w-full bg-grey-3 py-7'}>
			<div className={'mx-auto hidden w-full max-w-6xl flex-row items-center md:flex'}>
				<div className={'space-y-1'}>
					<b className={''}>
						{'This project is in beta. Use at your own risk.'}
					</b>
					<div className={'flex flex-row items-center'}>
						<div className={'mr-2 h-2 w-2 rounded-full border border-black bg-transparent'} />
						<p className={'text-xs'}>{'Connected'}</p>
					</div>
				</div>

				<div className={'ml-auto cursor-pointer px-2 text-black transition-colors hover:text-black-2'}>
					<a
						href={'https://twitter.com/thekeep3r'}
						target={'_blank'}
						rel={'noreferrer'}>
						<span className={'sr-only'}>{'Check Twitter account'}</span>
						<IconTwitter className={'h-8 w-8'} />
					</a>
				</div>
				<div className={'cursor-pointer px-2 text-black transition-colors hover:text-black-2'}>
					<a
						href={'https://medium.com/keep3r-network'}
						target={'_blank'}
						rel={'noreferrer'}>
						<span className={'sr-only'}>{'Check our Medium'}</span>
						<IconMedium className={'h-8 w-8'} />
					</a>
				</div>
				<div className={'cursor-pointer px-2 text-black transition-colors hover:text-black-2'}>
					<a
						href={'https://t.me/keep3r_official'}
						target={'_blank'}
						rel={'noreferrer'}>
						<span className={'sr-only'}>{'Check our Telegram'}</span>
						<IconTelegram className={'h-8 w-8'} />
					</a>
				</div>
				<div className={'cursor-pointer px-2 text-black transition-colors hover:text-black-2'}>
					<a
						href={'https://discord.gg/Mwunmt7ZvD'}
						target={'_blank'}
						rel={'noreferrer'}>
						<span className={'sr-only'}>{'Check our Discord'}</span>
						<IconDiscord className={'h-8 w-8'} />
					</a>
				</div>
				<div className={'cursor-pointer px-2 text-black transition-colors hover:text-black-2'}>
					<a
						href={'https://gov.yearn.finance/c/projects/keep3r/20'}
						target={'_blank'}
						rel={'noreferrer'}>
						<span className={'sr-only'}>{'Access Keep3r Discourse'}</span>
						<IconDiscourse className={'h-8 w-8'} />
					</a>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
