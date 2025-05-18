import {Injectable} from '@angular/core';
import {User} from '../../../../server/db/models/user';

@Injectable({providedIn: 'root'})
export class SessionService {
  private currentUser: User | null = null;

  setUser(user: User) {
    this.currentUser = user;
  }

  getUser(): User | null {
    return this.currentUser;
  }

  isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  logout() {
    this.currentUser = null;
  }
}
