import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { T } from '../../libs/types/common';
import { OrderStatus } from '../../libs/enums/order.enum';

const STATUS_TEXT: Record<OrderStatus, string> = {
	[OrderStatus.PENDING]: 'was received and is waiting for the seller to accept it',
	[OrderStatus.ACCEPTED]: 'was accepted by the seller — you can now pay the deposit',
	[OrderStatus.PAID]: 'deposit was received, the seller is preparing the car',
	[OrderStatus.DELIVERED]: 'is ready / delivered — please confirm once you have the car',
	[OrderStatus.COMPLETED]: 'is complete. Thank you for buying on Solven!',
	[OrderStatus.CANCELLED]: 'was cancelled',
	[OrderStatus.RETURN_REQUESTED]: 'return request was received',
	[OrderStatus.RETURNED]: 'was returned',
};

// Sends Telegram messages through the Bot API with plain fetch. Every call is
// fire-and-forget and silently disabled when TELEGRAM_BOT_TOKEN is unset.
@Injectable()
export class TelegramNotifyService {
	private readonly logger = new Logger(TelegramNotifyService.name);

	constructor(@InjectModel('Member') private readonly memberModel: Model<T>) {}

	private get token(): string | undefined {
		return process.env.TELEGRAM_BOT_TOKEN || undefined;
	}

	private async send(chatId: string, text: string): Promise<void> {
		if (!this.token) return;
		try {
			const res = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
			});
			if (!res.ok) this.logger.warn(`Telegram sendMessage ${res.status}: ${(await res.text()).slice(0, 120)}`);
		} catch (err: any) {
			this.logger.warn(`Telegram sendMessage failed: ${err?.message}`);
		}
	}

	public notifyMember(memberId: T, orderId: string, status: OrderStatus, carTitle?: string, total?: number): void {
		if (!this.token) return;
		this.memberModel
			.findById(memberId)
			.select('+memberTelegramId')
			.lean()
			.exec()
			.then((doc) => {
				const member = doc as T | null;
				if (!member?.memberTelegramId) return;
				const amount = total ? ` (total $${Number(total).toLocaleString('en-US')})` : '';
				const car = carTitle ? ` for <b>${carTitle}</b>` : '';
				return this.send(
					member.memberTelegramId,
					`🚗 Solven order <b>${orderId}</b>${car} ${STATUS_TEXT[status]}${amount}.`,
				);
			})
			.catch((err) => this.logger.warn(`notifyMember failed: ${err?.message}`));
	}

	public notifyAdminNewOrder(orderId: string, carTitle: string, total: number): void {
		const chatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
		if (!this.token || !chatId) return;
		this.send(chatId, `🆕 New order <b>${orderId}</b>: ${carTitle} — $${Number(total).toLocaleString('en-US')}`).catch(
			(err) => this.logger.warn(`notifyAdminNewOrder failed: ${err?.message}`),
		);
	}
}
