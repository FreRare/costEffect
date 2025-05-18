import {Component} from '@angular/core';
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule} from '@angular/forms';
import {AuthServiceService} from '../../services/auth/auth-service.service';
import {NgIf} from '@angular/common';

@Component({
  selector: 'regsitrationform',
  templateUrl: './regsitrationform.component.html',
  styleUrls: ['./regsitrationform.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
})
export class RegsitrationformComponent {
  registerForm: FormGroup;

  constructor(private fb: FormBuilder, private auth: AuthServiceService) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      password: ['', Validators.required],
      isAdmin: [false],
      dateOfBirth: [null],
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const userData = {
        ...this.registerForm.value,
        registrationDate: new Date(),
      };
      this.auth.register(userData).subscribe({
        next: (res) => console.log(res),
        error: (err) => console.error(err),
        complete: () => console.info('Registration complete'),
      });
    } else {
      console.log("Invalid form");
      this.registerForm.markAllAsTouched();
    }
  }
}
