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
  totalGroupExpenses: number = 0;
  currentUserBalance: number = 0;
  perUserDebts: { [userId: string]: number } = {};

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
      this.calculateFinancials();
      this.loading = false;
      return;
    }
    console.error("Group not found!");
  }

  calculateFinancials(): void {
    const currentUser = this.sess.getUser();
    if (!currentUser) return;

    const userId = currentUser.id;
    this.totalGroupExpenses = 0;
    this.currentUserBalance = 0;
    this.perUserDebts = {};

    for (const expense of this.group.expenses) {
      this.totalGroupExpenses += expense.amount;

      const splitMap: { [uid: string]: number } = {};

      // Determine each user's share
      if (expense.splitMethod === 'equal') {
        const numParticipants = expense.participants.length;
        const share = expense.amount / numParticipants;
        for (const participant of expense.participants) {
          if (splitMap[participant.id]) {
            splitMap[participant.id] += share;
          } else {
            splitMap[participant.id] = share;
          }
        }
      } else if (expense.splitMethod === 'unequal' && expense.splitAmounts) {
        for (const split of expense.splitAmounts) {
          if (splitMap[split.id]) {
            splitMap[split.id] += split.amount;
          } else {
            splitMap[split.id] = split.amount;
          }
        }
      }

      // Apply financial impact for each participant
      for (const participantId of Object.keys(splitMap)) {
        const share = splitMap[participantId];
        if (participantId === expense.paidBy.id) continue;

        if (participantId === userId) {
          // Current user owes someone
          this.currentUserBalance -= share;
          this.perUserDebts[expense.paidBy.id] = (this.perUserDebts[expense.paidBy.id] || 0) - share;
        } else if (expense.paidBy.id === userId) {
          // Current user paid and someone else owes
          this.currentUserBalance += share;
          this.perUserDebts[participantId] = (this.perUserDebts[participantId] || 0) + share;
        }
      }
    }
    // Handle direct payments between users
    for (const payment of this.group.payments) {
      if (payment.paidBy.id === userId) {
        this.currentUserBalance += payment.amount;
        this.perUserDebts[payment.paidTo.id] = (this.perUserDebts[payment.paidTo.id] || 0) + payment.amount;
      } else if (payment.paidTo.id === userId) {
        this.currentUserBalance -= payment.amount;
        this.perUserDebts[payment.paidBy.id] = (this.perUserDebts[payment.paidBy.id] || 0) - payment.amount;
      }
    }
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

  canDeleteItem(creatorId: string): boolean {
    return this.sess.getUser()?.id === creatorId;
    // return true;
  }

  removeExpense(expenseId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {message: 'Are you sure you want to delete this expense?'}
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.groupService.removeExpenseFromGroup(expenseId).subscribe({
          next: () => {
            this.group.expenses = this.group.expenses.filter(e => e.id !== expenseId);
            this.calculateFinancials(); // Update totals
          },
          error: err => console.error('Failed to remove expense:', err)
        });
      }
    });
  }

  removePayment(paymentId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {message: 'Are you sure you want to delete this payment?'}
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.groupService.removePaymentFromGroup(paymentId).subscribe({
          next: () => {
            this.group.payments = this.group.payments.filter(p => p.id !== paymentId);
            this.calculateFinancials(); // Update totals
          },
          error: err => console.error('Failed to remove payment:', err)
        });
      }
    });
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
    }).afterClosed().subscribe(() => this.calculateFinancials());
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
    }).afterClosed().subscribe(() => this.calculateFinancials());
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
