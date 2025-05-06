import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vscode } from '../utilities/vscode';
import { VscodeTextfieldInputDirective } from '../vscode-textfield-input.directive';
import '@vscode-elements/elements/dist/vscode-label';
import '@vscode-elements/elements/dist/vscode-textfield';

@Component({
  selector: 'person-root',
  imports: [ReactiveFormsModule, VscodeTextfieldInputDirective],
  templateUrl: './person.component.html',
  styleUrl: '../app.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PersonComponent {
  firstname = new FormControl('');
  lastname = new FormControl('');
  personObject: any;

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
      this.personObject = JSON.parse(text);
      this.firstname.setValue(this.personObject.firstname);
      this.lastname.setValue(this.personObject.lastname);
    }
  }

  /**
   * Update the document in the extension.
   */
  updateDocument() {
    let firstname = this.firstname.value;
    let lastname = this.lastname.value;

    // wait 500 ms before updating the document
    // only update if in the meantime no other input was given
    setTimeout(() => {
      if (
        this.firstname.value === firstname &&
        this.lastname.value === lastname
      ) {
        this.personObject = {
          firstname: this.firstname.value,
          lastname: this.lastname.value,
        };

        vscode.postMessage({
          type: 'updateDocument',
          text: JSON.stringify(this.personObject, null, 2),
        });
      }
    }, 500);
  }
}
