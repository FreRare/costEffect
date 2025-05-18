import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Expense} from '../../../../server/db/models/expense';
import {User} from '../../../../server/db/models/user';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-expense-form',
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.scss'],
  imports: [
    ReactiveFormsModule,
    NgIf
  ]
})
export class ExpenseFormComponent {
  expenseForm: FormGroup;

  @Output() submitExpense = new EventEmitter<Expense>();
  @Input() mode: "edit" | "create" | undefined = "create";
  @Input() editable: Expense | null = null;

  constructor(private fb: FormBuilder) {

    const editMode = (this.mode === "edit" && this.editable !== null);
    this.expenseForm = this.fb.group({
      description: [editMode ? this.editable?.description : "", Validators.required],
      amount: [editMode ? this.editable?.amount : 0, [Validators.required, Validators.min(0.01)]],
      paidBy: [editMode ? this.editable?.paidBy : "", Validators.required],
      splitMethod: [editMode ? this.editable?.splitMethod : 'equal', Validators.required],
      participants: [editMode ? this.editable?.participants : ''],
    });

  }

  onSubmit() {
    if (this.expenseForm.valid) {
      const raw = this.expenseForm.value;
      const expense: Expense = {
        id: '',
        description: raw.description,
        amount: raw.amount,
        paidBy: {id: raw.paidBy} as User,
        splitMethod: raw.splitMethod,
        participants: raw.participants
          .split(',')
          .map((id: string) => ({id: id.trim()} as User)),
      };
      this.submitExpense.emit(expense);
    }
  }
}

``
