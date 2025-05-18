import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Payment} from '../../../../server/db/models/payment';
import {User} from '../../../../server/db/models/user';
import {NgIf} from '@angular/common';
import {MatDialogRef} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {Expense} from '../../../../server/db/models/expense';

@Component({
  selector: 'app-payment-form',
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss'],
  imports: [
    ReactiveFormsModule,
    NgIf,
    MatButton
  ]
})
export class PaymentFormComponent {
  paymentForm: FormGroup;

  @Output() submitPayment = new EventEmitter<Payment>();
  @Input() mode: "edit" | "create" | undefined = "create";
  @Input() editable: Expense | null = null;

  constructor(private fb: FormBuilder, private dialogRef: MatDialogRef<PaymentFormComponent>) {
    this.paymentForm = this.fb.group({
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      paidBy: ['', Validators.required],
      paidTo: ['', Validators.required],
      issued: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.paymentForm.valid) {
      const raw = this.paymentForm.value;
      const payment: Payment = {
        id: '',
        description: raw.description,
        amount: raw.amount,
        paidBy: {id: raw.paidBy} as User,
        paidTo: {id: raw.paidTo} as User,
        issued: new Date(raw.issued),
      };
      this.submitPayment.emit(payment);
    }
  }

  onCancel(): void {
    this.dialogRef.close(); // Optionally pass data, like this.dialogRef.close(null);
  }
}
