import {User, UserDAO} from './user';
import {CollectionInterfaceA, DAOError} from '../../interface';
import {Db, ObjectId} from 'mongodb';

export interface Payment {
  id: string;
  description: string;
  amount: number;
  paidBy: User;
  paidTo: User;
  createdBy: User;
  issued: Date;
}

export class PaymentDAO extends CollectionInterfaceA<Payment> {
  constructor(db: Db, private userDAO: UserDAO) {
    super(db, 'payments');
  }

  protected async map(doc: any): Promise<Payment> {
    const paidBy = await this.userDAO.getById(doc.paidBy.toString());
    const paidTo = await this.userDAO.getById(doc.paidTo.toString());
    const createdBy = await this.userDAO.getById(doc.createdBy.toString());
    if (!paidBy || !paidTo || !createdBy) {
      throw new DAOError('DeserializationError', `Payment participant getting failed! No user found for id: ${paidTo === null ? doc.paidTo.toString() : doc.paidBy.toString()}`);
    }
    return {
      id: doc._id.toHexString?.() || doc._id,
      description: doc.description,
      amount: doc.amount,
      paidBy: paidBy,
      paidTo: paidTo,
      createdBy: createdBy,
      issued: new Date(doc.issued)
    };
  }

  protected remap(payment: Payment): any {
    const {id, ...rest} = payment;
    return {
      _id: id ? new ObjectId(id) : new ObjectId(),
      description: rest.description,
      amount: rest.amount,
      paidBy: new ObjectId(rest.paidBy.id),
      paidTo: new ObjectId(rest.paidTo.id),
      createdBy: new ObjectId(rest.createdBy.id),
      issued: rest.issued.toISOString?.()
    };
  }
}
