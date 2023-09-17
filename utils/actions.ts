import assert from 'assert';
import {erc20ABI, prepareWriteContract, readContract} from '@wagmi/core';
import {MAX_UINT_256} from '@yearn-finance/web-lib/utils/constants';
import {toBigInt} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {handleTx, toWagmiProvider} from '@yearn-finance/web-lib/utils/wagmi/provider';
import {assertAddress} from '@yearn-finance/web-lib/utils/wagmi/utils';

import UNI_V3_PAIR_ABI from './abi/univ3Pair.abi';

import type {Connector} from 'wagmi';
import type {TAddress} from '@yearn-finance/web-lib/types';
import type {TWriteTransaction} from '@yearn-finance/web-lib/utils/wagmi/provider';
import type {TTxResponse} from '@yearn-finance/web-lib/utils/web3/transaction';

//Because USDT do not return a boolean on approve, we need to use this ABI
const ALTERNATE_ERC20_APPROVE_ABI = [{'constant': false, 'inputs': [{'name': '_spender', 'type': 'address'}, {'name': '_value', 'type': 'uint256'}], 'name': 'approve', 'outputs': [], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'function'}] as const;

/* 📰 - Keep3r  ****************************************************************
** isApprovedERC20 is a _VIEW_ function that checks if a token is approved for
** a spender.
******************************************************************************/
export async function isApprovedERC20(
	connector: Connector | undefined,
	tokenAddress: TAddress,
	spender: TAddress,
	amount = MAX_UINT_256
): Promise<boolean> {
	const wagmiProvider = await toWagmiProvider(connector);
	const result = await readContract({
		...wagmiProvider,
		abi: erc20ABI,
		address: tokenAddress,
		functionName: 'allowance',
		args: [wagmiProvider.address, spender]
	});
	return (result || 0n) >= amount;
}

/* 📰 - Keep3r  ****************************************************************
** allowanceOf is a _VIEW_ function that returns the amount of a token that is
** approved for a spender.
******************************************************************************/
type TAllowanceOf = {
	connector: Connector | undefined,
	tokenAddress: TAddress,
	spenderAddress: TAddress
}
export async function allowanceOf(props: TAllowanceOf): Promise<bigint> {
	const wagmiProvider = await toWagmiProvider(props.connector);
	const result = await readContract({
		...wagmiProvider,
		abi: erc20ABI,
		address: props.tokenAddress,
		functionName: 'allowance',
		args: [wagmiProvider.address, props.spenderAddress]
	});
	return result || 0n;
}

/* 📰 - Keep3r  ****************************************************************
** approveERC20 is a _WRITE_ function that approves a token for a spender.
**
** @param spenderAddress - The address of the spender.
** @param amount - The amount of collateral to deposit.
******************************************************************************/
type TApproveERC20 = TWriteTransaction & {
	spenderAddress: TAddress | undefined;
	amount: bigint;
};
export async function approveERC20(props: TApproveERC20): Promise<TTxResponse> {
	assertAddress(props.spenderAddress, 'spenderAddress');
	assertAddress(props.contractAddress);

	props.onTrySomethingElse = async (): Promise<TTxResponse> => {
		assertAddress(props.spenderAddress, 'spenderAddress');
		return await handleTx(props, {
			address: props.contractAddress,
			abi: ALTERNATE_ERC20_APPROVE_ABI,
			functionName: 'approve',
			args: [props.spenderAddress, props.amount]
		});
	};

	return await handleTx(props, {
		address: props.contractAddress,
		abi: erc20ABI,
		functionName: 'approve',
		args: [props.spenderAddress, props.amount]
	});
}

/* 📰 - Keep3r  ****************************************************************
** Incentivize is a _WRITE_ function that incentivizes one of the LST protocols
** with some tokens to vote for it.
**
** @app - Keep3r
** @param amount - The amount of collateral to deposit.
******************************************************************************/
type TBurn = TWriteTransaction & {
	amount: bigint;
};
export async function burn(props: TBurn): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amount > 0n, 'Amount is 0');
	assertAddress(props.contractAddress, 'contractAddress');
	const wagmiProvider = await toWagmiProvider(props.connector);

	const simulation = await prepareWriteContract({
		address: props.contractAddress,
		abi: UNI_V3_PAIR_ABI,
		functionName: 'burn',
		args: [props.amount, 0n, 0n, wagmiProvider.address]
	});

	const simMinAmount0 = toBigInt(simulation.result[0]);
	const simMinAmount1 = toBigInt(simulation.result[1]);
	const minAmount0 = simMinAmount0 * 995n / 1000n;
	const minAmount1 = simMinAmount1 * 995n / 1000n;

	assert(minAmount0 > 0n, 'minAmount0 is 0');
	assert(minAmount1 > 0n, 'minAmount1 is 0');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: UNI_V3_PAIR_ABI,
		functionName: 'burn',
		args: [props.amount, minAmount0, minAmount1, wagmiProvider.address]
	});
}
