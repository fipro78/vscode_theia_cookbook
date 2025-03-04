import { Component, HostListener } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vscode } from './utilities/vscode';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
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
    this.personObject = {
      firstname: this.firstname.value,
      lastname: this.lastname.value,
    };

    vscode.postMessage({
      type: 'updateDocument',
      text: JSON.stringify(this.personObject, null, 2),
    });
  }
}
