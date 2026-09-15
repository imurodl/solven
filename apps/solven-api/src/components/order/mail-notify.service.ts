import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { T } from '../../libs/types/common';
import { OrderStatus } from '../../libs/enums/order.enum';
import { getFrontendUrl } from '../../libs/config';

const SUBJECT: Record<OrderStatus, string> = {
	[OrderStatus.PENDING]: 'We received your order',
	[OrderStatus.ACCEPTED]: 'Your order was accepted — deposit due',
	[OrderStatus.PAID]: 'Deposit received',
	[OrderStatus.DELIVERED]: 'Your car is ready',
	[OrderStatus.COMPLETED]: 'Order complete — enjoy your car',
	[OrderStatus.CANCELLED]: 'Your order was cancelled',
	[OrderStatus.RETURN_REQUESTED]: 'Return request received',
	[OrderStatus.RETURNED]: 'Return processed',
};

// Order e-mails via the Resend REST API (no SDK). Disabled without RESEND_API_KEY.
@Injectable()
export class MailNotifyService {
	private readonly logger = new Logger(MailNotifyService.name);

	constructor(@InjectModel('Member') private readonly memberModel: Model<T>) {}

	private get apiKey(): string | undefined {
		return process.env.RESEND_API_KEY || undefined;
	}

	private html(orderId: string, status: OrderStatus, carTitle?: string, total?: number): string {
		const trackUrl = `${getFrontendUrl()}/order/tracking?id=${orderId}`;
		return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#181a20">
  <h2 style="margin:0 0 12px;color:#1f4ba6">Solven</h2>
  <p style="font-size:16px;margin:0 0 8px"><b>${SUBJECT[status]}</b></p>
  <p style="margin:0 0 8px">Order <b>${orderId}</b>${carTitle ? ` · ${carTitle}` : ''}${
		total ? ` · $${Number(total).toLocaleString('en-US')}` : ''
	}</p>
  <p style="margin:16px 0"><a href="${trackUrl}" style="background:#1f4ba6;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Track your order</a></p>
  <p style="font-size:12px;color:#888">You receive this e-mail because you placed an order on solven.uz.</p>
</div>`;
	}

	public notifyMember(memberId: T, orderId: string, status: OrderStatus, carTitle?: string, total?: number): void {
		if (!this.apiKey) return;
		this.memberModel
			.findById(memberId)
			.lean()
			.exec()
			.then(async (doc) => {
				const member = doc as T | null;
				if (!member?.memberEmail) return;
				const res = await fetch('https://api.resend.com/emails', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
					body: JSON.stringify({
						from: process.env.MAIL_FROM || 'Solven <onboarding@resend.dev>',
						to: [member.memberEmail],
						subject: `${SUBJECT[status]} · ${orderId}`,
						html: this.html(orderId, status, carTitle, total),
					}),
				});
				if (!res.ok) this.logger.warn(`Resend ${res.status}: ${(await res.text()).slice(0, 120)}`);
			})
			.catch((err) => this.logger.warn(`notifyMember failed: ${err?.message}`));
	}
}
