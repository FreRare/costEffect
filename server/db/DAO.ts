import {ObjectId} from 'mongodb';
import {User, UserDAO} from './models/user';
import {ExpenseDAO} from './models/expense';
import {PaymentDAO} from './models/payment';
import {GroupExpense, GroupExpenseDAO} from './models/group';
import {resolve} from 'node:path';

class DAO {
  private static instance: DAO | null = null;
  private readonly uDAO: UserDAO;
  private readonly eDAO: ExpenseDAO;
  private readonly pDAO: PaymentDAO;
  private readonly gDAO: GroupExpenseDAO;
  private readonly db;

  public static async getInstance(client: any) {
    if (!DAO.instance) {
      DAO.instance = new DAO(client);
      await DAO.instance.connectToDB("cluster0");
    }
    return DAO.instance;
  }

  private constructor(private client: any) {
    this.db = this.client.db('costEffect');
    this.uDAO = new UserDAO(this.db);
    this.eDAO = new ExpenseDAO(this.db, this.uDAO);
    this.pDAO = new PaymentDAO(this.db, this.uDAO);
    this.gDAO = new GroupExpenseDAO(this.db, this.uDAO, this.eDAO, this.pDAO);
  }

  async connectToDB(name: string) {
    await this.client.connect();
    console.log("DB connected");
    const DB = await this.client.db(name);
    (await DB.collections()).forEach((c: any) => console.log(c.name));
  }

  async listDatabases() {
    const dbList = await this.client.db().admin().listDatabases();
    console.log("DB-s:");
    dbList.databases.forEach((db: any) => console.log(db.name));
  }

  async getUsers() {
    return await this.uDAO.getAll();
  }

  async createUser(u: User): Promise<ObjectId> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.uDAO.insert(u);
        console.log(`Inserted new user ${u.username} assigned id: ${result.toHexString()}`);
        resolve(result);
      } catch (e: any) {
        console.error(`Error while creating user: ${e}`);
        reject(`Error while creating user: ${e}`);
      }
    });
  }

  async getUser(id: string): Promise<User> {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await this.uDAO.getById(id);
        console.log("Got user");
        resolve(res);
      } catch (e) {
        console.error(`Error while getting user: ${e}`);
        reject(e);
      }
    })
  }

  async getUserForLogin(u: string): Promise<User> {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await this.uDAO.getByUsernameOrEmail(u);
        console.log("Got user");
        resolve(res);
      } catch (e) {
        console.error(`Error while getting user: ${e}`);
        reject(e);
      }
    });
  }

  async insertGroup(g: GroupExpense): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.gDAO.insert(g);
        console.log(`Created group with id: ${result.toHexString()}`);
        resolve(result.toHexString());
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
  }

  async getGroupsByUserId(uid: string): Promise<GroupExpense[]> {
    return new Promise(async (resolve, reject) => {
      try {
        let populated: GroupExpense[] = [];
        const result: GroupExpense[] = await this.gDAO.getAll();
        for (const gru of result) {
          const group = await this.gDAO.populate(gru);
          populated.push(group);
        }
        const final = populated.filter(g => g.members.map(u => u.id).includes(uid));
        resolve(final);
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
  }


  close() {
    this.client.close();
  }
}

export default DAO;
