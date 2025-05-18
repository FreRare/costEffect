import {User, UserDAO} from './user';
import {Expense, ExpenseDAO} from './expense';
import {Payment, PaymentDAO} from './payment';
import {CollectionInterfaceA} from '../../interface';
import {Db, ObjectId} from 'mongodb';

export interface GroupExpense {
  id: string;
  name: string;
  members: User[];
  expenses: Expense[];
  payments: Payment[];
  createdOn: Date;
}

export class GroupExpenseDAO extends CollectionInterfaceA<GroupExpense> {
  constructor(
    db: Db,
    private userDAO: UserDAO,
    private expenseDAO: ExpenseDAO,
    private paymentDAO: PaymentDAO
  ) {
    super(db, 'groupExpenses');
  }

  protected map(doc: any): GroupExpense {
    return {
      id: doc._id.toHexString?.() || doc._id,
      name: doc.name,
      members: doc.members || [],        // just IDs
      expenses: doc.expenses || [],      // just IDs
      payments: doc.payments || [],      // just IDs
      createdOn: new Date(doc.createdOn),
    };
  }

  async populate(group: GroupExpense): Promise<any> {
    const members = await Promise.all(group.members.map(u => this.userDAO.getById(u.id)));
    const expenses = await Promise.all(group.expenses.map(e => this.expenseDAO.getById(e.id)));
    const payments = await Promise.all(group.payments.map(p => this.paymentDAO.getById(p.id)));

    return {
      ...group,
      members,
      expenses,
      payments
    };
  }


  protected remap(group: GroupExpense): any {
    const {id, ...rest} = group;
    return {
      _id: id ? new ObjectId(id) : new ObjectId(),
      name: rest.name,
      members: rest.members.map(m => new ObjectId(m.id)),
      expenses: rest.expenses.map(e => new ObjectId(e.id)),
      payments: rest.payments.map(p => new ObjectId(p.id)),
      createdOn: rest.createdOn.toISOString()
    };
  }
}
