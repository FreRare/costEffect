import {User, UserDAO} from './user';
import {Expense, ExpenseDAO} from './expense';
import {Payment, PaymentDAO} from './payment';
import {CollectionInterfaceA} from '../../interface';
import {Db, ObjectId} from 'mongodb';

export interface GroupExpense {
  id: string;
  name: string;
  createdBy: User;
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

  protected async map(doc: any): Promise<GroupExpense> {
    const createdBy = await this.userDAO.getById(doc.createdBy.toString());
    return {
      id: doc._id.toHexString?.() || doc._id,
      name: doc.name,
      createdBy: createdBy,
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
    // console.group(`🔄 Populating group: ${group.name} (ID: ${group.id})`);
    //
    // console.groupCollapsed('👥 Members');
    // console.table(members.map(m => ({
    //   ID: m.id,
    //   Name: `${m.firstName} ${m.lastName}`,
    //   Email: m.email,
    // })));
    // console.groupEnd();
    //
    // console.groupCollapsed('💰 Expenses');
    // console.table(expenses.map(e => ({
    //   ID: e.id,
    //   Description: e.description,
    //   Amount: e.amount,
    //   PaidBy: e.paidBy?.id,
    //   SplitMethod: e.splitMethod,
    // })));
    // console.groupEnd();
    //
    // console.groupCollapsed('💸 Payments');
    // console.table(payments.map(p => ({
    //   ID: p.id,
    //   Description: p.description,
    //   Amount: p.amount,
    //   PaidBy: p.paidBy?.id,
    //   PaidTo: p.paidTo?.id,
    //   Issued: p.issued?.toISOString(),
    // })));
    // console.groupEnd();
    //
    // console.groupEnd(); // end group: Populating group

    return {
      ...group,
      members,
      expenses,
      payments,
    };
  }

  protected remap(group: GroupExpense): any {
    const {id, ...rest} = group;
    console.log(`Remapping group with creation date: ${rest.createdOn}`);
    return {
      _id: id ? new ObjectId(id) : new ObjectId(),
      name: rest.name,
      createdBy: new ObjectId(rest.createdBy.id),
      members: rest.members.map(m => new ObjectId(m.id)),
      expenses: rest.expenses.map(e => new ObjectId(e.id)),
      payments: rest.payments.map(p => new ObjectId(p.id)),
      createdOn: rest.createdOn?.toISOString?.(),
    };
  }
}
