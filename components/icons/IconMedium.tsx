import	React		from	'react';

import type {ReactElement} from 'react';

function	IconMedium(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			width={'32'}
			height={'32'}
			viewBox={'0 0 32 32'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<circle
				cx={'16'}
				cy={'16'}
				r={'16'}
				fill={'currentcolor'}/>
			<path d={'M24.1449 10.1591L25.6864 8.68657V8.36426H20.3464L16.5406 17.8229L12.2108 8.36426H6.61157V8.68657L8.41224 10.8511C8.58772 11.011 8.67948 11.2449 8.65614 11.4804V19.9867C8.71168 20.2929 8.61187 20.608 8.39614 20.8306L6.36768 23.2853V23.6036H12.119V23.2813L10.0906 20.8306C9.8708 20.6072 9.76697 20.2977 9.81124 19.9867V12.629L14.8599 23.6076H15.4467L19.7877 12.629V21.3748C19.7877 21.6055 19.7877 21.6529 19.6364 21.804L18.0748 23.3126V23.6358H25.651V23.3134L24.1457 21.8418C24.0137 21.7421 23.9453 21.5749 23.9735 21.4125V10.5883C23.9453 10.4251 24.0129 10.2579 24.1449 10.1591Z'} fill={'white'}/>
		</svg>
	);
}

export default IconMedium;
