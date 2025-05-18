import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Payment} from '../../../../server/db/models/payment';
import {User} from '../../../../server/db/models/user';
import {NgForOf, NgIf} from '@angular/common';
import {MatDialogRef} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {Expense} from '../../../../server/db/models/expense';
import {MatFormField} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {SessionService} from '../../services/session/session.service';

@Component({
  selector: 'app-payment-form',
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss'],
  imports: [
    ReactiveFormsModule,
    NgIf,
    MatButton,
    MatFormField,
    MatOption,
    MatSelect,
    NgForOf,
  ]
})
export class PaymentFormComponent implements OnInit {
  paymentForm: FormGroup;
  users: User[] = [];

  @Output() submitPayment = new EventEmitter<Payment>();
  @Input() mode: "edit" | "create" | undefined = "create";
  @Input() editable: Expense | null = null;

  constructor(private fb: FormBuilder, private dialogRef: MatDialogRef<PaymentFormComponent>, private sess: SessionService) {
    this.paymentForm = this.fb.group({
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      paidBy: ['', Validators.required],
      paidTo: ['', Validators.required],
    });
  }

  ngOnInit() {
    const users = this.sess.getLoadedUsers();
    if (users.length <= 0) {
      this.users = this.sess.loadUsers();
    } else {
      this.users = users;
    }
  }

  onSubmit() {
    if (this.paymentForm.valid) {
      const raw = this.paymentForm.value;
      const payment: Payment = {
        id: '',
        description: raw.description,
        amount: raw.amount,
        paidBy: this.users.find(u => u.id === raw.paidBy.id) ?? {id: raw.paidBy.id} as User,
        paidTo: this.users.find(u => u.id === raw.paidTo.id) ?? {id: raw.paidBy.id} as User,
        issued: new Date(raw.issued),
      };
      this.submitPayment.emit(payment);
    }
  }

  onCancel(): void {
    this.dialogRef.close(); // Optionally pass data, like this.dialogRef.close(null);
  }
}
