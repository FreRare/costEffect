import {ObjectId} from 'mongodb';
import {User, UserDAO} from './models/user';
import {Expense, ExpenseDAO} from './models/expense';
import {Payment, PaymentDAO} from './models/payment';
import {GroupExpense, GroupExpenseDAO} from './models/group';

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

  async removeGroupById(id: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await this.gDAO.remove(id);
        if (res) {
          resolve(res);
        }
        reject(res);
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
  }

  async getGroupById(gid: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await this.gDAO.getById(gid);
        if (res) {
          resolve(res);
        }
        reject(res);
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
  }

  async updateGroup(g: GroupExpense): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await this.gDAO.update(g);
        if (res) {
          resolve(res);
        }
        reject(res);
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
  }

  async addExpense(e: Expense, gid: string): Promise<ObjectId> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(`Adding expense ${e.description}`);
        const res = await this.eDAO.insert(e);
        e.id = res.toHexString();
        console.log(`Adding expense ${e.id} to group ${gid}`);
        let group = await this.gDAO.getById(gid);
        group = await this.gDAO.populate(group);
        group.expenses.push(e);
        const updateRes = await this.gDAO.update(group);
        if (updateRes) {
          resolve(res);
        }
        reject(res);
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
  }

  async addPayment(e: Payment, gid: string): Promise<ObjectId> {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await this.pDAO.insert(e);
        e.id = res.toHexString();
        let group = await this.gDAO.getById(gid);
        await this.gDAO.populate(group);
        group.payments.push(e);
        const updateRes = await this.gDAO.update(group);
        if (updateRes) {
          resolve(res);
        }
        reject(res);
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
  }

  async removePayment(e: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await this.pDAO.remove(e);
        if (res) {
          resolve(res);
        }
        reject(res);
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
  }

  async removeExpense(e: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await this.eDAO.remove(e);
        if (res) {
          resolve(res);
        }
        reject(res);
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
