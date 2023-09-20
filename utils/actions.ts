import assert from 'assert';
import {erc20ABI, prepareWriteContract, readContract} from '@wagmi/core';
import {MAX_UINT_256} from '@yearn-finance/web-lib/utils/constants';
import {toBigInt} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {handleTx, toWagmiProvider} from '@yearn-finance/web-lib/utils/wagmi/provider';
import {assertAddress} from '@yearn-finance/web-lib/utils/wagmi/utils';

import KEEP3RV2_ABI from './abi/keep3rv2.abi';
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
** Burn is a _WRITE_ function
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


/* 📰 - Keep3r  ****************************************************************
** mint is a _WRITE_ function
**
** @app - Keep3r
** @param amountToken1 - The amount of token1 to deposit.
** @param amountToken2 - The amount of token2 to deposit.
******************************************************************************/
type TMint = TWriteTransaction & {
	amountToken1: bigint;
	amountToken2: bigint;
};
export async function mint(props: TMint): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assertAddress(props.contractAddress, 'contractAddress');
	assert(props.amountToken1 > 0n, 'amountToken1 is 0');
	assert(props.amountToken2 > 0n, 'amountToken2 is 0');
	const wagmiProvider = await toWagmiProvider(props.connector);

	const minAmount1 = props.amountToken1 * 995n / 1000n;
	const minAmount2 = props.amountToken2 * 995n / 1000n;

	assert(minAmount1 > 0n, 'minAmount1 is 0');
	assert(minAmount2 > 0n, 'minAmount2 is 0');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: UNI_V3_PAIR_ABI,
		functionName: 'mint',
		args: [
			props.amountToken1,
			props.amountToken2,
			minAmount1,
			minAmount2,
			wagmiProvider.address
		]
	});
}

/* 📰 - Keep3r  ****************************************************************
** AcceptJobMigration is a _WRITE_ function
**
** @app - Keep3r
** @param oldJobAddress - The address of the old job.
** @param newJobAddress - The address of the new job.
******************************************************************************/
type TAcceptJobMigration = TWriteTransaction & {
	oldJobAddress: TAddress,
	newJobAddress: TAddress
};
export async function acceptJobMigration(props: TAcceptJobMigration): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assertAddress(props.oldJobAddress, 'oldJobAddress');
	assertAddress(props.newJobAddress, 'newJobAddress');
	assertAddress(props.contractAddress, 'contractAddress');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: KEEP3RV2_ABI,
		functionName: 'acceptJobMigration',
		args: [props.oldJobAddress, props.newJobAddress]
	});
}

/* 📰 - Keep3r  ****************************************************************
** migrateJob is a _WRITE_ function
**
** @app - Keep3r
** @param oldJobAddress - The address of the old job.
** @param newJobAddress - The address of the new job.
******************************************************************************/
type TMigrateJob = TWriteTransaction & {
	oldJobAddress: TAddress,
	newJobAddress: TAddress
};
export async function migrateJob(props: TMigrateJob): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assertAddress(props.oldJobAddress, 'oldJobAddress');
	assertAddress(props.newJobAddress, 'newJobAddress');
	assertAddress(props.contractAddress, 'contractAddress');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: KEEP3RV2_ABI,
		functionName: 'migrateJob',
		args: [props.oldJobAddress, props.newJobAddress]
	});
}


/* 📰 - Keep3r  ****************************************************************
** activate is a _WRITE_ function
**
** @app - Keep3r
** @param bondedTokenAddress - The address of the bonded token.
******************************************************************************/
type TActivate = TWriteTransaction & {
	bondedTokenAddress: TAddress,
};
export async function activate(props: TActivate): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assertAddress(props.bondedTokenAddress, 'bondedTokenAddress');
	assertAddress(props.contractAddress, 'contractAddress');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: KEEP3RV2_ABI,
		functionName: 'activate',
		args: [props.bondedTokenAddress]
	});
}


