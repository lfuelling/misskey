import $ from 'cafy';
import { StringID, NumericalID } from '../../../../misc/cafy-id';
import DriveFile, { packMany } from '../../../../models/drive-file';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': 'ドライブのファイル一覧を取得します。',
		'en-US': 'Get files of drive.'
	},

	tags: ['drive'],

	requireCredential: true,

	kind: 'drive-read',

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

		folderId: {
			validator: $.optional.nullable.type(NumericalID),
			default: null as any,
		},

		type: {
			validator: $.optional.str.match(/^[a-zA-Z\/\-\*]+$/)
		}
	},

	res: {
		type: 'array',
		items: {
			type: 'DriveFile',
		},
	},
};

export default define(meta, async (ps, user) => {
	const sort = {
		id: -1
	};

	const query = {
		userId: user.id,
		'metadata.folderId': ps.folderId,
		'metadata.deletedAt': { $exists: false }
	} as any;

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

	if (ps.type) {
		query.contentType = new RegExp(`^${ps.type.replace(/\*/g, '.+?')}$`);
	}

	const files = await DriveFile
		.find(query, {
			limit: ps.limit,
			sort: sort
		});

	return await packMany(files, { detail: false, self: true });
});
