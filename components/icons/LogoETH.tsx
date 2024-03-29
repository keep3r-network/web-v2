import	React		from	'react';

import type {ReactElement} from 'react';

function	LogoETH(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			width={'32'}
			height={'32'}
			viewBox={'0 0 32 32'}
			fill={'none'}>
			<g clip-path={'url(#clip0_621_285293)'}>
				<path d={'M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z'} fill={'#00000080'}/>
				<path
					fill-rule={'evenodd'}
					clip-rule={'evenodd'}
					d={'M9 16.2225L16.4996 4V12.8718L9 16.2225ZM16.4996 21.9707V28L9 17.6188L16.4996 21.9707Z'}
					fill={'white'}/>
				<path
					d={'M16.5 20.5765L23.9986 16.2226L16.5 12.8739V20.5765Z'}
					fill={'white'}
					fill-opacity={'0.2'}/>
				<path
					fill-rule={'evenodd'}
					clip-rule={'evenodd'}
					d={'M16.4996 4V12.8718L23.9982 16.2225L16.4996 4ZM16.4996 21.9717V28L24.0032 17.6188L16.4996 21.9717ZM16.4996 20.5765L9 16.2226L16.4996 12.8739V20.5765Z'}
					fill={'white'}
					fill-opacity={'0.602'}/>
			</g>
			<defs>
				<clipPath id={'clip0_621_285293'}>
					<rect
						width={'32'}
						height={'32'}
						fill={'white'}/>
				</clipPath>
			</defs>
		</svg>
	);
}

export default LogoETH;
