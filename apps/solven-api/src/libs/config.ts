import { ObjectId } from 'bson';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { T } from './types/common';
import { CarOptions } from './enums/car.enum';

export const availableAgentSorts = [
	'createdAt',
	'updatedAt',
	'memberLikes',
	'memberViews',
	'memberRank',
	'memberRating',
	'memberCars',
];
export const availableMemberSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews'];

export const availableOptions = ['carBarter', 'carRent'];
export const availableCarOptions = Object.values(CarOptions);
export const availableCarSorts = [
	'createdAt',
	'carRank',
	'carViews',
	'carLikes',
	'carPrice',
	'updatedAt',
	'carRating',
	'carSoldCount',
	'carMileage',
	'manufacturedAt',
];

export const availableArticleOptions = ['createdAt', 'updatedAt', 'articleLikes', 'articleViews'];

export const availableCommentSorts = ['createdAt', 'updatedAt'];

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];
export const getSerialForImage = (filename: string) => {
	const ext = path.parse(filename).ext;
	return uuidv4() + ext;
};

export const shapeIntoMongoObjectId = (target: any) => {
	return typeof target === 'string' ? new ObjectId(target) : target;
};

// Case-insensitive contains-match for user-supplied search text. Escapes regex
// metacharacters (prevents ReDoS / pattern injection) and caps the length.
export const buildSearchRegex = (text: string): RegExp => {
	const safe = String(text ?? '')
		.slice(0, 100)
		.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(safe, 'i');
};

// Upload targets map 1:1 to sub-directories of ./uploads. Anything else is rejected.
export const uploadTargets = ['car', 'member', 'article', 'car-brand', 'review', 'service', 'model'] as const;
export type UploadTarget = (typeof uploadTargets)[number];

export const ensureUploadDirs = (): void => {
	for (const target of uploadTargets) {
		fs.mkdirSync(path.join('uploads', target), { recursive: true });
	}
};

// CORS allowlist: FRONTEND_URL is a comma-separated list of origins. Localhost
// dev origins are always allowed outside production.
export const getAllowedOrigins = (): string[] => {
	const fromEnv = (process.env.FRONTEND_URL || 'https://solven.uz,https://www.solven.uz')
		.split(',')
		.map((o) => o.trim())
		.filter(Boolean);
	if (process.env.NODE_ENV !== 'production') {
		fromEnv.push('http://localhost:3000', 'http://localhost:3006');
	}
	return Array.from(new Set(fromEnv));
};

// The frontend origin to redirect to after OAuth (first https origin in production).
export const getFrontendUrl = (): string => {
	const origins = getAllowedOrigins();
	if (process.env.NODE_ENV === 'production') return origins.find((o) => o.startsWith('https://')) || origins[0];
	return origins.find((o) => o.includes('localhost')) || origins[0];
};

export const lookupAuthMemberLiked = (memberId: T, targetRefId: string = '$_id') => {
	return {
		$lookup: {
			from: 'likes',
			let: {
				localMemberId: memberId,
				localLikeRefId: targetRefId,
				localMyFavorite: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [{ $eq: ['$memberId', '$$localMemberId'] }, { $eq: ['$likeRefId', '$$localLikeRefId'] }],
						},
					},
				},
				{
					$project: {
						_id: 0,
						memberId: 1,
						likeRefId: 1,
						myFavorite: '$$localMyFavorite',
					},
				},
			],
			as: 'meLiked',
		},
	};
};

interface lookupFollowInput {
	followerId: T;
	followingId: string;
}

export const lookupAuthMemberFollowed = (input: lookupFollowInput) => {
	return {
		$lookup: {
			from: 'follows',
			let: {
				localFollowerId: input.followerId,
				localFollowingId: input.followingId,
				localMyFavorite: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [{ $eq: ['$followerId', '$$localFollowerId'] }, { $eq: ['$followingId', '$$localFollowingId'] }],
						},
					},
				},
				{
					$project: {
						_id: 0,
						followerId: 1,
						followingId: 1,
						myFollowing: '$$localMyFavorite',
					},
				},
			],
			as: 'meFollowed',
		},
	};
};

export const lookupMember = {
	$lookup: {
		from: 'members',
		localField: 'memberId',
		foreignField: '_id',
		as: 'memberData',
	},
};

export const lookupFollowingData = {
	$lookup: {
		from: 'members',
		localField: 'followingId',
		foreignField: '_id',
		as: 'followingData',
	},
};

export const lookupFollowerData = {
	$lookup: {
		from: 'members',
		localField: 'followerId',
		foreignField: '_id',
		as: 'followerData',
	},
};

export const lookupFavorite = {
	$lookup: {
		from: 'members',
		foreignField: '_id',
		localField: 'favoriteCar.memberId',
		as: 'favoriteCar.memberData',
	},
};

export const lookupVisited = {
	$lookup: {
		from: 'members',
		foreignField: '_id',
		localField: 'visitedCar.memberId',
		as: 'visitedCar.memberData',
	},
};
