import * as CFG from './config';

CFG.DotenvConfig();
const express = require('express');
import {MongoClient} from 'mongodb';
import DAO from './db/DAO';
import {DAOError} from './interface';
import {User} from './db/models/user';
import {GroupExpense} from './db/models/group';
import {Payment} from './db/models/payment';
import {Expense} from './db/models/expense';

const cors = require('cors');
const path = require('path');

export const app = express();
export const MONGO_CLIENT = new MongoClient(process.env.DB_CONN_URL);
let dao: DAO;
DAO.getInstance(MONGO_CLIENT).then(d => {
  dao = d;
});
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../cost-effect/browser')));

app.get("/", (req: any, res: any) => {
  res.sendFile(path.join(__dirname, '../cost-effect/browser/index.csr.html'))
});

app.post("/login", (req: any, res: any) => {
  const {username, password} = req.body;
  console.log("Login for: ", username);
  dao.getUserForLogin(username).then((u) => {
    if (u.password === password) {
      res.status(200).send({success: true, user: u});
    } else {
      res.status(401).send({success: false, error: "Invalid username or password"});
    }
  }).catch((e) => {
    if (e instanceof DAOError && e.type === "NotFound") {
      res.status(401).send({success: false, error: "Invalid username or password"});
    } else {
      res.status(500).send({success: false, error: "Invalid username or password"});
    }
  })
});

app.post("/register", (req: any, res: any) => {
  const {username, email, firstName, lastName, password, isAdmin, dateOfBirth, registrationDate} = req.body;
  console.log(`Registration of: ${firstName} ${lastName} as ${username} - ${dateOfBirth} - ${email} on ${registrationDate} with ${isAdmin ? "admin" : "general"} rights`);
  const user: User = {
    id: '',
    email: email,
    username: username,
    firstName: firstName,
    lastName: lastName,
    dateOfBirth: dateOfBirth,
    isAdmin: isAdmin,
    password: password,
    registrationDate: registrationDate
  };
  dao.createUser(user).then((insertId) => {
    res.status(200).send({inserted: insertId, newUser: user});
  }).catch((e) => {
    res.status(500).send({error: e});
  });
});

app.get("/users", (req: any, res: any) => {
  const actionParam = 'all';
  console.log(`Getting users for action: ${actionParam}`);
  switch (actionParam) {
    case "all": {
      dao.getUsers().then(u => {
        res.status(200).send({success: true, users: u.map(({password, ...rest}) => rest)});
      }).catch(e => {
        res.status(500).send({success: false, error: e});
      });
      break;
    }
    // Default is any ID
    default:
      dao.getUser(actionParam)
        .then(user => {
          if (!user) return res.status(404).send({success: false, message: "User not found"});
          const {password, ...safeUser} = user;
          res.status(200).send({success: true, user: safeUser});
        })
        .catch(e => {
          res.status(500).send({success: false, error: e});
        });
      break;
  }
});

app.post("/group/create", (req: any, res: any) => {
  const {name, members, createdOn, createdBy} = req.body;
  console.log(`GROUP Received: ${name} - ${createdBy}`);

  if (!name || !Array.isArray(members) || members.length === 0) {
    return res.status(400).send({error: "Missing or invalid group data."});
  }
  console.log(`Creating group "${name}" with members:`, members);
  const group: GroupExpense = {
    id: '',
    name: name,
    createdBy: {id: createdBy} as User,
    members: members.map(mem => ({id: mem} as User)),
    expenses: [],
    payments: [],
    createdOn: createdOn ? new Date(createdOn) : new Date()
  };
  dao.insertGroup(group)
    .then((insertedId: string) => {
      res.status(200).send({inserted: insertedId, newGroup: group});
    })
    .catch((e: any) => {
      console.error("Error inserting group:", e);
      res.status(500).send({error: e});
    });
});

app.get("/group/:id", (req: any, res: any) => {
  const id = req.params.id;
  if (id === 'all') {
    // Get all
  } else {
    dao.getGroupsByUserId(id).then((g: GroupExpense[]) => {
      res.status(200).send({success: true, groups: g});
    }).catch(e => {
      res.status(500).send({error: e});
    });
  }
});

app.post("/group/update", (req: any, res: any) => {
  const group: GroupExpense = req.body;
  console.log(`Updating group: ${group.name}`);
  dao.updateGroup(group).then(() => {
    res.status(200).send({success: true});
  }).catch(e => {
    res.status(500).send({success: false, error: e});
  })
});

app.post("/group/remove", (req: any, res: any) => {
  const {removeId} = req.body;
  console.log(`Removing group: ${removeId}`);
  dao.removeGroupById(removeId).then(() => {
    res.status(200).send({success: true});
  }).catch(e => {
    res.status(500).send({success: false, error: e});
  });
});

app.post("/group/exp/create", (req: any, res: any) => {
  const {groupId, expense} = req.body;
  let p: Expense;
  dao.getUsers().then(u => {
    const payer = u.find(us => us.id === expense.paidBy);
    const createdBy = u.find(us => us.id === expense.createdBy);
    const party = u.filter(us => expense.participants.map((pa: User) => pa.id === us.id));
    p = {
      id: '',
      description: expense.description,
      amount: expense.amount,
      paidBy: payer!,
      createdBy: createdBy!,
      splitMethod: expense.splitMethod,
      splitAmounts: expense.splitAmounts,
      participants: party,
    };
    dao.addExpense(p!, groupId).then(id => {
      res.status(200).send({success: true, newId: id});
    }).catch(e => {
      res.status(500).send({success: false, error: e});
    });
  });
});

app.post("/group/pay/create", (req: any, res: any) => {
  const {groupId, payment} = req.body;
  let p: Payment;
  dao.getUsers().then(u => {
    const payer = u.find(us => us.id === payment.paidBy);
    const payto = u.find(us => us.id === payment.paidTo);
    const createdBy = u.find(us => us.id === payment.createdBy);
    if (!payer || !payto || !createdBy) {
      console.error(`Failed to get participants! ${createdBy}: ${payer} => ${payto}`);
      res.status(400).send({success: false, error: "Failed to get users!"});
    }
    p = {
      id: '',
      description: payment.description,
      amount: payment.amount,
      paidBy: payer!,
      paidTo: payto!,
      createdBy: createdBy!,
      issued: payment.issued,
    };
    dao.addPayment(p!, groupId).then(id => {
      res.status(200).send({success: true, newId: id});
    }).catch(e => {
      res.status(500).send({success: false, error: e});
    });
  });
});

app.post("/payment/delete", (req: any, res: any) => {
  const {paymentId} = req.body;
  dao.removePayment(paymentId).then(() => {
    res.status(200).send({success: true});
  }).catch(e => {
    res.status(500).send({success: false, error: e});
  });
});

app.post("/expense/delete", (req: any, res: any) => {
  const {expenseId} = req.body;
  dao.removeExpense(expenseId).then(() => {
    res.status(200).send({success: true});
  }).catch(e => {
    res.status(500).send({success: false, error: e});
  });
});