/* 📰 - Keep3r  ****************************************************************
** addLiquidityToJob is a _WRITE_ function
**
** @app - Keep3r
** @param jobAddress - The address of the job.
** @param liquidityTokenAddress - The address of the liquidity token.
** @param liquidityAmount - The amount of liquidity to add.
******************************************************************************/
type TAddLiquidityToJob = TWriteTransaction & {
	jobAddress: TAddress
	liquidityTokenAddress: TAddress
	liquidityAmount: bigint
};
export async function addLiquidityToJob(props: TAddLiquidityToJob): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.liquidityAmount > 0n, 'liquidityAmount is 0');
	assertAddress(props.jobAddress, 'jobAddress');
	assertAddress(props.liquidityTokenAddress, 'liquidityTokenAddress');
	assertAddress(props.contractAddress, 'contractAddress');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: KEEP3RV2_ABI,
		functionName: 'addLiquidityToJob',
		args: [props.jobAddress, props.liquidityTokenAddress, props.liquidityAmount]
	});
}

/* 📰 - Keep3r  ****************************************************************
** addTokenCreditsToJob is a _WRITE_ function
**
** @app - Keep3r
** @param jobAddress - The address of the job.
** @param tokenAddress - The address of the token.
** @param tokenAmount - The amount of token to add.
******************************************************************************/
type TAddTokenCreditsToJob = TWriteTransaction & {
	jobAddress: TAddress
	tokenAddress: TAddress
	tokenAmount: bigint
};
export async function addTokenCreditsToJob(props: TAddTokenCreditsToJob): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.tokenAmount > 0n, 'tokenAmount is 0');
	assertAddress(props.jobAddress, 'jobAddress');
	assertAddress(props.tokenAddress, 'tokenAddress');
	assertAddress(props.contractAddress, 'contractAddress');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: KEEP3RV2_ABI,
		functionName: 'addTokenCreditsToJob',
		args: [props.jobAddress, props.tokenAddress, props.tokenAmount]
	});
}

/* 📰 - Keep3r  ****************************************************************
** bond is a _WRITE_ function
**
** @app - Keep3r
** @param tokenBondedAddress - The address of the token bonded.
** @param amount - The amount of token to bond.
******************************************************************************/
type TBond = TWriteTransaction & {
	tokenBondedAddress: TAddress
	amount: bigint
};
export async function bond(props: TBond): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amount > 0n, 'amount is 0');
	assertAddress(props.tokenBondedAddress, 'tokenBondedAddress');
	assertAddress(props.contractAddress, 'contractAddress');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: KEEP3RV2_ABI,
		functionName: 'bond',
		args: [props.tokenBondedAddress, props.amount]
	});
}

/* 📰 - Keep3r  ****************************************************************
** dispute is a _WRITE_ function
**
** @app - Keep3r
** @param disputedAddress - The address to dispute.
******************************************************************************/
type TDispute = TWriteTransaction & {
	disputedAddress: TAddress
};
export async function dispute(props: TDispute): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assertAddress(props.disputedAddress, 'disputedAddress');
	assertAddress(props.contractAddress, 'contractAddress');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: KEEP3RV2_ABI,
		functionName: 'dispute',
		args: [props.disputedAddress]
	});
}


/* 📰 - Keep3r  ****************************************************************
** resolve is a _WRITE_ function
**
** @app - Keep3r
** @param resolvedAddress - The address to resolve.
******************************************************************************/
type TResolve = TWriteTransaction & {
	resolvedAddress: TAddress
};
export async function resolve(props: TResolve): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assertAddress(props.resolvedAddress, 'resolvedAddress');
	assertAddress(props.contractAddress, 'contractAddress');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: KEEP3RV2_ABI,
		functionName: 'resolve',
		args: [props.resolvedAddress]
	});
}


/* 📰 - Keep3r  ****************************************************************
** revoke is a _WRITE_ function
**
** @app - Keep3r
** @param revokedAddress - The address to revoke.
******************************************************************************/
type TRevoke = TWriteTransaction & {
	revokedAddress: TAddress
};
export async function revoke(props: TRevoke): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assertAddress(props.revokedAddress, 'revokedAddress');
	assertAddress(props.contractAddress, 'contractAddress');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: KEEP3RV2_ABI,
		functionName: 'revoke',
		args: [props.revokedAddress]
	});
}


