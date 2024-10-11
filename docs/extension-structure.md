# Extension structure

This section provides a quick introduction into how this sample extension is organized and structured.

The two most important directories to take note of are the following:

- `src`: Contains all of the extension source code
- `vscode-react`: Contains all of the webview UI source code

## `extension.ts` file

`extension.ts` is where all the logic for activating and deactiving the extension usually live. This is also the place where extension commands are registered.

## `vscode-react` directory

The `vscode-react` directory contains all of the React-based webview source code and can be thought of as containing the "frontend" code/logic for the extension webview.

This directory is special because it contains a full-blown React application which was created using the TypeScript [Vite](https://vitejs.dev/) template. As a result, `vscode-react` contains its own `package.json`, `node_modules`, `tsconfig.json`, and so on––separate from the `autokitteh` extension in the root directory.

This strays a bit from other extension structures, in that you'll usually find the extension and webview dependencies, configurations, and source code more closely integrated or combined with each other.

However, in this case, there are some unique benefits and reasons for why this sample extension does not follow those patterns such as easier management of conflicting dependencies and configurations, as well as the ability to use the Vite dev server, which drastically improves the speed of developing your webview UI, versus recompiling your extension code every time you make a change to the webview.
