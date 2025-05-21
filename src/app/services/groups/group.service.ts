import {Injectable} from '@angular/core';
import {AuthServiceService} from '../auth/auth-service.service';
import {GroupExpense} from '../../../../server/db/models/group';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {User} from '../../../../server/db/models/user';
import {Expense} from '../../../../server/db/models/expense';
import {Payment} from '../../../../server/db/models/payment';
import {API_URL} from '../../app.config';

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  private getGroupsUrl = `${API_URL}/group`;
  private createGroupUrl = `${API_URL}/group/create`;
  private deleteGroupUrl = `${API_URL}/group/remove`;
  private updateGroupUrl = `${API_URL}/group/update`;
  private addPaymentToGroupUrl = `${API_URL}/group/pay/create`;
  private addExpenseToGroupUrl = `${API_URL}/group/exp/create`;

  static GROUP_CONVERTER = {
    fromLot: (v: any): GroupExpense[] => {
      const final: GroupExpense[] = [];
      try {
        if (v.success && v.groups) {
          for (const g of v.groups) {
            // build members
            const members: User[] = (g.members || []).map((u: any) => ({
              id: u.id,
              email: u.email,
              username: u.username,
              firstName: u.firstName,
              lastName: u.lastName,
              dateOfBirth: u.dateOfBirth,
              isAdmin: u.isAdmin,
              registrationDate: u.registrationDate,
              password: undefined
            }));

            // build expenses
            const expenses: Expense[] = (g.expenses || []).map((e: any) => {
              console.log(`Expense ${e.id} has `);
              return {
                id: e.id,
                description: e.description,
                amount: e.amount,
                paidBy: e.paidBy,
                createdBy: e.createdBy,
                splitMethod: e.splitMethod,
                participants: (e.participants || [])
              }
            });

            // build payments
            const payments: Payment[] = (g.payments || []).map((p: any) => ({
              id: p.id,
              description: p.description,
              amount: p.amount,
              paidBy: p.paidBy as User,
              paidTo: p.paidTo as User,
              createdBy: p.createdBy as User,
              issued: new Date(p.issued)
            }));

            final.push({
              id: g.id,
              name: g.name,
              createdBy: g.createdBy as User,
              members,
              expenses,
              payments,
              createdOn: new Date(g.createdOn)
            });
          }
        }
        console.log('Groups added =', final.length);
      } catch (e) {
        console.error(`Error converting groups: ${e}`);
      }
      return final;
    },

    // you can add a `to` method here if you need to serialize before sending back to the server
    to: (groups: GroupExpense[]): any => groups.map(g => ({
      id: g.id,
      name: g.name,
      createdBy: g.createdBy.id,
      members: g.members.map(u => u.id),
      expenses: g.expenses.map(e => e.id),
      payments: g.payments.map(p => p.id),
      createdOn: g.createdOn.toISOString()
    })),
  };
  static PAYMENT_CONVERTER = {
    fromLot: (v: any): Payment[] => {
      const final: Payment[] = [];
      try {


      } catch (e) {
        console.error(e);
      }

      return final;
    },

    // you can add a `to` method here if you need to serialize before sending back to the server
    to: (p: Payment[]): any => p.map(pay => ({
      id: pay.id,
      description: pay.description,
      amount: pay.amount,
      paidBy: pay.paidBy.id,
      paidTo: pay.paidTo.id,
      createdBy: pay.createdBy.id,
      issued: pay.issued.toISOString(),
    })),
  };
  static EXPENSE_CONVERTER = {
    fromLot: (v: any): Expense[] => {
      const final: Expense[] = [];
      try {


      } catch (e) {
        console.error(e);
      }

      return final;
    },

    to: (expenses: Expense[]): any => expenses.map(exp => ({
      id: exp.id,
      description: exp.description,
      amount: exp.amount,
      paidBy: exp.paidBy.id,
      createdBy: exp.createdBy.id,
      splitMethod: exp.splitMethod,
      participants: exp.participants.map(p => p.id),
    }))
  };

  private headers = new HttpHeaders({"Content-Type": "application/json"});

  constructor(private auth: AuthServiceService, private http: HttpClient) {
  }

  loadGroupsForUser(id: string): Observable<any> {
    const headers = new HttpHeaders({"Content-Type": "application/json"});
    return this.http.get(`${this.getGroupsUrl}/${id}`, {headers});
  }

  createGroup(g: GroupExpense): Observable<any> {
    const converted = GroupService.GROUP_CONVERTER.to([g])[0];
    const body = {
      name: converted.name,
      members: converted.members,
      createdOn: converted.createdOn,
      createdBy: converted.createdBy,
    };
    console.log(`Sending data to create group by: ${body.createdBy}`);
    return this.http.post(this.createGroupUrl, body, {headers: this.headers});
  }

  updateGroup(g: GroupExpense): Observable<any> {
    const body = GroupService.GROUP_CONVERTER.to([g])[0];
    return this.http.post(this.updateGroupUrl, body, {headers: this.headers});
  }

  removeGroup(g: string): Observable<any> {
    console.log(`Removing group with id ${g}`);
    return this.http.post(this.deleteGroupUrl, {removeId: g}, {headers: this.headers});
  }

  addPaymentToGroup(gid: string, p: Payment) {
    const payment = GroupService.PAYMENT_CONVERTER.to([p])[0];
    console.log(`Payment to be added: ${payment.description} - ${payment.paidBy} - ${payment.paidTo}`);
    const body = {
      groupId: gid,
      payment
    };
    return this.http.post(this.addPaymentToGroupUrl, body, {headers: this.headers});
  }

  addExpenseGroup(gid: string, p: Expense) {
    const body = {
      groupId: gid,
      expense: GroupService.EXPENSE_CONVERTER.to([p])[0],
    };
    return this.http.post(this.addExpenseToGroupUrl, body, {headers: this.headers});
  }

}
