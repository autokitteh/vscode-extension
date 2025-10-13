# 🐾 AutoKitteh - Visual Studio Code Extension

## Overview 🌟

[AutoKitteh](https://www.autokitteh.com) is an open-source, developer-first framework aimed at simplifying the automation of distributed systems. It supports various deployment models including on-prem, cloud, and hybrid systems.

This repository contains the VSCode Extension to work with the AutoKitteh backend. The extension integrates AutoKitteh functionality directly into your VSCode environment, allowing developers to create and manage AutoKitteh projects without leaving their preferred IDE. It provides features to create projects from templates or start blank projects, manage project entities (such as code files, connections, triggers, and variables), build and deploy projects, and monitor deployments and sessions. This extension facilitates the AutoKitteh workflow, enabling developers to efficiently create, develop, and deploy automation projects within the familiar VSCode interface.

![image](https://github.com/user-attachments/assets/9e616d38-209a-43f2-ab1b-c0998af54616)

This overview explains that it's a VSCode extension, outlines its main features, and emphasizes how it integrates AutoKitteh functionality into the VSCode environment. It maintains the core ideas from the web UI version but adapts them to the context of a VSCode extension.

## How to Install and Run 🛠️

### Prerequisites 📋

Ensure you have the following installed on your system:

-   **Node.js** (version 16.x or later)
-   **npm** (version 7.x or later)
-   **Git** (for version control and repository management)
 
### Installation Steps 🚀

1.  **Clone the Repository**:

    `git clone https://github.com/autokitteh/web-platform && cd autokitteh`

2.  **Get AutoKitteh Submodule**: Use git to install the AutoKitteh submodule:

    `git submodule update --init`

3.  **Install Dependencies**: Use npm to install all the required dependencies:

    `npm install`

### Running the Project 🏃

1.  **Development Mode**: Start the webiew development server with hot reloading.

    `cd vscode-react && npm run watch`

2.  **Run The Extension**: Click F5 to run the extension in a new window or go to command pallete, look and run `Debug : Start Debugging`.

3.  **Develop**: When the code is changed - re-run the extension by pressing `Shift+CMD+F5` on macOS or `Shift+Ctrl+F5` for Linux or Windows.

## Tools We Used 🛠️

In this project we used:
 - [FontAwesome](https://fontawesome.com), [vscode-codicons](https://github.com/microsoft/vscode-codicons) and [tabler-icons](https://github.com/tabler/tabler-icons)  for our webview icons.
 - [LottieFiles](https://lottiefiles.com/) for animations in our webview. 

## Contact 📬

For inquiries, contact: meow@autokitteh.com

## License 📜

The [autokitteh](https://autokitteh.com) license identifier for this project is `Apache-2.0`.

## How to Contribute 🤝

To contribute to autokitteh, please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file.

We appreciate contributions from everyone!

### How it's built 🛠

1.  [Extension Commands](docs/extension-commands.md)
2.  [Extension Structure](docs/extension-structure.md)
3.  [Apply Manifest Command Flows](docs/commands/apply-manifest-flows.md)

