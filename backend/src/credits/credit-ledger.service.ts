import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { CreditTransaction, CreditTransactionDocument } from '../schemas/credit-transaction.schema';
import { CreditTransactionType } from '@palmsight/shared';

export interface RecordCreditTransactionDto {
  userId: Types.ObjectId;
  amount: number;
  type: CreditTransactionType;
  balanceAfter: number;
  readingId?: Types.ObjectId;
  referralId?: Types.ObjectId;
  note?: string;
}

@Injectable()
export class CreditLedgerService {
  constructor(
    @InjectModel(CreditTransaction.name)
    private readonly creditTransactionModel: Model<CreditTransactionDocument>,
  ) {}

  async recordWithSession(
    dto: RecordCreditTransactionDto,
    session: ClientSession,
  ): Promise<CreditTransactionDocument> {
    const [record] = await this.creditTransactionModel.create(
      [
        {
          userId: dto.userId,
          amount: dto.amount,
          type: dto.type,
          balanceAfter: dto.balanceAfter,
          readingId: dto.readingId,
          referralId: dto.referralId,
          note: dto.note,
        },
      ],
      { session },
    );

    return record;
  }
}
