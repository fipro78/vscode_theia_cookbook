import { useState } from "react";
import { vscode } from "./utilities/vscode";
import "./App.css";
import "@vscode-elements/elements/dist/vscode-label";
import "@vscode-elements/elements/dist/vscode-textfield";
import "@vscode-elements/elements/dist/vscode-single-select";
import "@vscode-elements/elements/dist/vscode-option";

function Pet() {
  const [petObject, setPetObject] = useState(loadState);

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
      name: "",
      species: "",
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
      setPetObject({
        name: parsed.name,
        species: parsed.species,
      });
    }
  }

  /**
   * Update the document in the extension.
   */
  function updateDocument() {
    vscode.postMessage({
      type: "updateDocument",
      text: JSON.stringify(petObject, null, 2),
    });
  }

  return (
    <>
      <main className="main">
        <h1>React Pet Editor</h1>
        <div className="content">
          <div className="pet">
            <div className="row">
              <vscode-label htmlFor="name" className="vscode-label">
                Name:
              </vscode-label>
              <div className="value">
                <vscode-textfield
                  type="text"
                  id="name"
                  className="vscode-textfield"
                  value={petObject.name}
                  onInput={(event) => {
                    const value = event.currentTarget.value;
                    const target = event.currentTarget;
                    // wait 500 ms before updating the document
                    // only update if in the meantime no other input was given
                    setTimeout(() => {
                      if (value === target.value) {
                        petObject.name = value;
                        updateDocument();
                      }
                    }, 500);
                  }}
                />
              </div>
            </div>
            <div className="row">
              <vscode-label htmlFor="species" className="vscode-label">
                Species:
              </vscode-label>
              <div className="value">
                <vscode-single-select
                  id="species"
                  value={petObject.species}
                  onInput={(event) => {
                    const value = event.currentTarget.value;
                    const target = event.currentTarget;
                    // wait 500 ms before updating the document
                    // only update if in the meantime no other input was given
                    setTimeout(() => {
                      if (value === target.value) {
                        petObject.species = value;
                        updateDocument();
                      }
                    }, 500);
                  }}
                >
                  <vscode-option>-</vscode-option>
                  <vscode-option description="bird">Bird</vscode-option>
                  <vscode-option description="cat">Cat</vscode-option>
                  <vscode-option description="dog">Dog</vscode-option>
                </vscode-single-select>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default Pet;
