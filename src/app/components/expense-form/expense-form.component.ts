import {Component, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators} from '@angular/forms';
import {Expense} from '../../../../server/db/models/expense';
import {User} from '../../../../server/db/models/user';
import {NgForOf, NgIf} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatError, MatFormField, MatInput} from '@angular/material/input';
import {MatOption, MatSelect, MatSelectTrigger} from '@angular/material/select';
import {MatChip} from '@angular/material/chips';
import {SessionService} from '../../services/session/session.service';
import {MatIcon} from '@angular/material/icon';
import {toArray} from 'rxjs';
import {GroupService} from '../../services/groups/group.service';
import {Router} from '@angular/router';

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
    MatIcon,
    MatInput,
    MatIconButton,
    MatError,
  ]
})
export class ExpenseFormComponent implements OnInit {
  expenseForm: FormGroup;

  @Input() mode: "edit" | "create" | undefined = "create";
  @Input() editable: Expense | null = null;
  @Input() groupId: string = "";

  users: User[] = [];

  constructor(private fb: FormBuilder,
              private router: Router,
              private dialogRef: MatDialogRef<ExpenseFormComponent>,
              private sess: SessionService,
              private groupService: GroupService,
              @Inject(MAT_DIALOG_DATA) public data: {
                mode: 'create' | 'edit',
                editable?: Expense,
                groupId: string
              }
  ) {
    const editMode = (this.data.mode === "edit" && this.data.editable !== null);
    this.groupId = this.data.groupId;
    console.log(`This expense will be added to ${this.groupId} group`);
    this.expenseForm = this.fb.group({
      description: [editMode ? this.editable?.description : "", Validators.required],
      amount: [editMode ? this.editable?.amount : 0, [Validators.required, Validators.min(0.01)]],
      paidBy: [editMode ? this.editable?.paidBy.id : this.sess.getUser()?.id, Validators.required],
      splitMethod: [editMode ? this.editable?.splitMethod : 'equal', Validators.required],
      participants: [editMode ? this.editable?.participants : ''],
    });
  }


  ngOnInit() {
    if (!this.sess.getUser()) {
      this.router.navigate(["/login"]).then();
    }
    const users = this.sess.getLoadedUsers();
    if (users.length <= 0) {
      this.users = this.sess.loadUsers();
    } else {
      this.users = users;
    }
    this.expenseForm.get('splitMethod')?.valueChanges.subscribe(method => {
      this.onSplitMethodChange(method);
    });
  }

  onSubmit() {
    console.log(`Adding expense to group: ${this.groupId}`);
    if (this.expenseForm.valid) {
      const raw = this.expenseForm.value;
      let splitAmounts = undefined;
      if (raw.splitMethod === 'unequal') {
        splitAmounts = raw.unequalSplits.map((entry: any) => ({
          id: entry.userId,
          amount: parseFloat(entry.amount),
        }));
        raw.participants = splitAmounts.map((s: { id: string, amount: number }) => s.id);
      }
      const expense: Expense = {
        id: '',
        description: raw.description,
        amount: raw.amount,
        paidBy: {id: raw.paidBy} as User,
        createdBy: this.sess.getUser()! as User,
        splitMethod: raw.splitMethod,
        splitAmounts: splitAmounts,
        participants: raw.participants
          .map((id: string) =>
            this.sess.getLoadedUsers().find(u => u.id === id)),
      };
      const thisGroup = this.sess.getGroups().find(g => g.id === this.groupId);
      if (thisGroup) {
        thisGroup.expenses.push(expense);
        this.sess.updateGroupInSession(thisGroup);
      } else {
        console.log("Failed to get this group");
      }
      this.groupService.addExpenseGroup(this.groupId, expense).subscribe({
        next: () => {
          console.log("Expense added");
          this.dialogRef.close();
        },
        error: e => console.error(e)
      });
    } else {
      console.log("Invalid form");
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


  get unequalSplits(): FormArray {
    return this.expenseForm.get('unequalSplits') as FormArray;
  }

  onSplitMethodChange(method: string) {
    if (method === 'unequal') {
      if (!this.expenseForm.contains('unequalSplits')) {
        this.expenseForm.addControl('unequalSplits', this.fb.array([]));
        this.addUnequalSplit();
      }
    } else {
      this.expenseForm.removeControl('unequalSplits');
    }
  }

  addUnequalSplit() {
    const availableUsers = this.getAvailableParticipantsForSplit();
    if (availableUsers.length === 0) return; // Prevent adding more

    this.unequalSplits.push(this.fb.group({
      userId: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.0001), this.validateTotalSplit()]]
    }));
  }

  removeUnequalSplit(index: number) {
    this.unequalSplits.removeAt(index);
  }

  removePayerFromUsers(): User[] {
    return this.users.filter(u => u.id != this.expenseForm.get('paidBy')?.value);
  }

  getAvailableParticipantsForSplit(currentIndex?: number): User[] {
    const selectedIds = this.unequalSplits.controls
      .map((c, i) => i !== currentIndex ? c.get('userId')?.value : null)
      .filter(Boolean);

    return this.users.filter(u => !selectedIds.includes(u.id));
  }

  validateTotalSplit(): ValidatorFn {
    return () => {
      const totalEntered = this.unequalSplits.controls.reduce((sum, group) => {
        const value = parseFloat(group.get('amount')?.value) || 0;
        return sum + value;
      }, 0);
      const totalExpense = parseFloat(this.expenseForm.get('amount')?.value) || 0;

      return totalEntered > totalExpense ? {totalExceeded: true} : null;
    };
  }

  onSplitValueChange() {
    this.unequalSplits.controls.forEach(c => c.get('amount')?.updateValueAndValidity());
  }

  protected readonly toArray = toArray;
}

``
