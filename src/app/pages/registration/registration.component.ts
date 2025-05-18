import {Component} from '@angular/core';
import {HeaderComponent} from "../../components/header/header.component";
import {RegsitrationformComponent} from '../../components/regsitrationform/regsitrationform.component';

@Component({
  selector: 'app-registration',
  imports: [
    HeaderComponent,
    RegsitrationformComponent
  ],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.scss'
})
export class RegistrationComponent {

}
