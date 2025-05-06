import { useState } from "react";
import { vscode } from "./utilities/vscode";
import "./App.css";
import "@vscode-elements/elements/dist/vscode-label";
import "@vscode-elements/elements/dist/vscode-textfield";

function Person() {
  const [personObject, setPersonObject] = useState(loadState);

  /**
   * Load the initial state via vscode API or return an empty object as initial state.
   */
  function loadState() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = vscode.getState() as any;
    if (state) {
      return JSON.parse(state.text);
    }

    return {
      firstname: "",
      lastname: "",
    };
  }

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case "update": {
        const text = message.text;

        // Update our webview's content
        updateContent(text);

        // Then persist state information.
        // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
        vscode.setState({ text });

        return;
      }
    }
  });

  /**
   * Update the data shown in the document in the webview.
   */
  function updateContent(text: string) {
    if (text !== "") {
      const parsed = JSON.parse(text);
      setPersonObject({
        firstname: parsed.firstname,
        lastname: parsed.lastname,
      });
    }
  }

  /**
   * Update the document in the extension.
   */
  function updateDocument() {
    vscode.postMessage({
      type: "updateDocument",
      text: JSON.stringify(personObject, null, 2),
    });
  }

  return (
    <>
      <main className="main">
        <h1>React Person Editor</h1>
        <div className="content">
          <div className="person">
            <div className="row">
              <vscode-label htmlFor="firstname" className="vscode-label">
                Firstname:
              </vscode-label>
              <div className="value">
                <vscode-textfield
                  type="text"
                  id="firstname"
                  className="vscode-textfield"
                  value={personObject.firstname}
                  onInput={(event) => {
                    const value = event.currentTarget.value;
                    const target = event.currentTarget;
                    // wait 500 ms before updating the document
                    // only update if in the meantime no other input was given
                    setTimeout(() => {
                      if (value === target.value) {
                        personObject.firstname = value;
                        updateDocument();
                      }
                    }, 500);
                  }}
                />
              </div>
            </div>
            <div className="row">
              <vscode-label htmlFor="lastname" className="vscode-label">
                Lastname:
              </vscode-label>
              <div className="value">
                <vscode-textfield
                  type="text"
                  id="lastname"
                  className="vscode-textfield"
                  value={personObject.lastname}
                  onInput={(event) => {
                    const value = event.currentTarget.value;
                    const target = event.currentTarget;
                    // wait 500 ms before updating the document
                    // only update if in the meantime no other input was given
                    setTimeout(() => {
                      if (value === target.value) {
                        personObject.lastname = value;
                        updateDocument();
                      }
                    }, 500);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default Person;
