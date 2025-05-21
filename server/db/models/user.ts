import {Db, ObjectId} from 'mongodb';
import {CollectionInterfaceA, DAOError} from '../../interface';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  password?: string;
  isAdmin: boolean;
  dateOfBirth?: Date;
  registrationDate?: Date;
}

export class UserDAO extends CollectionInterfaceA<User> {
  constructor(db: Db) {
    super(db, 'users');
  }

  protected async map(doc: any): Promise<User> {
    return {
      id: doc._id.toHexString?.() || doc._id, // handle both ObjectId and string
      email: doc.email || '',
      username: doc.username || '',
      firstName: doc.firstName || '',
      lastName: doc.lastName || '',
      password: doc.password || '',
      isAdmin: doc.isAdmin ?? false,
      dateOfBirth: doc.dateOfBirth ? new Date(doc.dateOfBirth) : undefined,
      registrationDate: doc.registrationDate ? new Date(doc.registrationDate) : undefined,
    };
  }

  protected remap(user: User): any {
    const {id, ...rest} = user;
    return {
      _id: id ? new ObjectId(id) : new ObjectId(), // optional: generate if not provided
      email: rest.email,
      username: rest.username,
      firstName: rest.firstName,
      lastName: rest.lastName,
      password: rest.password,
      isAdmin: rest.isAdmin,
      dateOfBirth: rest.dateOfBirth?.toISOString?.(),
      registrationDate: rest.registrationDate?.toISOString?.(),
    };
  }

  async getByUsernameOrEmail(u: string): Promise<User> {
    const doc = await this.collection.findOne({$or: [{username: u}, {email: u}]});
    if (!doc) {
      throw new DAOError("NotFound", `Finding user with ${u} failed`);
    }
    return this.map(doc);
  }
}
