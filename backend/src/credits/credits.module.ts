import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CreditTransaction, CreditTransactionSchema } from '../schemas/credit-transaction.schema';
import { CreditLedgerService } from './credit-ledger.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CreditTransaction.name, schema: CreditTransactionSchema },
    ]),
  ],
  providers: [CreditLedgerService],
  exports: [CreditLedgerService],
})
export class CreditsModule {}
