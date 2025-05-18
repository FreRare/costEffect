import {Component} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgIf} from '@angular/common';
import {AuthServiceService} from '../../services/auth/auth-service.service';
import {Router} from '@angular/router';
import {SessionService} from '../../services/session/session.service';
import {User} from '../../../../server/db/models/user';

@Component({
  selector: 'loginform',
  templateUrl: './loginform.component.html',
  styleUrls: ['./loginform.component.css'],
  imports: [
    ReactiveFormsModule,
    NgIf,
  ],
  // optional styling file
})
export class LoginformComponent {
  loginForm: FormGroup;
  errorMsg: string;

  constructor(private router: Router, private fb: FormBuilder, private auth: AuthServiceService, private sess: SessionService) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
    this.errorMsg = "";
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const {username, password} = this.loginForm.value;
      this.auth.login(username, password).subscribe({
        next: (v) => {
          try {
            if (v.success && v.user) {
              const user: User = {
                id: v.user.id,
                email: v.user.email,
                username: v.user.username,
                firstName: v.user.firstName,
                lastName: v.user.lastName,
                dateOfBirth: v.user.dateOfBirth,
                isAdmin: v.user.isAdmin,
                registrationDate: v.user.registrationDate,
                password: undefined,
              };
              this.sess.setUser(user);
              this.router.navigate(['/home', user.id]).then();
            }
            this.errorMsg = v.error as string;
          } catch (e) {
            console.error(e);
          }
        },
        error: (v) => {
          console.error(v);
          this.errorMsg = v.error.error;
        },
        complete: () => console.info("Complete"),
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
