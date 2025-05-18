import {Routes} from '@angular/router';
import {HomeComponent} from './pages/home/home.component';
import {LoginComponent} from './pages/login/login.component';
import {RegistrationComponent} from './pages/registration/registration.component';
import {ExpenseFormComponent} from './components/expense-form/expense-form.component';
import {PaymentFormComponent} from './components/payment-form/payment-form.component';

export const routes: Routes = [
  {path: "", redirectTo: "/login", pathMatch: "full"},
  {path: "home/:userId", component: HomeComponent},
  {path: "login", component: LoginComponent},
  {path: "registration", component: RegistrationComponent},
  {path: "create/expense", component: ExpenseFormComponent},
  {path: "create/payment", component: PaymentFormComponent},
];
