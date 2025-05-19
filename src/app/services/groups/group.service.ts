import {Injectable} from '@angular/core';
import {AuthServiceService} from '../auth/auth-service.service';
import {GroupExpense} from '../../../../server/db/models/group';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {User} from '../../../../server/db/models/user';
import {Expense} from '../../../../server/db/models/expense';
import {Payment} from '../../../../server/db/models/payment';
import {API_URL} from '../../app.config';
import {GroupViewComponent} from '../../pages/group-view/group-view.component';

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  private getGroupsUrl = `${API_URL}/group`;
  private createGroupUrl = `${API_URL}/group/create`;
  private deleteGroupUrl = `${API_URL}/group/remove`;
  private updateGroupUrl = `${API_URL}/group/update`;

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
            const expenses: Expense[] = (g.expenses || []).map((e: any) => ({
              id: e.id,
              description: e.description,
              amount: e.amount,
              paidBy: {id: e.paidBy} as User,
              splitMethod: e.splitMethod,
              participants: (e.participants || []).map((pid: string) => ({id: pid} as User))
            }));

            // build payments
            const payments: Payment[] = (g.payments || []).map((p: any) => ({
              id: p.id,
              description: p.description,
              amount: p.amount,
              paidBy: {id: p.paidBy} as User,
              paidTo: {id: p.paidTo} as User,
              issued: new Date(p.issued)
            }));

            final.push({
              id: g.id,
              name: g.name,
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
      members: g.members.map(u => u.id),
      expenses: g.expenses.map(e => e.id),
      payments: g.payments.map(p => p.id),
      createdOn: g.createdOn.toISOString()
    })),
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
      createdOn: converted.createdOn
    };
    console.log(`Sending data ${body}`);
    return this.http.post(this.createGroupUrl, body, {headers: this.headers});
  }

  updateGroup(g: GroupExpense): Observable<any> {
    const body = GroupService.GROUP_CONVERTER.to([g])[0];
    return this.http.post(this.updateGroupUrl, body, {headers: this.headers});
  }

  removeGroup(g: string): Observable<any> {
    return this.http.post(this.deleteGroupUrl, {removeId: g}, {headers: this.headers});
  }

}
