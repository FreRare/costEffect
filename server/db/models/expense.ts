import {ObjectId, Db} from 'mongodb';
import {User, UserDAO} from './user';
import {CollectionInterfaceA, DAOError} from '../../interface';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: User;
  splitMethod: 'equal' | 'unequal';
  participants: User[];
}

export class ExpenseDAO extends CollectionInterfaceA<Expense> {
  constructor(db: Db, private userDAO: UserDAO) {
    super(db, 'expenses');
  }

  protected map(doc: any): Expense {
    let paidBy: User | null = null;
    this.userDAO.getById(doc.paidBy.toString()).then(u => {
      paidBy = u;
    });
    let participants: User[] = [];
    Promise.all(
      (doc.participants || []).map((id: ObjectId | string) => this.userDAO.getById(id.toString()))
    ).then((p: User[]) => {
      participants = p;
    });

    if (!paidBy) {
      throw new DAOError("DeserializationError", "Failed to find user for expense payer");
    }
    if (participants.length != doc.participants.length) {
      throw new DAOError("DeserializationError", "Participant numbers don't match");
    }

    return {
      id: doc._id.toHexString?.() || doc._id,
      description: doc.description,
      amount: doc.amount,
      paidBy,
      splitMethod: doc.splitMethod,
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
      splitMethod: rest.splitMethod,
      participants: rest.participants.map(p => new ObjectId(p.id))
    };
  }
}