/* 📰 - Keep3r  ****************************************************************
** registerJob is a _WRITE_ function
**
** @app - Keep3r
** @param jobAddress - The address of the job.
******************************************************************************/
type TRegisterJob = TWriteTransaction & {
	jobAddress: TAddress
};
export async function registerJob(props: TRegisterJob): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assertAddress(props.jobAddress, 'jobAddress');
	assertAddress(props.contractAddress, 'contractAddress');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: KEEP3RV2_ABI,
		functionName: 'addJob',
		args: [props.jobAddress]
	});
}


/* 📰 - Keep3r  ****************************************************************
** slash is a _WRITE_ function
**
** @app - Keep3r
** @param toSlashAddress - The address to slash.
** @param toSlashToken - The address of the token to slash.
** @param toSlashBondAmount - The amount of bond to slash.
** @param toSlashUnbondAmount - The amount of unbond to slash.
******************************************************************************/
type TSlash = TWriteTransaction & {
	toSlashAddress: TAddress
	toSlashToken: TAddress
	toSlashBondAmount: bigint
	toSlashUnbondAmount: bigint
};
export async function slash(props: TSlash): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assertAddress(props.toSlashAddress, 'toSlashAddress');
	assertAddress(props.toSlashToken, 'toSlashToken');
	assertAddress(props.contractAddress, 'contractAddress');
	assert(props.toSlashBondAmount + props.toSlashUnbondAmount > 0n, 'slash amount is 0');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: KEEP3RV2_ABI,
		functionName: 'slash',
		args: [
			props.toSlashAddress, 
			props.toSlashToken, 
			props.toSlashBondAmount, 
			props.toSlashUnbondAmount
		]
	});
}


/* 📰 - Keep3r  ****************************************************************
** slashLiquidityFromJob is a _WRITE_ function
**
** @app - Keep3r
** @param toSlashAddress - The address to slash.
** @param toSlashToken - The address of the token to slash.
** @param toSlashAmount - The amount to slash.
******************************************************************************/
type TSlashLiquidityFromJob = TWriteTransaction & {
	toSlashAddress: TAddress
	toSlashToken: TAddress
	toSlashAmount: bigint
};
export async function slashLiquidityFromJob(props: TSlashLiquidityFromJob): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assertAddress(props.toSlashAddress, 'toSlashAddress');
	assertAddress(props.toSlashToken, 'toSlashToken');
	assertAddress(props.contractAddress, 'contractAddress');
	assert(props.toSlashAmount > 0n, 'slash amount is 0');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: KEEP3RV2_ABI,
		functionName: 'slashLiquidityFromJob',
		args: [
			props.toSlashAddress, 
			props.toSlashToken, 
			props.toSlashAmount
		]
	});
}


/* 📰 - Keep3r  ****************************************************************
** slashTokenFromJob is a _WRITE_ function
**
** @app - Keep3r
** @param toSlashAddress - The address to slash.
** @param toSlashToken - The address of the token to slash.
** @param toSlashAmount - The amount to slash.
******************************************************************************/
type TSlashTokenFromJob = TWriteTransaction & {
	toSlashAddress: TAddress
	toSlashToken: TAddress
	toSlashAmount: bigint
};
export async function slashTokenFromJob(props: TSlashTokenFromJob): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assertAddress(props.toSlashAddress, 'toSlashAddress');
	assertAddress(props.toSlashToken, 'toSlashToken');
	assertAddress(props.contractAddress, 'contractAddress');
	assert(props.toSlashAmount > 0n, 'slash amount is 0');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: KEEP3RV2_ABI,
		functionName: 'slashTokenFromJob',
		args: [
			props.toSlashAddress, 
			props.toSlashToken, 
			props.toSlashAmount
		]
	});
}


/* 📰 - Keep3r  ****************************************************************
** unbond is a _WRITE_ function
**
** @app - Keep3r
** @param tokenAddress - The address to unbond.
** @param amount - The amount to unbond.
******************************************************************************/
type TUnbond = TWriteTransaction & {
	tokenAddress: TAddress
	amount: bigint
};
export async function unbond(props: TUnbond): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assertAddress(props.tokenAddress, 'tokenAddress');
	assertAddress(props.contractAddress, 'contractAddress');
	assert(props.amount > 0n, 'amount is 0');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: KEEP3RV2_ABI,
		functionName: 'unbond',
		args: [
			props.tokenAddress, 
			props.amount
		]
	});
}


