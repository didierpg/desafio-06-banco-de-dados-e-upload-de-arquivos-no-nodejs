import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const incomeTransactions = transactions.map(transaction => transaction.type === 'income' ? transaction.value : 0);
    const outcomeTransactions = transactions.map(transaction => transaction.type === 'outcome' ? transaction.value : 0);
    const income = incomeTransactions.reduce((accumulator, currentValue) => accumulator + currentValue,0);
    const outcome = outcomeTransactions.reduce((accumulator, currentValue) => accumulator + currentValue,0);
    const total = income - outcome;

    return { income, outcome, total };
  }
}

export default TransactionsRepository;
