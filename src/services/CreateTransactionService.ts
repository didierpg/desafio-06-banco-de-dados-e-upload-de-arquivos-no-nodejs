import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category: categoryTitle,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const { total } = await transactionsRepository.getBalance();
    const ammount = value;
    if (type === 'outcome' && ammount >= total) {
      throw new AppError(
        `Não é possível retirar o valor ${ammount} de um saldo de ${total}`,
      );
    }

    const categoryRepository = getRepository(Category);
    const category =
      (await categoryRepository.findOne({
        where: {
          title: categoryTitle,
        },
      })) ??
      (await categoryRepository.save(
        categoryRepository.create({ title: categoryTitle }),
      ));

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
