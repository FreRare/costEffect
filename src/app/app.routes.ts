import {Routes} from '@angular/router';
import {HomeComponent} from './pages/home/home.component';
import {LoginComponent} from './pages/login/login.component';
import {RegistrationComponent} from './pages/registration/registration.component';
import {ExpenseFormComponent} from './components/expense-form/expense-form.component';
import {GroupViewComponent} from './pages/group-view/group-view.component';

export const routes: Routes = [
  {path: "", redirectTo: "/login", pathMatch: "full"},
  {path: "home", component: HomeComponent},
  {path: "login", component: LoginComponent},
  {path: "registration", component: RegistrationComponent},
  {path: "expense", component: ExpenseFormComponent},
  {path: "group/:id", component: GroupViewComponent},
];
