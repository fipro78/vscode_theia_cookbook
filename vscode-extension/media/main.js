// Script run within the webview itself.
(function () {
  // Get a reference to the Visual Studio Code webview api.
  // We use this API to post messages back to our extension.

  const vscode = acquireVsCodeApi();

  const personContainer = /** @type {HTMLElement} */ (
    document.querySelector(".person")
  );

  const errorContainer = document.createElement("div");
  document.body.appendChild(errorContainer);
  errorContainer.className = "error";
  errorContainer.style.display = "none";

  /**
   * Render the document in the webview.
   */
  function updateContent(/** @type {string} */ text) {
    let json;
    try {
      if (!text) {
        text = "{}";
      }
      json = JSON.parse(text);
    } catch {
      personContainer.style.display = "none";
      errorContainer.innerText = "Error: Document is not valid json";
      errorContainer.style.display = "";
      return;
    }
    personContainer.style.display = "";
    errorContainer.style.display = "none";

    const firstname = document.getElementById("firstname");
    const lastname = document.getElementById("lastname");

    if (json.firstname) {
      firstname.value = json.firstname;
    }
    if (json.lastname) {
      lastname.value = json.lastname;
    }

    firstname.oninput = () => {
      let value = firstname.value;
      // wait 500 ms before updating the document
      // only update if in the meantime no other input was given
      setTimeout(() => {
        if (value === firstname.value) {
          json.firstname = firstname.value;
          vscode.postMessage({
            type: "updateDocument",
            text: JSON.stringify(json, null, 2),
          });
        }
      }, 500);
    };

    lastname.oninput = () => {
      let value = lastname.value;
      // wait 500 ms before updating the document
      // only update if in the meantime no other input was given
      setTimeout(() => {
        if (value === lastname.value) {
          json.lastname = lastname.value;
          vscode.postMessage({
            type: "updateDocument",
            text: JSON.stringify(json, null, 2),
          });
        }
      }, 500);
    };
  }

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case "update":
        const text = message.text;

        // Update our webview's content
        updateContent(text);

        // Then persist state information.
        // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
        vscode.setState({ text });

        return;
    }
  });

  // Webviews are normally torn down when not visible and re-created when they become visible again.
  // State lets us save information across these re-loads
  const state = vscode.getState();
  if (state) {
    updateContent(state.text);
  }
})();
