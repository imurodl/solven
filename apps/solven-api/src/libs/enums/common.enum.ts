import { registerEnumType } from '@nestjs/graphql';

export enum Message {
	SOMETHING_WENT_WRONG = 'Something went wrong!',
	NO_DATA_FOUND = 'No data found!',
	CREATE_FAILED = 'Create failed!',
	UPDATE_FAILED = 'Update failed!',
	REMOVE_FAILED = 'Remove failed!',
	UPLOAD_FAILED = 'Upload failed!',
	BAD_REQUEST = 'Bad Request',

	USED_MEMBER_NICK_OR_PHONE = 'Already used member nick or phone!',
	NO_MEMBER_NICK = 'No member with that member nick!',
	BLOCKED_USER = 'You have been blocked!',
	WRONG_PASSWORD = 'Wrong password, try again!',
	NOT_AUTHENTICATED = 'You are not authenticated, please login first!',
	TOKEN_NOT_EXIST = 'Bearer Token is not provided!',
	ONLY_SPECIFIC_ROLES_ALLOWED = 'Allowed only for members with specific roles!',
	NOT_ALLOWED_REQUEST = 'Not Allowed Request!',
	PROVIDE_ALLOWED_FORMAT = 'Please provide jpg, jpeg or png images!',
	SELF_SUBSCRIPTION_DENIED = 'Self subscription is denied!',

	CAR_NOT_AVAILABLE = 'This car is not available for purchase!',
	OWN_CAR_ORDER_DENIED = 'You cannot order your own listing!',
	ORDER_ALREADY_OPEN = 'You already have an open order for this car!',
	ORDER_INVALID_TRANSITION = 'This action is not allowed for the current order status!',
	ORDER_NOT_PARTICIPANT = 'You are not a participant of this order!',
	RETURN_WINDOW_CLOSED = 'The return window for this order has closed!',
	REVIEW_REQUIRES_COMPLETED_ORDER = 'You can review a car only after completing a deal for it!',
	REVIEW_ALREADY_EXISTS = 'You already reviewed this deal!',
	COUPON_NOT_FOUND = 'Coupon not found!',
	COUPON_INACTIVE = 'Coupon is not active!',
	COUPON_EXPIRED = 'Coupon has expired!',
	COUPON_LIMIT_REACHED = 'Coupon usage limit reached!',
	COUPON_MIN_ORDER = 'Order total is below the coupon minimum!',
	COUPON_DUPLICATE = 'A coupon with this code already exists!',
	COUPON_PERCENT_RANGE = 'Percent discount must be between 1 and 100!',
	SELF_MESSAGE_DENIED = 'You cannot message yourself!',
	NOT_CONVERSATION_MEMBER = 'You are not a participant of this conversation!',
	DAILY_AI_LIMIT_REACHED = 'Daily AI request limit reached, please try again tomorrow!',
	AI_NOT_CONFIGURED = 'AI features are not configured on this server!',
	OAUTH_ACCOUNT_LINKED_ELSEWHERE = 'This account is already linked to another member!',
	OAUTH_NOT_CONFIGURED = 'This login method is not configured!',
	INVALID_OAUTH_DATA = 'Invalid authentication data!',
}

export enum Direction {
	ASC = 1,
	DESC = -1,
}
registerEnumType(Direction, { name: 'Direction' });
