import REGISTRY from 'utils/registry';

import type {NextApiRequest, NextApiResponse} from 'next';
import type {TRegistry} from 'utils/registry';

export default async function handler(_req: NextApiRequest, res: NextApiResponse): Promise<NextApiResponse<TRegistry> | any> {
	return res.status(200).json(REGISTRY);
}
