import {toBigInt} from '@yearn-finance/web-lib/utils/format.bigNumber';

export const max = (value: bigint, max: bigint): bigint => {
	if (toBigInt(value) > toBigInt(max)) {
		return toBigInt(max);
	}
	return toBigInt(value);
};

export const isZero = (value: bigint): boolean => {
	return toBigInt(value) === BigInt(0);
};
