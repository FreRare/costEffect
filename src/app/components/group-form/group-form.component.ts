import {Component, Inject, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {User} from '../../../../server/db/models/user';
import {GroupService} from '../../services/groups/group.service';
import {MatFormField, MatInput} from '@angular/material/input';
import {MatOption, MatSelect, MatSelectTrigger} from '@angular/material/select';
import {NgForOf} from '@angular/common';
import {MatChip} from '@angular/material/chips';
import {MatButton} from '@angular/material/button';
import {SessionService} from '../../services/session/session.service';
import {Expense} from '../../../../server/db/models/expense';
import {Payment} from '../../../../server/db/models/payment';
import {GroupExpense} from '../../../../server/db/models/group';

@Component({
  selector: 'app-group-form',
  imports: [
    MatFormField,
    MatSelect,
    MatSelectTrigger,
    MatOption,
    ReactiveFormsModule,
    MatChip,
    MatButton,
    NgForOf,
    MatInput
  ],
  templateUrl: './group-form.component.html',
  styleUrl: './group-form.component.scss'
})
export class GroupFormComponent implements OnInit {
  groupForm!: FormGroup;
  users: User[] = [];

  @Input() mode: 'edit' | 'create' = "create";

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<GroupFormComponent>,
    private groupService: GroupService,
    private sess: SessionService,
  ) {
  }

  ngOnInit(): void {
    this.groupForm = this.fb.group({
      name: ['', Validators.required],
      members: [[this.sess.getUser()?.id ?? ''], Validators.required] // Default to include self
    });
    this.users = this.sess.getLoadedUsers();
  }

  compareUsers = (a: string, b: string) => a === b;

  getUserName(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
  }

  onSubmit(): void {
    if (this.groupForm.valid) {
      const formData = this.groupForm.value;
      const submittedData: GroupExpense = {
        id: '',
        name: formData.name,
        createdBy: this.sess.getUser()! as User,
        members: formData.members.map((id: string) => this.users.find(u => u.id === id)),
        expenses: [],
        payments: [],
        createdOn: new Date()
      };
      this.sess.addGroup(submittedData);
      this.groupService.createGroup(submittedData).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (e) => console.error(e)
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
