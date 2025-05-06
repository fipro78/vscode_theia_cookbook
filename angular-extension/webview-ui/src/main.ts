import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { PersonComponent } from './app/person/person.component';
import { PetComponent } from './app/pet/pet.component';

const currentPath = document.documentElement.getAttribute('data-root');
if (currentPath === 'person-root') {
  bootstrapApplication(PersonComponent, appConfig).catch((err) =>
    console.error(err)
  );
} else if (currentPath === 'pet-root') {
  bootstrapApplication(PetComponent, appConfig).catch((err) =>
    console.error(err)
  );
}
