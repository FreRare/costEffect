import {Component, EventEmitter, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Payment} from '../../../../server/db/models/payment';
import {User} from '../../../../server/db/models/user';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-payment-form',
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss'],
  imports: [
    ReactiveFormsModule,
    NgIf
  ]
})
export class PaymentFormComponent {
  paymentForm: FormGroup;

  @Output() submitPayment = new EventEmitter<Payment>();

  constructor(private fb: FormBuilder) {
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
}
