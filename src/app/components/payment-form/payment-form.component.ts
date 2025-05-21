import {Component, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Payment} from '../../../../server/db/models/payment';
import {User} from '../../../../server/db/models/user';
import {NgForOf, NgIf} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {Expense} from '../../../../server/db/models/expense';
import {MatFormField} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {SessionService} from '../../services/session/session.service';
import {GroupService} from '../../services/groups/group.service';
import {Router} from '@angular/router';

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

  @Input() mode: "edit" | "create" | undefined = "create";
  @Input() editable: Payment | null = null;
  @Input() groupId: string = "";

  constructor(private fb: FormBuilder, private router: Router, private dialogRef: MatDialogRef<PaymentFormComponent>, private sess: SessionService, private groupService: GroupService,
              @Inject(MAT_DIALOG_DATA) public data: {
                mode: 'create' | 'edit',
                editable?: Payment,
                groupId: string
              }) {
    const editMode = (this.data.mode === "edit" && this.data.editable !== null);
    this.groupId = this.data.groupId;
    this.editable ??= this.data.editable ?? null;
    this.paymentForm = this.fb.group({
      description: [editMode ? this.editable?.description : '', Validators.required],
      amount: [editMode ? this.editable?.amount : 500, [Validators.required, Validators.min(0.1)]],
      paidBy: [editMode ? this.editable?.paidBy.id : '',],
      paidTo: [editMode ? this.editable?.paidTo.id : '',],
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
  }

  onSubmit() {
    if (this.paymentForm.valid) {
      const raw = this.paymentForm.value;
      const payment: Payment = {
        id: '',
        description: raw.description,
        amount: raw.amount,
        paidBy: this.users.find(u => u.id === raw.paidBy) ?? {id: raw.paidBy} as User,
        paidTo: this.users.find(u => u.id === raw.paidTo) ?? {id: raw.paidTo} as User,
        createdBy: this.sess.getUser()! as User,
        issued: new Date(),
      };
      const thisGroup = this.sess.getGroups().find(g => g.id === this.groupId);
      if (thisGroup) {
        thisGroup.payments.push(payment);
        this.sess.updateGroupInSession(thisGroup);
      } else {
        console.log("Failed to get this group");
      }
      this.groupService.addPaymentToGroup(this.groupId, payment).subscribe({
        next: v => {
          console.log("Added payment");
          this.dialogRef.close();
        },
        error: e => console.error(e)
      });
    } else {
      console.log(`Invalid form: ${this.paymentForm.value}`);
    }
  }

  onCancel(): void {
    this.dialogRef.close(); // Optionally pass data, like this.dialogRef.close(null);
  }
}
