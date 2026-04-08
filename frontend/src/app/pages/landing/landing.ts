import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar';
import { HeroComponent } from '../../components/hero/hero';
import { AboutSystemComponent } from '../../components/about-system/about-system';
import { FeaturesComponent } from '../../components/features/features';
import { HowItWorksComponent } from '../../components/how-it-works/how-it-works';
import { CoreValuesComponent } from '../../components/core-values/core-values';
import { FaqComponent } from '../../components/faq/faq';
import { ContactComponent } from '../../components/contact/contact';
import { FooterComponent } from '../../components/footer/footer';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    NavbarComponent,
    HeroComponent,
    AboutSystemComponent,
    FeaturesComponent,
    HowItWorksComponent,
    CoreValuesComponent,
    FaqComponent,
    ContactComponent,
    FooterComponent
  ],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css']
})
export class LandingComponent { }
