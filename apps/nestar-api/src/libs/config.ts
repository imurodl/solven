import { ObjectId } from 'bson';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { T } from './types/common';

export const availableAgentSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews', 'memberRank'];
export const availableMemberSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews'];

export const availableOptions = ["carBarter, 'carRent"];
export const availablePropertySorts = [
	'createdAt',
	'carRank',
	'carViews',
	'carLikes',
	'carPrice',
	'updatedAt',
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
		localField: 'favoriteProperty.memberId',
		as: 'favoriteProperty.memberData',
	},
};

export const lookupVisited = {
	$lookup: {
		from: 'members',
		foreignField: '_id',
		localField: 'visitedProperty.memberId',
		as: 'visitedProperty.memberData',
	},
};
