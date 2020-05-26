import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getRepository, getCustomRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface ImportTransaction {
  title: string;
  type: 'income' | 'outcome' | undefined;
  value: number;
  category: string;
}
class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', filename);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const importedCategories: string[] = [];
    const importedTransactions: ImportTransaction[] = [];

    parseCSV.on('data', async ([title, type, value, category]) => {
      importedCategories.push(category);
      importedTransactions.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });
    await fs.promises.unlink(csvFilePath);

    const categoryRepository = getRepository(Category);
    const existingCategories = await categoryRepository.find({
      where: { title: In(importedCategories) },
    });
    const newCategories = importedCategories
      .filter((elem, index, self) => index === self.indexOf(elem))
      .filter(
        importedCategory =>
          !existingCategories
            .map(existingCategory => existingCategory.title)
            .includes(importedCategory),
      );

    const addCategories = newCategories.map(newCategorie =>
      categoryRepository.create({ title: newCategorie }),
    );
    const addedCategories = await categoryRepository.save(addCategories);
    const categories = [...existingCategories, ...addedCategories];

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transactions = transactionsRepository.create(
      importedTransactions.map(importedTransaction => ({
        title: importedTransaction.title,
        type: importedTransaction.type,
        value: importedTransaction.value,
        category: categories.find(
          category => category.title === importedTransaction.category,
        ),
      })),
    );

    return transactionsRepository.save(transactions);
  }
}

export default ImportTransactionsService;
