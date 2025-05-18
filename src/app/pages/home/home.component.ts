import {Component, OnInit} from '@angular/core';
import {HeaderComponent} from '../../components/header/header.component';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [
    HeaderComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit{
  userId: string | null = null;
  constructor(private route: ActivatedRoute) {
  }
  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get("userId");
  }
}
