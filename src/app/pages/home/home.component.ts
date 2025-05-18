import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {GroupExpense} from '../../../../server/db/models/group';
import {User} from '../../../../server/db/models/user';
import {MatDialog} from '@angular/material/dialog';
import {ExpenseFormComponent} from '../../components/expense-form/expense-form.component';
import {PaymentFormComponent} from '../../components/payment-form/payment-form.component';
import {SessionService} from '../../services/session/session.service';
import {NgForOf, NgIf} from '@angular/common';
import {GroupFormComponent} from '../../components/group-form/group-form.component';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-home',
  imports: [NgIf, NgForOf, MatButton, MatIcon],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  user: User | undefined;
  groups: GroupExpense[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private dialog: MatDialog, private sess: SessionService) {
  }

  ngOnInit(): void {
    const currentUser = this.sess.getUser();
    if (!currentUser) {
      this.router.navigate(["/login"]).then();
    } else {
      this.user = currentUser!;
    }
    this.groups = this.sess.getGroups();
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
      if (result === 'created') {
        this.sess.getGroups();
      }
    });
  }
}
