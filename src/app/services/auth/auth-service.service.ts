import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  API_URL: string = `http://localhost:3000`;
  private loginUrl = `${this.API_URL}/login`;
  private registrationUrl = `${this.API_URL}/register`;

  constructor(private http: HttpClient) {
  }

  login(email: string, pw: string): Observable<any> {
    const headers = new HttpHeaders({"Content-Type": "application/json"});
    const body = {username: email, password: pw};
    return this.http.post(this.loginUrl, body, {headers});
  }

  register(userData: any): Observable<any>{
    const headers = new HttpHeaders({"Content-Type": "application/json"});
    const body = {
      ...userData
    }
    return this.http.post(this.registrationUrl, body, {headers});
  }
}
