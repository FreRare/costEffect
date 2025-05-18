import { Component } from '@angular/core';
import {HeaderComponent} from '../../components/header/header.component';
import {LoginformComponent} from '../../components/loginform/loginform.component';

@Component({
  selector: 'app-login',
  imports: [
    HeaderComponent,
    LoginformComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

}
