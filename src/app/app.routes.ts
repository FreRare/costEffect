import {Routes} from '@angular/router';
import {HomeComponent} from './pages/home/home.component';
import {LoginComponent} from './pages/login/login.component';
import {RegistrationComponent} from './pages/registration/registration.component';
import {ExpenseFormComponent} from './components/expense-form/expense-form.component';

export const routes: Routes = [
  {path: "", redirectTo: "/login", pathMatch: "full"},
  {path: "home/:userId", component: HomeComponent},
  {path: "login", component: LoginComponent},
  {path: "registration", component: RegistrationComponent},
  {path: "expense/:action", component: ExpenseFormComponent},
];
