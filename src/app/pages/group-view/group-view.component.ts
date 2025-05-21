import {Component, Inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {GroupExpense} from '../../../../server/db/models/group';
import {GroupService} from '../../services/groups/group.service';
import {SessionService} from '../../services/session/session.service';
import {User} from '../../../../server/db/models/user';
import {CommonModule, NgForOf, NgIf} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../../components/confirm-dialog/confirm-dialog.component';
import {MatButtonModule} from '@angular/material/button';
import {ExpenseFormComponent} from '../../components/expense-form/expense-form.component';
import {PaymentFormComponent} from '../../components/payment-form/payment-form.component';
import {AddMemberDialogComponent} from '../../components/add-member-dialog/add-member-dialog.component';
import {Expense} from '../../../../server/db/models/expense';

@Component({
  selector: 'app-group-view',
  templateUrl: './group-view.component.html',
  imports: [
    NgForOf,
    NgIf,
    CommonModule,
    MatDialogModule,
    MatButtonModule,
  ],
  styleUrls: ['./group-view.component.scss'],
})
export class GroupViewComponent implements OnInit {
  groupId!: string;
  group!: GroupExpense;
  loading: boolean = true;
  error: string | null = null;
  activeTab: 'members' | 'expenses' | 'payments' = 'members';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sess: SessionService,
    private groupService: GroupService,
    private dialog: MatDialog,
  ) {
  }

  ngOnInit(): void {
    if (!this.sess.getUser()) {
      this.router.navigate(["/login"]).then();
    }
    this.groupId = this.route.snapshot.paramMap.get('id')!;
    this.loadGroup();
  }

  loadGroup(): void {
    const groups = this.sess.getGroups();
    if (groups.length <= 0) {
      this.sess.loadGroups();
    }
    const found = groups.find(g => g.id === this.groupId);
    if (found) {
      this.group = found;
      this.loading = false;
      return;
    }
    console.error("Group not found!");
  }

  getFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  setTab(tab: 'members' | 'expenses' | 'payments') {
    this.activeTab = tab;
  }

  get canDeleteMembers() {
    return this.sess.getUser()?.id === this.group.createdBy.id;
  }

  removeMember(userId: string): void {
    const user = this.group?.members.find(m => m.id === userId);
    if (!user) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        message: `Are you sure you want to remove ${user.firstName} ${user.lastName} from the group?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const {members, ...rest} = this.group;
        const updated = members.filter(m => m.id !== userId);
        this.groupService.updateGroup({
          members: updated,
          ...rest
        }).subscribe({
          next: () => {
            this.group!.members = this.group!.members.filter(m => m.id !== userId);
          },
          error: err => {
            console.error('Failed to remove member:', err);
          }
        });
      }
    });
  }

  openAddExpense(): void {
    this.dialog.open(ExpenseFormComponent, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'scrollable-dialog',
      data: {
        mode: 'create',
        groupId: this.groupId,
      }
    });
  }

  openAddPayment(): void {
    this.dialog.open(PaymentFormComponent, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'scrollable-dialog',
      data: {
        mode: 'create',
        groupId: this.groupId,
      }
    });
  }

  goBack() {
    this.router.navigate(["/home"]).then();
  }

  getParticipantUsernames(e: Expense) {
    return e.participants.filter(p => p.id !== e.paidBy.id).map(p => p.username);
  }

  addMembers(): void {
    // Simulate getting all users (replace with real API/service)
    const allUsers = this.sess.getLoadedUsers();
    const dialogRef = this.dialog.open(AddMemberDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'scrollable-dialog',
      data: {
        allUsers: allUsers,
        currentMembers: this.group.members
      }
    });

    dialogRef.afterClosed().subscribe((newMembers: User[]) => {
      if (newMembers && newMembers.length > 0) {
        const updatedMembers = [...this.group.members, ...newMembers];
        const {members, ...rest} = this.group;

        this.groupService.updateGroup({
          ...rest,
          members: updatedMembers
        }).subscribe({
          next: () => {
            this.group.members = updatedMembers;
          },
          error: err => console.error('Failed to add members:', err)
        });
      }
    });
  }
}
