import	React		from	'react';

import type {ReactElement} from 'react';

function	LogoLido(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			width={'32'}
			height={'32'}
			viewBox={'0 0 32 32'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<path
				fillRule={'evenodd'}
				clipRule={'evenodd'}
				d={'M32 16C32 7.17152 24.8285 0 16 0C7.17152 0 0 7.17152 0 16C0 24.8285 7.17152 32 16 32C24.8285 32 32 24.8285 32 16Z'}
				fill={'white'}/>
			<path d={'M9.00352 14.7914C8.93984 14.889 8.87616 14.9866 8.8128 15.0842C6.66112 18.3863 7.14144 22.7098 9.96832 25.48C11.6314 27.1098 13.8118 27.9245 15.992 27.9251L9.00352 14.7914Z'} fill={'#000000'}/>
			<path
				opacity={'0.6'}
				d={'M16 9.86682L9.97632 13.311L16 16.7513V9.86682Z'}
				fill={'#000000'}/>
			<path d={'M16 4.07483L9.97632 13.3116L16 9.85723V4.07483Z'} fill={'#000000'}/>
			<path
				opacity={'0.6'}
				d={'M16 18.7827L9.00384 14.7914L16 27.9251V18.7827Z'}
				fill={'#000000'}/>
			<path
				opacity={'0.6'}
				d={'M22.9965 14.7914C23.0602 14.889 23.1238 14.9866 23.1872 15.0842C25.3389 18.3863 24.8586 22.7098 22.0317 25.48C20.3686 27.1098 18.1882 27.9245 16.008 27.9251L22.9965 14.7914Z'}
				fill={'#000000'}/>
			<path
				opacity={'0.2'}
				d={'M16 9.86682L22.0237 13.311L16 16.7513V9.86682Z'}
				fill={'#000000'}/>
			<path
				opacity={'0.6'}
				d={'M16 4.07483L22.0237 13.3116L16 9.85723V4.07483Z'}
				fill={'#000000'}/>
			<path
				opacity={'0.2'}
				d={'M16 18.7827L22.9962 14.7914L16 27.9251V18.7827Z'}
				fill={'#000000'}/>
		</svg>
	);
}

export default LogoLido;
