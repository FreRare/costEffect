import {Component, Input} from '@angular/core';
import {MatIcon} from '@angular/material/icon';
import {RouterLink} from '@angular/router';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [
    MatIcon,
    RouterLink,
    NgClass
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})

export class HeaderComponent {
  @Input() currentSite: string = "";

  navSites: NavigationSiteDescriptor[] = [
    {name: "Log in", linkTo: "/login", icon: "login", isActive: this.currentSite == "login"},
    {name: "Sign up", linkTo: "/login", icon: "signup", isActive: this.currentSite == "registration"},
  ];
}

type NavigationSiteDescriptor = {
  name: string;
  linkTo: string;
  icon: string;
  isActive: boolean;
};

