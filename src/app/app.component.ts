import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {MatDialogModule} from '@angular/material/dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatDialogModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'costEffect';
}
