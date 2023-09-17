import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import CONVEX_REWARDS_ABI from 'utils/abi/convexRewards.abi';
import {CURVE_FEE_DISTRIBUTOR_ABI} from 'utils/abi/curveDistributor.abi';
import CVX_ABI from 'utils/abi/cvx.abi';
import LENS_PRICE_ABI from 'utils/abi/lens.abi';
import LOCKED_CVX_ABI from 'utils/abi/lockedCVX.abi';
import YEARN_VAULT_ABI from 'utils/abi/yearnVault.abi';
import {getEnv} from 'utils/env';
import {readContracts} from 'wagmi';
import axios from 'axios';
import {prepareWriteContract} from '@wagmi/core';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {decodeAsBigInt} from '@yearn-finance/web-lib/utils/decoder';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {performBatchedUpdates} from '@yearn-finance/web-lib/utils/performBatchedUpdates';

import type {ReactElement} from 'react';
import type {TAddress} from '@yearn-finance/web-lib/types';

export type	TTreasury = {
	name: string;
	protocol: string;
	rewards: string;
	tokenStaked: number;
	tokenStakedUSD: number;
	unclaimedRewards: number;
	unclaimedRewardsUSD: number;
	hasNoRewards?: boolean;
}
type	TTreasuryContext = {
	treasury: TTreasury[],
}

