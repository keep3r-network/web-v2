import REGISTRY from 'utils/registry';

import type {NextApiRequest, NextApiResponse} from 'next';
import type {TRegistry} from 'utils/registry';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<NextApiResponse<TRegistry> | any> {
	const chainID = Number(req.query.chainID as string);
	return res.status(200).json(REGISTRY[chainID] || {});
}
