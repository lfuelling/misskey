import $ from 'cafy';
import { StringID, NumericalID } from '../../../../misc/cafy-id';
import Report, { packMany } from '../../../../models/abuse-user-report';
import define from '../../define';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(NumericalID),
		},

		untilId: {
			validator: $.optional.type(NumericalID),
		},
	}
};

export default define(meta, async (ps) => {
	const sort = {
		id: -1
	};
	const query = {} as any;
	if (ps.sinceId) {
		sort.id = 1;
		query.id = {
			$gt: ps.sinceId
		};
	} else if (ps.untilId) {
		query.id = {
			$lt: ps.untilId
		};
	}

	const reports = await Report
		.find(query, {
			limit: ps.limit,
			sort: sort
		});

	return await packMany(reports);
});
