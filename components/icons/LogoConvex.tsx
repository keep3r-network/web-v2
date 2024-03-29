import	React		from	'react';

import type {ReactElement} from 'react';

function	LogoConvex(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			xmlns={'http://www.w3.org/2000/svg'}
			viewBox={'0 0 32 32'}
			width={'32'}
			height={'32'}>
			<defs>
				<linearGradient
					id={'paint0_linear'}
					x1={'22.8952'}
					y1={'5.0985'}
					x2={'4.0445'}
					y2={'34.5497'}
					gradientUnits={'userSpaceOnUse'}
					gradientTransform={'matrix(0.630801, 0, 0, 0.630801, 4.645676, 3.26105)'}>
					<stop stopColor={'#1682FE'}/>
					<stop offset={'0.3'} stopColor={'#60D8A4'}/>
					<stop offset={'0.7'} stopColor={'#FCA75B'}/>
					<stop offset={'1'} stopColor={'#FF5A5A'}/>
				</linearGradient>
			</defs>
			<circle
				fill={'white'}
				cx={'16'}
				cy={'16'}
				r={'16'}/>
			<path d={'M 25.188 13.502 L 25.188 8.502 L 22.688 8.502 L 22.688 6.002 L 17.689 6.002 L 17.689 3.502 L 12.689 3.502 L 12.689 6.002 L 7.689 6.002 L 7.689 8.502 L 5.189 8.502 L 5.189 23.501 L 7.689 23.501 L 7.689 26.001 L 12.689 26.001 L 12.689 28.5 L 17.688 28.5 L 17.688 26.001 L 22.688 26.001 L 22.688 23.501 L 25.188 23.501 L 25.188 18.501 L 20.189 18.501 L 20.189 21.001 L 17.689 21.001 L 17.689 23.501 L 12.689 23.501 L 12.689 21.001 L 10.191 21.001 L 10.191 11.002 L 12.691 11.002 L 12.691 8.502 L 17.69 8.502 L 17.69 11.002 L 20.19 11.002 L 20.19 13.502 L 25.188 13.502 Z'} fill={'url(#paint0_linear)'}/>
			<rect
				x={'17.689'}
				y={'8.376'}
				width={'1.741'}
				height={'2.625'}
				fill={'#1682FE'}/>
			<rect
				x={'12.685'}
				width={'1.741'}
				height={'2.625'}
				fill={'#1682FE'}
				y={'3.5'}/>
			<rect
				x={'7.687'}
				y={'6'}
				width={'1.741'}
				height={'2.625'}
				fill={'#60D8A4'}/>
			<rect
				x={'5.186'}
				y={'16'}
				width={'1.759'}
				height={'7.499'}
				fill={'#F4BB3B'}/>
			<rect
				x={'5.186'}
				y={'8.502'}
				width={'1.759'}
				height={'7.499'}
				fill={'#60D8A4'}/>
			<rect
				x={'20.187'}
				y={'10.875'}
				width={'1.741'}
				height={'2.625'}
				fill={'#1682FE'}/>
			<rect
				x={'20.186'}
				y={'18.5'}
				width={'1.741'}
				height={'2.625'}
				fill={'#FF5A5A'}/>
			<rect
				x={'17.689'}
				y={'21'}
				width={'1.741'}
				height={'2.625'}
				fill={'#FF5A5A'}/>
			<rect
				x={'12.686'}
				y={'25.874'}
				width={'1.741'}
				height={'2.625'}
				fill={'#FF5A5A'}/>
			<rect
				x={'7.686'}
				y={'23.375'}
				width={'1.741'}
				height={'2.625'}
				fill={'#F4BB3B'}/>
			<path d={'M 26.814 13.5 L 26.814 8.5 L 24.313 8.5 L 24.313 6 L 19.314 6 L 19.314 3.5 L 14.314 3.5 L 14.314 6 L 9.314 6 L 9.314 8.5 L 6.813 8.5 L 6.813 23.5 L 9.313 23.5 L 9.313 26 L 14.312 26 L 14.312 28.499 L 19.312 28.499 L 19.312 26 L 24.313 26 L 24.313 23.5 L 26.814 23.5 L 26.814 18.5 L 21.814 18.5 L 21.814 21 L 19.314 21 L 19.314 23.5 L 14.314 23.5 L 14.314 21 L 11.814 21 L 11.814 11 L 14.314 11 L 14.314 8.5 L 19.314 8.5 L 19.314 11 L 21.814 11 L 21.814 13.5 L 26.814 13.5 Z'} fill={'#3A3A3A'}/>
		</svg>
	);
}

export default LogoConvex;
