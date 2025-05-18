import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {User} from '../../../../server/db/models/user';
import {API_URL} from '../../app.config';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  private loginUrl = `${API_URL}/login`;
  private registrationUrl = `${API_URL}/register`;
  private usersUrl = `${API_URL}/users`;

  static USER_CONVERTER = {
    fromLot: (v: any): User[] => {
      let final: User[] = [];
      try {
        if (v.success && v.users) {
          const usersArr = v.users;
          for (const u of usersArr) {
            const user: User = {
              id: u.id,
              email: u.email,
              username: u.username,
              firstName: u.firstName,
              lastName: u.lastName,
              dateOfBirth: u.dateOfBirth,
              isAdmin: u.isAdmin,
              registrationDate: u.registrationDate,
              password: undefined,
            };
            final.push(user);
          }
        }
        console.log("Users added =", final.length);
      } catch (e) {
        console.error(`Error converting users: ${e}`);
      }
      return final
    },
    to: () => {

    }
  }

  constructor(private http: HttpClient) {
  }

  login(email: string, pw: string): Observable<any> {
    const headers = new HttpHeaders({"Content-Type": "application/json"});
    const body = {username: email, password: pw};
    return this.http.post(this.loginUrl, body, {headers});
  }

  register(userData: any): Observable<any> {
    const headers = new HttpHeaders({"Content-Type": "application/json"});
    const body = {
      ...userData
    }
    return this.http.post(this.registrationUrl, body, {headers});
  }


  getUsers(): Observable<any> {
    const headers = new HttpHeaders({"Content-Type": "application/json"});
    return this.http.get(`${this.usersUrl}`, {headers});
  }
}
