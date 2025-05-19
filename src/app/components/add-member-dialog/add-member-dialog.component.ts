// src/app/components/add-group-member-dialog/add-group-member-dialog.component.ts
import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {User} from '../../../../server/db/models/user';
import {NgForOf, NgIf} from '@angular/common';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-add-member-dialog',
  templateUrl: './add-member-dialog.component.html',
  styleUrls: ['./add-member-dialog.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    MatButton,
  ]
})
export class AddMemberDialogComponent {
  availableUsers: User[] = [];
  selectedUserIds = new Set<string>();

  constructor(
    public dialogRef: MatDialogRef<AddMemberDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { allUsers: User[], currentMembers: User[] }
  ) {
    // Filter out already-added users
    const existingIds = new Set(data.currentMembers.map(u => u.id));
    this.availableUsers = data.allUsers.filter(u => !existingIds.has(u.id));
  }

  toggleSelection(userId: string) {
    this.selectedUserIds.has(userId)
      ? this.selectedUserIds.delete(userId)
      : this.selectedUserIds.add(userId);
  }

  confirm() {
    const selected = this.availableUsers.filter(u => this.selectedUserIds.has(u.id));
    this.dialogRef.close(selected);
  }

  cancel() {
    this.dialogRef.close();
  }
}