/* 📰 - Keep3r  ****************************************************************
** unbondLiquidityFromJob is a _WRITE_ function
**
** @app - Keep3r
** @param jobAddress - The address of the job.
** @param tokenAddress - The address of the liquidity token.
** @param amount - The liquidity amount to unbond.
******************************************************************************/
type TUnbondLiquidityFromJob = TWriteTransaction & {
	jobAddress: TAddress
	tokenAddress: TAddress
	amount: bigint
};
export async function unbondLiquidityFromJob(props: TUnbondLiquidityFromJob): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assertAddress(props.contractAddress, 'contractAddress');
	assertAddress(props.jobAddress, 'jobAddress');
	assertAddress(props.tokenAddress, 'tokenAddress');
	assert(props.amount > 0n, 'amount is 0');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: KEEP3RV2_ABI,
		functionName: 'unbondLiquidityFromJob',
		args: [
			props.jobAddress,
			props.tokenAddress, 
			props.amount
		]
	});
}


/* 📰 - Keep3r  ****************************************************************
** withdraw is a _WRITE_ function
**
** @app - Keep3r
** @param tokenAddress - The address of the token to withdraw.
******************************************************************************/
type TWithdraw = TWriteTransaction & {
	tokenAddress: TAddress
};
export async function withdraw(props: TWithdraw): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assertAddress(props.contractAddress, 'contractAddress');
	assertAddress(props.tokenAddress, 'tokenAddress');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: KEEP3RV2_ABI,
		functionName: 'withdraw',
		args: [props.tokenAddress]
	});
}


/* 📰 - Keep3r  ****************************************************************
** withdrawLiquidityFromJob is a _WRITE_ function
**
** @app - Keep3r
** @param jobAddress - The address of the job.
** @param tokenAddress - The address of the token
******************************************************************************/
type TWithdrawLiquidityFromJob = TWriteTransaction & {
	jobAddress: TAddress
	tokenAddress: TAddress
};
export async function withdrawLiquidityFromJob(props: TWithdrawLiquidityFromJob): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assertAddress(props.contractAddress, 'contractAddress');
	assertAddress(props.jobAddress, 'jobAddress');
	assertAddress(props.tokenAddress, 'tokenAddress');
	
	const wagmiProvider = await toWagmiProvider(props.connector);

	return await handleTx(props, {
		address: props.contractAddress,
		abi: KEEP3RV2_ABI,
		functionName: 'withdrawLiquidityFromJob',
		args: [
			props.jobAddress,
			props.tokenAddress,
			wagmiProvider.address
		]
	});
}


/* 📰 - Keep3r  ****************************************************************
** withdrawTokenCreditsFromJob is a _WRITE_ function
**
** @app - Keep3r
** @param jobAddress - The address of the job.
** @param tokenAddress - The address of the token
** @param amount - The amount of token to withdraw
** @param receiver - The address of the receiver
******************************************************************************/
type TWithdrawTokenCreditsFromJob = TWriteTransaction & {
	jobAddress: TAddress
	tokenAddress: TAddress
	receiver: TAddress
	amount: bigint
};
export async function withdrawTokenCreditsFromJob(props: TWithdrawTokenCreditsFromJob): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assertAddress(props.contractAddress, 'contractAddress');
	assertAddress(props.jobAddress, 'jobAddress');
	assertAddress(props.tokenAddress, 'tokenAddress');
	assertAddress(props.receiver, 'receiver');
	assert(props.amount > 0n, 'amount is 0');
	
	return await handleTx(props, {
		address: props.contractAddress,
		abi: KEEP3RV2_ABI,
		functionName: 'withdrawTokenCreditsFromJob',
		args: [
			props.jobAddress,
			props.tokenAddress,
			props.amount,
			props.receiver
		]
	});
}
