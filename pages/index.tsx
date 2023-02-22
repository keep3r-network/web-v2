import React from 'react';
import SectionBestJobs from 'components/sections/home/SectionBestJobs';
import SectionKeepersWanted from 'components/sections/home/SectionKeepersWanted';
import SectionUnderstandSetup from 'components/sections/home/SectionUnderstandSetup';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';

import type {ReactElement} from 'react';

function	Index(): ReactElement {
	const	{chainID} = useChainID();

	return (
		<main className={'col-span-12 my-10 mx-auto flex min-h-[100vh] w-full max-w-6xl flex-col px-4'}>
			<div className={'grid grid-cols-1 gap-12 md:grid-cols-2'}>
				<section aria-label={'KEEPERS STATUS'}>
					<SectionKeepersWanted chainID={chainID} />
					<SectionUnderstandSetup />
				</section>
				<SectionBestJobs chainID={chainID} />
			</div>
		</main>
	);
}

export default Index;
