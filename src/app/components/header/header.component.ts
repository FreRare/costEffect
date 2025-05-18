import {Component, Input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgClass, NgIf} from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    NgClass,
    NgIf
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})

export class HeaderComponent {
  @Input() currentSite: string = "";
  @Input() showNavBar: "hide" | "show" | "auth" = "show";

  navSites: NavigationSiteDescriptor[] = [
    {name: "Log in", linkTo: "/login", icon: "login", isActive: this.currentSite == "login", auth: true},
    {
      name: "Sign up",
      linkTo: "/registration",
      icon: "signup",
      isActive: this.currentSite == "registration",
      auth: true
    },
    {name: "Home", linkTo: "/home/:userId", icon: "home", isActive: this.currentSite == "home", auth: false},
  ];
  pages = this.navSites.filter(s => !s.auth);
  authSites = this.navSites.filter(s => s.auth);
}

type NavigationSiteDescriptor = {
  name: string;
  linkTo: string;
  icon: string;
  isActive: boolean;
  auth: boolean;
};