const TreasuryContext = createContext<TTreasuryContext>({treasury: []});
export const TreasuryContextApp = ({children}: {children: ReactElement}): ReactElement => {
	const {safeChainID} = useChainID();
	const [treasury, set_treasury] = useState<TTreasury[]>([]);
	const [, set_nonce] = useState(0);

	const getTreasury = useCallback(async (): Promise<void> => {
		const kp3rEthPriceResp = await axios.get('https://ydaemon.yearn.fi/1/prices/0x4647B6D835f3B393C7A955df51EEfcf0db961606');
		const kp3rEthPrice = kp3rEthPriceResp.data;
		const {THE_KEEP3R_GOVERNANCE} = getEnv(safeChainID);
		const resultsJobsCall = await readContracts({
			contracts: [
				{address: '0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B', abi: CVX_ABI, functionName: 'totalSupply'},
				{address: '0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B', abi: CVX_ABI, functionName: 'reductionPerCliff'},
				{address: '0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B', abi: CVX_ABI, functionName: 'totalCliffs'},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B')]}, //C]VX
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0x62B9c7356A2Dc64a1969e19C23e4f579F9810Aa7')]}, //cvxC]RV
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0')]}, //cvxF]XS
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0xd533a949740bb3306d119cc777fa900ba034cd52')]}, //C]RV
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44')]}, //KP]3R
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490')]}, //3C]RV
				{address: '0xbAFC4FAeB733C18411886A04679F11877D8629b1', abi: CONVEX_REWARDS_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0xbAFC4FAeB733C18411886A04679F11877D8629b1', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0x5b692073F141C31384faE55856CfB6CBfFE91E60')]},
				{address: '0x9BEc26bDd9702F4e0e4de853dd65Ec75F90b1F2e', abi: CONVEX_REWARDS_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x9BEc26bDd9702F4e0e4de853dd65Ec75F90b1F2e', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0x6Df0D77F0496CE44e72D695943950D8641fcA5Cf')]},
				{address: '0xAab7202D93B5633eB7FB3b80873C817B240F6F44', abi: CONVEX_REWARDS_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0xAab7202D93B5633eB7FB3b80873C817B240F6F44', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0x1570af3dF649Fc74872c5B8F280A162a3bdD4EB6')]},
				{address: '0x8C87E32000ADD1a7D7D69a1AE180C415AF769361', abi: CONVEX_REWARDS_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x8C87E32000ADD1a7D7D69a1AE180C415AF769361', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0xAcCe4Fe9Ce2A6FE9af83e7CF321a3fF7675e0AB6')]},
				{address: '0x58563C872c791196d0eA17c4E53e77fa1d381D4c', abi: CONVEX_REWARDS_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x58563C872c791196d0eA17c4E53e77fa1d381D4c', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0x5555f75e3d5278082200fb451d1b6ba946d8e13b')]},
				{address: '0x1900249c7a90D27b246032792004FF0E092Ac2cE', abi: CONVEX_REWARDS_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x1900249c7a90D27b246032792004FF0E092Ac2cE', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0xef04f337fCB2ea220B6e8dB5eDbE2D774837581c')]},
				{address: '0x0c2da920E577960f39991030CfBdd4cF0a0CfEBD', abi: CONVEX_REWARDS_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x0c2da920E577960f39991030CfBdd4cF0a0CfEBD', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0xFd5AbF66b003881b88567EB9Ed9c651F14Dc4771', abi: CONVEX_REWARDS_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0xFd5AbF66b003881b88567EB9Ed9c651F14Dc4771', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0x5a6A4D54456819380173272A5E8E9B9904BdF41B')]},
				{address: '0x22eE18aca7F3Ee920D01F25dA85840D12d98E8Ca', abi: CONVEX_REWARDS_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x22eE18aca7F3Ee920D01F25dA85840D12d98E8Ca', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x81fCe3E10D12Da6c7266a1A169c4C96813435263', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0xC25a3A3b969415c80451098fa907EC722572917F')]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f')]}, //S]NX
				{address: '0x769499A7B4093b2AA35E3F3C00B1ab5dc8EF7146', abi: CONVEX_REWARDS_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x769499A7B4093b2AA35E3F3C00B1ab5dc8EF7146', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x92dFd397b6d0B878126F5a5f6F446ae9Fc8A8356', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x19Ba12D57aD7B126dE898706AA6dBF7d6DC85FF8', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0xB37D6c07482Bc11cd28a1f11f1a6ad7b66Dec933')]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0x31429d1856aD1377A8A0079410B297e1a9e214c2')]}, //ANG]LE
				{address: '0xb1Fae59F23CaCe4949Ae734E63E42168aDb0CcB3', abi: CONVEX_REWARDS_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]}, // ibAUD+sA]UD
				{address: '0xb1Fae59F23CaCe4949Ae734E63E42168aDb0CcB3', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x91ad51F0897552ce77f76B44e9a86B4Ad2B28c25', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x040A6Ae6314e190974ee4839f3c2FBf849EF54Eb', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0x3F1B0278A9ee595635B61817630cC19DE792f506')]},
				{address: '0xa5A5905efc55B05059eE247d5CaC6DD6791Cfc33', abi: CONVEX_REWARDS_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]}, // ibCHF+sC]HF
				{address: '0xa5A5905efc55B05059eE247d5CaC6DD6791Cfc33', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x9D9EBCc8E7B4eF061C0F7Bab532d1710b874f789', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x1c86460640457466E2eC86916B4a91ED86CE0D1E', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0x9c2C8910F113181783c249d8F6Aa41b51Cde0f0c')]},
				{address: '0xCd0559ADb6fAa2fc83aB21Cf4497c3b9b45bB29f', abi: CONVEX_REWARDS_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]}, // ibEUR+sE]UR
				{address: '0xCd0559ADb6fAa2fc83aB21Cf4497c3b9b45bB29f', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x21034ccc4f8D07d0cF8998Fdd4c45e426540dEc1', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0xbA5eF047ce02cc0096DB3Bc8ED84aAD14291f8a0', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0x19b080FE1ffA0553469D20Ca36219F17Fcf03859')]},
				{address: '0x51a16DA36c79E28dD3C8c0c19214D8aF413984Aa', abi: CONVEX_REWARDS_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]}, // ibGBP+sG]BP
				{address: '0x51a16DA36c79E28dD3C8c0c19214D8aF413984Aa', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0xE689DB5D753abc411ACB8a3fEf226C08ACDAE13f', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x00A4f5d12E3FAA909c53CDcC90968F735633e988', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0xD6Ac1CB9019137a896343Da59dDE6d097F710538')]},
				{address: '0xbA8fE590498ed24D330Bb925E69913b1Ac35a81E', abi: CONVEX_REWARDS_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]}, // ibJPY+sJ]PY
				{address: '0xbA8fE590498ed24D330Bb925E69913b1Ac35a81E', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x771bc5c888d1B318D0c5b177e4F996d3D5fd3d18', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x8a3F52c2Eb02De2d8356a8286c96909352c62B10', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0x8818a9bb44Fbf33502bE7c15c500d0C783B73067')]},
				{address: '0x8F18C0AF0d7d511E8Bdc6B3c64926B04EDfE4892', abi: CONVEX_REWARDS_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]}, // ibKRW+sK]RW
				{address: '0x8F18C0AF0d7d511E8Bdc6B3c64926B04EDfE4892', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0xE3A64E08EEbf38b19a3d9fec51d8cD5A8898Dd5e', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x93649cd43635bC5F7Ad8fA2fa27CB9aE765Ec58A', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0x8461A004b50d321CB22B7d034969cE6803911899')]},
				{address: '0x3Fe65692bfCD0e6CF84cB1E7d24108E434A7587e', abi: CONVEX_REWARDS_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]}, // cvxCRV+C]RV
				{address: '0x3Fe65692bfCD0e6CF84cB1E7d24108E434A7587e', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x7091dbb7fcbA54569eF1387Ac89Eb2a5C9F6d2EA', abi: CONVEX_REWARDS_ABI, functionName: 'earned', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0x9D0464996170c6B9e75eED71c68B99dDEDf279e8')]},
				{address: '0xa258C4606Ca8206D8aA700cE2143D7db854D168c', abi: YEARN_VAULT_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0xa258C4606Ca8206D8aA700cE2143D7db854D168c')]},
				{address: '0xa258C4606Ca8206D8aA700cE2143D7db854D168c', abi: YEARN_VAULT_ABI, functionName: 'pricePerShare'},
				{address: '0x83d95e0D5f402511dB06817Aff3f9eA88224B030', abi: LENS_PRICE_ABI, functionName: 'getPriceUsdcRecommended', args: [toAddress('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')]},
				{address: '0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2', abi: CVX_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x72a19342e8F1838460eBFCCEf09F6585e32db86E', abi: LOCKED_CVX_ABI, functionName: 'balanceOf', args: [THE_KEEP3R_GOVERNANCE]},
				{address: '0x72a19342e8F1838460eBFCCEf09F6585e32db86E', abi: LOCKED_CVX_ABI, functionName: 'claimableRewards', args: [THE_KEEP3R_GOVERNANCE]}
			]
		});
		const claimable = await prepareWriteContract({
			address: '0xA464e6DCda8AC41e03616F95f4BC98a13b8922Dc',
			abi: CURVE_FEE_DISTRIBUTOR_ABI,
			functionName: 'claim',
			args: [THE_KEEP3R_GOVERNANCE]
		});

		let	rIndex = 0;
		const _treasury: TTreasury[] = [];
		// cvxStuffs //
		const cvxTotalSupply = decodeAsBigInt(resultsJobsCall[rIndex++]);
		const cvxReductionPerCliff = decodeAsBigInt(resultsJobsCall[rIndex++]);
		const cvxTotalCliffs = decodeAsBigInt(resultsJobsCall[rIndex++]);
		const reduction = cvxTotalCliffs - (cvxTotalSupply / (cvxReductionPerCliff || 1n));
		const cvxPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		const cvxCrvPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		const cvxFXSPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		const crvPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		const kp3rPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		const threeCRVPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);

		// ibAUD //
		const ibAUDStacked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibAUDEarned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibAUDPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		_treasury.push({
			name: 'ibAUD + USDC',
			protocol: 'Convex',
			rewards: 'CVX',
			tokenStaked: Number(ibAUDStacked.normalized),
			tokenStakedUSD: Number(ibAUDStacked.normalized) * Number(ibAUDPrice.normalized),
			unclaimedRewards: Number(ibAUDEarned.normalized),
			unclaimedRewardsUSD: (
				Number(ibAUDEarned.normalized) * Number(crvPrice.normalized)
				+
				Number(toNormalizedBN(ibAUDEarned.raw * reduction / cvxTotalCliffs).normalized) * Number(cvxPrice.normalized)
			)
		});

		// ibCHF //
		const ibCHFStacked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibCHFEarned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibCHFPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		_treasury.push({
			name: 'ibCHF + USDC',
			protocol: 'Convex',
			rewards: 'CVX',
			tokenStaked: Number(ibCHFStacked.normalized),
			tokenStakedUSD: Number(ibCHFStacked.normalized) * Number(ibCHFPrice.normalized),
			unclaimedRewards: Number(ibCHFEarned.normalized),
			unclaimedRewardsUSD: (
				Number(ibCHFEarned.normalized) * Number(crvPrice.normalized)
				+
				Number(toNormalizedBN(ibCHFEarned.raw * reduction / cvxTotalCliffs).normalized) * Number(cvxPrice.normalized)
			)
		});

		// ibEUR //
		const ibEURStacked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibEUREarned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibEURPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		_treasury.push({
			name: 'ibEUR + USDC',
			protocol: 'Convex',
			rewards: 'CVX',
			tokenStaked: Number(ibEURStacked.normalized),
			tokenStakedUSD: Number(ibEURStacked.normalized) * Number(ibEURPrice.normalized),
			unclaimedRewards: Number(ibEUREarned.normalized),
			unclaimedRewardsUSD: (
				Number(ibEUREarned.normalized) * Number(crvPrice.normalized)
				+
				Number(toNormalizedBN(ibEUREarned.raw * reduction / cvxTotalCliffs).normalized) * Number(cvxPrice.normalized)
			)
		});

		// ibGBP //
		const ibGBPStacked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibGBPEarned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibGBPPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		_treasury.push({
			name: 'ibGBP + USDC',
			protocol: 'Convex',
			rewards: 'CVX',
			tokenStaked: Number(ibGBPStacked.normalized),
			tokenStakedUSD: Number(ibGBPStacked.normalized) * Number(ibGBPPrice.normalized),
			unclaimedRewards: Number(ibGBPEarned.normalized),
			unclaimedRewardsUSD: (
				Number(ibGBPEarned.normalized) * Number(crvPrice.normalized)
				+
				Number(toNormalizedBN(ibGBPEarned.raw * reduction / cvxTotalCliffs).normalized) * Number(cvxPrice.normalized)
			)
		});

		// ibJPY //
		const ibJPYStacked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibJPYEarned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibJPYPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		_treasury.push({
			name: 'ibJPY + USDC',
			protocol: 'Convex',
			rewards: 'CVX',
			tokenStaked: Number(ibJPYStacked.normalized),
			tokenStakedUSD: Number(ibJPYStacked.normalized) * Number(ibJPYPrice.normalized),
			unclaimedRewards: Number(ibJPYEarned.normalized),
			unclaimedRewardsUSD: (
				Number(ibJPYEarned.normalized) * Number(crvPrice.normalized)
				+
				Number(toNormalizedBN(ibJPYEarned.raw * reduction / cvxTotalCliffs).normalized) * Number(cvxPrice.normalized)
			)
		});

		// ibKRW //
		const ibKRWStacked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibKRWEarned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibKRWPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		_treasury.push({
			name: 'ibKRW + USDC',
			protocol: 'Convex',
			rewards: 'CVX',
			tokenStaked: Number(ibKRWStacked.normalized),
			tokenStakedUSD: Number(ibKRWStacked.normalized) * Number(ibKRWPrice.normalized),
			unclaimedRewards: Number(ibKRWEarned.normalized),
			unclaimedRewardsUSD: (
				Number(ibKRWEarned.normalized) * Number(crvPrice.normalized)
				+
				Number(toNormalizedBN(ibKRWEarned.raw * reduction / cvxTotalCliffs).normalized) * Number(cvxPrice.normalized)
			)
		});

		// kp3rEth //
		const kp3rEthStacked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const kp3rEthCrvEarned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const kp3rEthPriceFormated = toNormalizedBN(kp3rEthPrice, 6);

		_treasury.push({
			name: 'kp3rEth',
			protocol: 'Convex',
			rewards: 'CVX',
			tokenStaked: Number(kp3rEthStacked.normalized),
			tokenStakedUSD: Number(kp3rEthStacked.normalized) * Number(kp3rEthPriceFormated.normalized),
			unclaimedRewards: Number(kp3rEthCrvEarned.normalized),
			unclaimedRewardsUSD: (
				Number(kp3rEthCrvEarned.normalized) * Number(crvPrice.normalized)
				+
				Number(toNormalizedBN(kp3rEthCrvEarned.raw * reduction / cvxTotalCliffs).normalized) * Number(cvxPrice.normalized)
			)
		});

		// mim3Crv //
		const mim3CrvStacked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const mim3CrvEarned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const mim3CrvPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		_treasury.push({
			name: 'mim3Crv',
			protocol: 'Convex',
			rewards: 'CVX',
			tokenStaked: Number(mim3CrvStacked.normalized),
			tokenStakedUSD: Number(mim3CrvStacked.normalized) * Number(mim3CrvPrice.normalized),
			unclaimedRewards: Number(mim3CrvEarned.normalized),
			unclaimedRewardsUSD: (
				Number(mim3CrvEarned.normalized) * Number(crvPrice.normalized)
				+
				Number(toNormalizedBN(mim3CrvEarned.raw * reduction / cvxTotalCliffs).normalized) * Number(cvxPrice.normalized)
			)
		});

		// crvSUSD //
		const crvSUSDStacked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const crvSUSDEarned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const crvSUSDExtra0Earned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const crvSUSDPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		const crvSUSDExtra0Price = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6); //SNX
		_treasury.push({
			name: 'crvSUSD',
			protocol: 'Convex',
			rewards: 'CVX',
			tokenStaked: Number(crvSUSDStacked.normalized),
			tokenStakedUSD: Number(crvSUSDStacked.normalized) * Number(crvSUSDPrice.normalized),
			unclaimedRewards: Number(crvSUSDEarned.normalized),
			unclaimedRewardsUSD: (
				Number(crvSUSDEarned.normalized) * Number(crvPrice.normalized)
				+
				Number(crvSUSDExtra0Earned.normalized) * Number(crvSUSDExtra0Price.normalized)
				+
				Number(toNormalizedBN(crvSUSDEarned.raw * reduction / cvxTotalCliffs).normalized) * Number(cvxPrice.normalized)
			)
		});

		// ibeur-ageur //
		const ibEURAgEURStacked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibEURAgEUREarned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibEURAgEURExtra1Earned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibEURAgEURExtra2Earned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibEURAgEURPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		const ibEURAgEURExtra1Price = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6); //ANGLE
		_treasury.push({
			name: 'ibEUR + AgEUR',
			protocol: 'Convex',
			rewards: 'CVX',
			tokenStaked: Number(ibEURAgEURStacked.normalized),
			tokenStakedUSD: Number(ibEURAgEURStacked.normalized) * Number(ibEURAgEURPrice.normalized),
			unclaimedRewards: Number(ibEURAgEUREarned.normalized),
			unclaimedRewardsUSD: (
				Number(ibEURAgEUREarned.normalized) * Number(crvPrice.normalized)
				+
				Number(ibEURAgEURExtra1Earned.normalized) * Number(ibEURAgEURExtra1Price.normalized)
				+
				Number(ibEURAgEURExtra2Earned.normalized) * Number(kp3rPrice.normalized)
				+
				Number(toNormalizedBN(ibEURAgEUREarned.raw * reduction / cvxTotalCliffs).normalized) * Number(cvxPrice.normalized)
			)
		});

		// ibAUD+sAUD
		const ibAUDsAUDStacked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibAUDsAUDEarned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibAUDsAUDExtra1Earned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibAUDsAUDExtra2Earned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibAUDsAUDPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		_treasury.push({
			name: 'ibAUD + sAUD',
			protocol: 'Convex',
			rewards: 'CVX',
			tokenStaked: Number(ibAUDsAUDStacked.normalized),
			tokenStakedUSD: Number(ibAUDsAUDStacked.normalized) * Number(ibAUDsAUDPrice.normalized),
			unclaimedRewards: Number(ibAUDsAUDEarned.normalized),
			unclaimedRewardsUSD: (
				Number(ibAUDsAUDEarned.normalized) * Number(crvPrice.normalized)
				+
				Number(ibAUDsAUDExtra1Earned.normalized) * Number(kp3rPrice.normalized)
				+
				Number(ibAUDsAUDExtra2Earned.normalized) * Number(cvxPrice.normalized)
				+
				Number(toNormalizedBN(ibAUDsAUDEarned.raw * reduction / cvxTotalCliffs).normalized) * Number(cvxPrice.normalized)
			)
		});

		// ibCHF+sCHF
		const ibCHFsCHFStacked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibCHFsCHFEarned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibCHFsCHFExtra1Earned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibCHFsCHFExtra2Earned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibCHFsCHFPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		_treasury.push({
			name: 'ibCHF + sCHF',
			protocol: 'Convex',
			rewards: 'CVX',
			tokenStaked: Number(ibCHFsCHFStacked.normalized),
			tokenStakedUSD: Number(ibCHFsCHFStacked.normalized) * Number(ibCHFsCHFPrice.normalized),
			unclaimedRewards: Number(ibCHFsCHFEarned.normalized),
			unclaimedRewardsUSD: (
				Number(ibCHFsCHFEarned.normalized) * Number(crvPrice.normalized)
				+
				Number(ibCHFsCHFExtra1Earned.normalized) * Number(kp3rPrice.normalized)
				+
				Number(ibCHFsCHFExtra2Earned.normalized) * Number(cvxPrice.normalized)
				+
				Number(toNormalizedBN(ibCHFsCHFEarned.raw * reduction / cvxTotalCliffs).normalized) * Number(cvxPrice.normalized)
			)
		});

		// ibEUR+sEUR
		const ibEURsEURStacked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibEURsEUREarned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibEURsEURExtra1Earned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibEURsEURExtra2Earned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibEURsEURPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		_treasury.push({
			name: 'ibEUR + sEUR',
			protocol: 'Convex',
			rewards: 'CVX',
			tokenStaked: Number(ibEURsEURStacked.normalized),
			tokenStakedUSD: Number(ibEURsEURStacked.normalized) * Number(ibEURsEURPrice.normalized),
			unclaimedRewards: Number(ibEURsEUREarned.normalized),
			unclaimedRewardsUSD: (
				Number(ibEURsEUREarned.normalized) * Number(crvPrice.normalized)
				+
				Number(ibEURsEURExtra1Earned.normalized) * Number(kp3rPrice.normalized)
				+
				Number(ibEURsEURExtra2Earned.normalized) * Number(cvxPrice.normalized)
				+
				Number(toNormalizedBN(ibEURsEUREarned.raw * reduction / cvxTotalCliffs).normalized) * Number(cvxPrice.normalized)
			)
		});

		// ibGBP+sGBP
		const ibGBPsGBPStacked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibGBPsGBPEarned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibGBPsGBPExtra1Earned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibGBPsGBPExtra2Earned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibGBPsGBPPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		_treasury.push({
			name: 'ibGBP + sGBP',
			protocol: 'Convex',
			rewards: 'CVX',
			tokenStaked: Number(ibGBPsGBPStacked.normalized),
			tokenStakedUSD: Number(ibGBPsGBPStacked.normalized) * Number(ibGBPsGBPPrice.normalized),
			unclaimedRewards: Number(ibGBPsGBPEarned.normalized),
			unclaimedRewardsUSD: (
				Number(ibGBPsGBPEarned.normalized) * Number(crvPrice.normalized)
				+
				Number(ibGBPsGBPExtra1Earned.normalized) * Number(kp3rPrice.normalized)
				+
				Number(ibGBPsGBPExtra2Earned.normalized) * Number(cvxPrice.normalized)
				+
				Number(toNormalizedBN(ibGBPsGBPEarned.raw * reduction / cvxTotalCliffs).normalized) * Number(cvxPrice.normalized)
			)
		});

		// ibJPY+sJPY
		const ibJPYsJPYStacked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibJPYsJPYEarned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibJPYsJPYExtra1Earned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibJPYsJPYExtra2Earned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibJPYsJPYPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		_treasury.push({
			name: 'ibJPY + sJPY',
			protocol: 'Convex',
			rewards: 'CVX',
			tokenStaked: Number(ibJPYsJPYStacked.normalized),
			tokenStakedUSD: Number(ibJPYsJPYStacked.normalized) * Number(ibJPYsJPYPrice.normalized),
			unclaimedRewards: Number(ibJPYsJPYEarned.normalized),
			unclaimedRewardsUSD: (
				Number(ibJPYsJPYEarned.normalized) * Number(crvPrice.normalized)
				+
				Number(ibJPYsJPYExtra1Earned.normalized) * Number(kp3rPrice.normalized)
				+
				Number(ibJPYsJPYExtra2Earned.normalized) * Number(cvxPrice.normalized)
				+
				Number(toNormalizedBN(ibJPYsJPYEarned.raw * reduction / cvxTotalCliffs).normalized) * Number(cvxPrice.normalized)
			)
		});

		// ibKRW+sKRW
		const ibKRWsKRWStacked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibKRWsKRWEarned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibKRWsKRWExtra1Earned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibKRWsKRWExtra2Earned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const ibKRWsKRWPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		_treasury.push({
			name: 'ibKRW + sKRW',
			protocol: 'Convex',
			rewards: 'CVX',
			tokenStaked: Number(ibKRWsKRWStacked.normalized),
			tokenStakedUSD: Number(ibKRWsKRWStacked.normalized) * Number(ibKRWsKRWPrice.normalized),
			unclaimedRewards: Number(ibKRWsKRWEarned.normalized),
			unclaimedRewardsUSD: (
				Number(ibKRWsKRWEarned.normalized) * Number(crvPrice.normalized)
				+
				Number(ibKRWsKRWExtra1Earned.normalized) * Number(kp3rPrice.normalized)
				+
				Number(ibKRWsKRWExtra2Earned.normalized) * Number(cvxPrice.normalized)
				+
				Number(toNormalizedBN(ibKRWsKRWEarned.raw * reduction / cvxTotalCliffs).normalized) * Number(cvxPrice.normalized)
			)
		});

		// cvxCRV+CRV
		const cvxCRVCRVStacked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const cvxCRVCRVEarned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const cvxCRVCRVExtra1Earned = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const cvxCRVCRVPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		_treasury.push({
			name: 'cvxCRV + CRV',
			protocol: 'Convex',
			rewards: 'CVX',
			tokenStaked: Number(cvxCRVCRVStacked.normalized),
			tokenStakedUSD: Number(cvxCRVCRVStacked.normalized) * Number(cvxCRVCRVPrice.normalized),
			unclaimedRewards: Number(cvxCRVCRVEarned.normalized),
			unclaimedRewardsUSD: (
				Number(cvxCRVCRVEarned.normalized) * Number(crvPrice.normalized)
				+
				Number(cvxCRVCRVExtra1Earned.normalized) * Number(threeCRVPrice.normalized)
				+
				Number(toNormalizedBN(cvxCRVCRVEarned.raw * reduction / cvxTotalCliffs).normalized) * Number(cvxPrice.normalized)
			)
		});

		// yvEth //
		const yvEthStacked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		rIndex++; // const pricePerShare = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		rIndex++; // const ethPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		const yvEthPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		_treasury.push({
			name: 'yvEth',
			protocol: 'Yearn',
			rewards: 'ETH',
			tokenStaked: Number(yvEthStacked.normalized),
			tokenStakedUSD: Number(yvEthStacked.normalized) * Number(yvEthPrice.normalized),
			unclaimedRewards: 0,
			unclaimedRewardsUSD: 0,
			hasNoRewards: true
		});

		//Locked CRV
		const crvLocked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const crvLockedExtraEarned = toBigInt(claimable.result);
		// const pricePerShare = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		// const ethPrice = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]), 6);
		_treasury.push({
			name: 'Locked CRV',
			protocol: 'Curve',
			rewards: '3CRV',
			tokenStaked: Number(crvLocked.normalized),
			tokenStakedUSD: Number(crvLocked.normalized) * Number(crvPrice.normalized),
			unclaimedRewards: Number(toNormalizedBN(crvLockedExtraEarned).normalized),
			unclaimedRewardsUSD: (
				Number(toNormalizedBN(crvLockedExtraEarned).normalized) * Number(threeCRVPrice.normalized)
			)
		});

		//Locked CVX
		const cvxLocked = toNormalizedBN(decodeAsBigInt(resultsJobsCall[rIndex++]));
		const cvxLockedExtraEarned = claimable;
		const cvxClaimableRewards = resultsJobsCall[rIndex++].result as {token: TAddress, amount: bigint}[];
		const isToken1CvxCrv = toAddress(cvxClaimableRewards?.[0].token) === toAddress('0x62B9c7356A2Dc64a1969e19C23e4f579F9810Aa7');
		const isToken2CvxFXs = toAddress(cvxClaimableRewards?.[1].token) === toAddress('0xFEEf77d3f69374f66429C91d732A244f074bdf74');
		_treasury.push({
			name: 'Locked CVX',
			protocol: 'Convex',
			rewards: 'CVX',
			tokenStaked: Number(cvxLocked.normalized),
			tokenStakedUSD: Number(cvxLocked.normalized) * Number(cvxPrice.normalized),
			unclaimedRewards: Number(toNormalizedBN(cvxLockedExtraEarned.result).normalized),
			unclaimedRewardsUSD: (
				(isToken1CvxCrv ? Number(toNormalizedBN(cvxClaimableRewards[0].amount).normalized) * Number(cvxCrvPrice.normalized) : 0)
				+
				(isToken2CvxFXs ? Number(toNormalizedBN(cvxClaimableRewards[1].amount).normalized) * Number(cvxFXSPrice.normalized) : 0)
			)
		});

		performBatchedUpdates((): void => {
			set_treasury(_treasury);
			set_nonce((n: number): number => n + 1);
		});
	}, [safeChainID]);

	useEffect((): void => {
		getTreasury();
	}, [getTreasury]);

	return (
		<TreasuryContext.Provider value={{treasury}}>
			{children}
		</TreasuryContext.Provider>
	);
};


export const useTreasury = (): TTreasuryContext => useContext(TreasuryContext);
export default useTreasury;

