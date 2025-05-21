import {ObjectId, Db} from 'mongodb';
import {User, UserDAO} from './user';
import {CollectionInterfaceA, DAOError} from '../../interface';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: User;
  createdBy: User;
  splitMethod: 'equal' | 'unequal';
  splitAmounts: { id: string, amount: number }[] | undefined,
  participants: User[];
}

export class ExpenseDAO extends CollectionInterfaceA<Expense> {
  constructor(db: Db, private userDAO: UserDAO) {
    super(db, 'expenses');
  }

  protected async map(doc: any): Promise<Expense> {
    let paidBy: User;
    let participants: User[];
    paidBy = await this.userDAO.getById(doc.paidBy.toString());
    const createdBy = await this.userDAO.getById(doc.createdBy.toString());
    participants = await Promise.all(
      (doc.participants || []).map((id: ObjectId) => this.userDAO.getById(id.toHexString()))
    );
    if (participants.length != doc.participants.length) {
      throw new DAOError("DeserializationError", "Participant numbers don't match");
    }

    return {
      id: doc._id.toHexString?.() || doc._id,
      description: doc.description,
      amount: doc.amount,
      paidBy: paidBy!,
      createdBy: createdBy!,
      splitMethod: doc.splitMethod,
      splitAmounts: doc.splitAmounts,
      participants
    };
  }

  protected remap(expense: Expense): any {
    const {id, ...rest} = expense;
    return {
      _id: id ? new ObjectId(id) : new ObjectId(),
      description: rest.description,
      amount: rest.amount,
      paidBy: new ObjectId(rest.paidBy.id),
      createdBy: new ObjectId(rest.createdBy.id),
      splitMethod: rest.splitMethod,
      splitAmounts: rest.splitAmounts,
      participants: rest.participants.map(p => new ObjectId(p.id))
    };
  }
}
