import {Collection, Db, ObjectId} from 'mongodb';

export class DAOError extends Error {
  public type: DAOErrorType;
  public originalError?: unknown;

  constructor(type: DAOErrorType, message: string, originalError?: any) {
    super(message);
    this.name = 'DAOError';
    this.type = type;
    this.originalError = originalError;
    Error.captureStackTrace?.(this, DAOError);
  }
}

export type DAOErrorType =
  | 'NotFound'
  | 'DuplicateKey'
  | 'ValidationError'
  | 'ConnectionError'
  | 'UnknownError'
  | 'SerializationError'
  | 'DeserializationError'
  | 'QueryError';


export abstract class CollectionInterfaceA<T extends { id: string }> {
  protected abstract map(doc: any): Promise<T>;

  protected abstract remap(t: T): any;

  protected collection: Collection;

  protected constructor(protected db: Db, cName: string) {
    this.collection = db.collection(cName);
  }

  async getAllRaw(): Promise<any[]> {
    return this.collection.find().toArray()
  }

  async getAll(): Promise<T[]> {
    const raw = await this.getAllRaw();
    return await Promise.all(raw.map((r) => this.map(r)));
  }

  async getById(id: string): Promise<T> {
    const doc = await this.collection.findOne({_id: new ObjectId(id)});
    if (!doc) {
      throw new DAOError("NotFound", `Finding document with id ${id} failed!`);
    }
    return this.map(doc);
  }

  async insert(data: T): Promise<ObjectId> {
    const doc = this.remap(data);
    const insertRes = await this.collection.insertOne(doc);
    if (!insertRes.acknowledged) {
      throw new DAOError("QueryError", "Failed to insert document");
    }
    return insertRes.insertedId;
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({_id: new ObjectId(id)});
    return result.acknowledged;
  }

  async update(data: T): Promise<boolean> {
    const doc = this.remap(data);
    const res = await this.collection.replaceOne({_id: doc._id}, doc);
    return res.acknowledged;
  }
}
