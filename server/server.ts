import * as CFG from './config';

CFG.DotenvConfig();
const express = require('express');
import {MongoClient} from 'mongodb';
import DAO from './db/DAO';
import {DAOError} from './interface';
import {User} from './db/models/user';

const cors = require('cors');
const path = require('path');

const app = express();
export const MONGO_CLIENT = new MongoClient(process.env.DB_CONN_URL);
const dao = await DAO.getInstance(MONGO_CLIENT);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../cost-effect/browser')));

app.get("*", (req: any, res: any) => {
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


app.listen(process.env.PORT, () => {
  console.log(`Server is up an listening on http://localhost:${process.env.PORT}`);
})


