import {ObjectId} from 'mongodb';
import {User, UserDAO} from './models/user';
import {ExpenseDAO} from './models/expense';
import {PaymentDAO} from './models/payment';

class DAO {
  private static instance: DAO | null = null;
  private readonly uDAO: UserDAO;
  private readonly eDAO: ExpenseDAO;
  private readonly pDAO: PaymentDAO;

  public static async getInstance(client: any) {
    if (!DAO.instance) {
      DAO.instance = new DAO(client);
      await DAO.instance.connectToDB("cluster0");
    }
    return DAO.instance;
  }

  private constructor(private client: any) {
    this.uDAO = new UserDAO(this.client.db('users'));
    this.eDAO = new ExpenseDAO(this.client.db('expenses'), this.uDAO);
    this.pDAO = new PaymentDAO(this.client.db('payments'), this.uDAO);
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
    })
  }


  close() {
    this.client.close();
  }
}

export default DAO;
