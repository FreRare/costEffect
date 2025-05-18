import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Expense} from '../../../../server/db/models/expense';
import {User} from '../../../../server/db/models/user';
import {NgForOf, NgIf} from '@angular/common';
import {MatDialogRef} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatFormField} from '@angular/material/input';
import {MatOption, MatSelect, MatSelectTrigger} from '@angular/material/select';
import {AuthServiceService} from '../../services/auth/auth-service.service';
import {MatChip} from '@angular/material/chips';

@Component({
  selector: 'app-expense-form',
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatSelectTrigger,
    NgIf,
    MatButton,
    MatFormField,
    MatSelect,
    MatOption,
    NgForOf,
    MatChip,
  ]
})
export class ExpenseFormComponent implements OnInit {
  expenseForm: FormGroup;

  @Output() submitExpense = new EventEmitter<Expense>();
  @Input() mode: "edit" | "create" | undefined = "create";
  @Input() editable: Expense | null = null;

  users: User[] = [];

  constructor(private fb: FormBuilder, private dialogRef: MatDialogRef<ExpenseFormComponent>, private auth: AuthServiceService) {
    const editMode = (this.mode === "edit" && this.editable !== null);
    this.expenseForm = this.fb.group({
      description: [editMode ? this.editable?.description : "", Validators.required],
      amount: [editMode ? this.editable?.amount : 0, [Validators.required, Validators.min(0.01)]],
      paidBy: [editMode ? this.editable?.paidBy : "", Validators.required],
      splitMethod: [editMode ? this.editable?.splitMethod : 'equal', Validators.required],
      participants: [editMode ? this.editable?.participants : ''],
    });
  }

  ngOnInit() {
    this.auth.getUsers().subscribe({
      next: v => {
        console.log(v);
        try {
          if (v.success && v.users) {
            const usersArr = v.users;
            console.log();
            for (const u of usersArr) {
              const user: User = {
                id: u.id,
                email: u.email,
                username: u.username,
                firstName: u.firstName,
                lastName: u.lastName,
                dateOfBirth: u.dateOfBirth,
                isAdmin: u.isAdmin,
                registrationDate: u.registrationDate,
                password: undefined,
              };
              this.users.push(user);
            }
          }
          console.log("Users added =", this.users.length);
        } catch (e) {
          console.error(e);
        }
      },
      error: v => console.error(v),
      complete: () => console.log("Finished"),
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

  onCancel(): void {
    this.dialogRef.close(); // Optionally pass data, like this.dialogRef.close(null);
  }

  selectAllParticipants(): void {
    const allUserIds = this.users.map(user => user.id);
    this.expenseForm.get('participants')?.setValue(allUserIds);
  }

  getUserName(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
  }

  compareUsers = (a: string, b: string) => a === b;
}

``
