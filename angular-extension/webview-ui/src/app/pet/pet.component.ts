import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vscode } from '../utilities/vscode';
import { VscodeTextfieldInputDirective } from '../vscode-textfield-input.directive';
import '../../../node_modules/@vscode-elements/elements/dist/vscode-label';
import '../../../node_modules/@vscode-elements/elements/dist/vscode-textfield';
import '../../../node_modules/@vscode-elements/elements/dist/vscode-single-select';
import '../../../node_modules/@vscode-elements/elements/dist/vscode-option';

@Component({
  selector: 'pet-root',
  imports: [ReactiveFormsModule, VscodeTextfieldInputDirective],
  templateUrl: './pet.component.html',
  styleUrl: '../app.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PetComponent {
  name = new FormControl('');
  species = new FormControl('');
  petObject: any;

  constructor() {
    // Webviews are normally torn down when not visible and re-created when they become visible again.
    // State lets us save information across these re-loads
    const state = vscode.getState() as any;
    if (state) {
      this.updateContent(state.text);
    }
  }

  // Handle messages sent from the extension to the webview
  @HostListener('window:message', ['$event'])
  handleMessage(event: MessageEvent) {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case 'update':
        const text = message.text;

        // Update our webview's content
        this.updateContent(text);

        // Then persist state information.
        // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
        vscode.setState({ text });
        return;
    }
  }

  /**
   * Update the data shown in the document in the webview.
   */
  updateContent(text: string) {
    if (text !== '') {
      this.petObject = JSON.parse(text);
      this.name.setValue(this.petObject.name);
      this.species.setValue(this.petObject.species);
    }
  }

  /**
   * Update the document in the extension.
   */
  updateDocument() {
    let name = this.name.value;
    let species = this.species.value;

    // wait 500 ms before updating the document
    // only update if in the meantime no other input was given
    setTimeout(() => {
      if (this.name.value === name && this.species.value === species) {
        this.petObject = {
          name: this.name.value,
          species: this.species.value,
        };

        vscode.postMessage({
          type: 'updateDocument',
          text: JSON.stringify(this.petObject, null, 2),
        });
      }
    }, 500);
  }
}
