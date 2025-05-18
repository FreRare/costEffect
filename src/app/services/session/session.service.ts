import {Injectable} from '@angular/core';
import {User} from '../../../../server/db/models/user';
import {AuthServiceService} from '../auth/auth-service.service';

@Injectable({providedIn: 'root'})
export class SessionService {
  private currentUser: User | null = null;
  private loadedUsers: User[] = [];

  constructor(private auth: AuthServiceService) {
    this.loadUsers();
  }

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

  getLoadedUsers(): User[] {
    return this.loadedUsers;
  }

  loadUsers() {
    this.auth.getUsers().subscribe({
      next: v => {
        this.loadedUsers = AuthServiceService.USER_CONVERTER.fromLot(v);
      },
      error: v => console.error(v),
      complete: () => console.log("Finished"),
    });
    return this.loadedUsers;
  }
}
