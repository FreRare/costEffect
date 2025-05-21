import {Injectable} from '@angular/core';
import {User} from '../../../../server/db/models/user';
import {AuthServiceService} from '../auth/auth-service.service';
import {GroupExpense} from '../../../../server/db/models/group';
import {GroupService} from '../groups/group.service';
import {Observable, Subscription} from 'rxjs';

@Injectable({providedIn: 'root'})
export class SessionService {
  private currentUser: User | null = null;
  private loadedUsers: User[] = [];
  private groups: GroupExpense[] = [];

  constructor(private auth: AuthServiceService, private groupService: GroupService) {
    this.loadUsers();
  }

  setUser(user: User) {
    this.currentUser = user;
    this.groups = [];
    this.loadGroups();
  }

  getUser(): User | null {
    return this.currentUser;
  }

  isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  logout() {
    this.currentUser = null;
    this.groups = [];
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

  loadGroups(): Subscription {
    console.log(`Loading groups for user ${this.currentUser?.id ?? ''}`);
    return this.groupService.loadGroupsForUser(this.currentUser?.id ?? '').subscribe({
      next: (v) => {
        this.groups = GroupService.GROUP_CONVERTER.fromLot(v);
      },
      error: v => console.error(v),
      complete: () => {
        console.log("Finished");
      },
    });
  }

  getGroups() {
    return this.groups;
  }

  setGroups(g: GroupExpense[]) {
    this.groups = g;
  }

  addGroup(g: GroupExpense) {
    this.groups.push(g);
  }

  updateGroupInSession(updatedGroup: GroupExpense): void {
    const groups = this.getGroups();
    const index = groups.findIndex(g => g.id === updatedGroup.id);
    if (index !== -1) {
      groups[index] = updatedGroup;
      this.setGroups(groups); // Assuming you have this method
    }
  }
}
