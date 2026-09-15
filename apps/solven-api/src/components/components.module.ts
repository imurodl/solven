import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { CarModule } from './car/car.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { CarBrandModule } from './car-brand/car-brand.module';
import { NoticeModule } from './notice/notice.module';
import { ReviewModule } from './review/review.module';
import { CouponModule } from './coupon/coupon.module';
import { OrderModule } from './order/order.module';
import { MessageModule } from './message/message.module';
import { OAuthModule } from './oauth/oauth.module';
import { AiModule } from './ai/ai.module';
import { ServiceJobModule } from './service-job/service-job.module';
import { ActivityModule } from './activity/activity.module';

@Module({
	imports: [
		MemberModule,
		AuthModule,
		CarModule,
		BoardArticleModule,
		CommentModule,
		LikeModule,
		ViewModule,
		FollowModule,
		CarBrandModule,
		NoticeModule,
		ReviewModule,
		CouponModule,
		OrderModule,
		MessageModule,
		OAuthModule,
		AiModule,
		ServiceJobModule,
		ActivityModule,
	],
})
export class ComponentsModule {}
