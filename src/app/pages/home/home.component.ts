import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {GroupExpense} from '../../../../server/db/models/group';
import {User} from '../../../../server/db/models/user';
import {MatDialog} from '@angular/material/dialog';
import {ExpenseFormComponent} from '../../components/expense-form/expense-form.component';
import {PaymentFormComponent} from '../../components/payment-form/payment-form.component';
import {SessionService} from '../../services/session/session.service';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [NgIf, NgForOf],
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
  }

  hasGroups(): boolean {
    return this.groups.length > 0;
  }

  goToGroup(id: string): void {
    this.router.navigate(["/group", id]).then();
  }

  openAddExpense(): void {
    this.dialog.open(ExpenseFormComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        mode: 'create'
      }
    });
  }

  openAddPayment(): void {
    this.dialog.open(PaymentFormComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        mode: 'create'
      }
    });
  }
}
