import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {GroupExpense} from '../../../../server/db/models/group';
import {User} from '../../../../server/db/models/user';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {ExpenseFormComponent} from '../../components/expense-form/expense-form.component';
import {PaymentFormComponent} from '../../components/payment-form/payment-form.component';
import {SessionService} from '../../services/session/session.service';
import {NgForOf, NgIf} from '@angular/common';
import {GroupFormComponent} from '../../components/group-form/group-form.component';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {GroupService} from '../../services/groups/group.service';
import {ConfirmDialogComponent} from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-home',
  imports: [NgIf, NgForOf, MatButton, MatIcon, MatDialogModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  user: User | undefined;
  groups: GroupExpense[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private dialog: MatDialog, private sess: SessionService, private groupService: GroupService) {
  }

  ngOnInit(): void {
    const currentUser = this.sess.getUser();
    if (!currentUser) {
      this.router.navigate(["/login"]).then();
    } else {
      this.user = currentUser!;
    }
    if (this.sess.getGroups().length > 0) {
      this.groups = this.sess.getGroups();
    }
    this.groupService.loadGroupsForUser(currentUser?.id ?? '').subscribe({
      next: (v) => {
        this.groups = GroupService.GROUP_CONVERTER.fromLot(v);
      },
      error: v => console.error(v),
    });
  }

  hasGroups(): boolean {
    return this.groups.length > 0;
  }

  goToGroup(id: string): void {
    this.router.navigate([`/group`, id]).then();
  }

  openAddExpense(): void {
    this.dialog.open(ExpenseFormComponent, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'scrollable-dialog',
      data: {
        mode: 'create'
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
        mode: 'create'
      }
    });
  }

  openCreateGroupDialog(): void {
    const dialogRef = this.dialog.open(GroupFormComponent, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'scrollable-dialog',
      data: {}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.groups = this.sess.getGroups();
      }
    });
  }

  refreshGroups() {
    this.groupService.loadGroupsForUser(this.sess.getUser()?.id ?? '').subscribe({
      next: (v) => {
        this.groups = GroupService.GROUP_CONVERTER.fromLot(v);
      },
      error: v => console.error(v),
      complete: () => {
        console.log("Finished");
      },
    });
  }

  confirmDeleteGroup(group: GroupExpense): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        message: `Are you sure you want to delete the group "${group.name}"?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.groupService.removeGroup(group.id).subscribe({
          next: (v) => {
            console.log(`Group removal finished with: ${v.success}`);
            this.groups = this.groups.filter(g => g.id !== group.id);
          },
          error: err => {
            console.error('Failed to delete group:', err);
          },
        });
      }
    });
  }

  logout(): void {
    this.sess.logout(); // Or however your logout flow is set up
    this.router.navigate(['/login']).then();
  }
}
