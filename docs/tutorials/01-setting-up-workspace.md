[← Back to Tutorials](./README.md)

# Setting up the workspace

This is a basic guide on how to set up your coding workspace specifically for CherryTree Console.   
For now, I'll assume you know how to use the command line and have the following already installed:

- Visual Studio Code
- Git

The first thing you want to do is clone the repository:

```
git clone https://github.com/cherries-to/cherry-console
```

Then, enter the repository folder, and the public folder.

```
cd cherry-console; cd public
```

Next, open VS Code within the public folder:

```
code .
```

Once VS Code opens, you can take a look around the repository. It is recommended to use the `Live Server` or `Five Server` extensions. (Extensions browser keyboard shortcut is `CTRL` + `SHIFT` + `X`)

Tip: Right-click the `index.html` file (near the bottom of the file browser) and hit `Open With Live Server` or use whatever server you prefer.

## Optional: Setting up the Core

In some later versions, we plan to make the core inaccessible from the main window. You can alleviate this by opening the `core.js` file, and going near the bottom line around here:

```js
// For debugging purposes
// window.Core = Core;
// window.Processes = Processes;
// window.Security = Security;
// window.Libs = Libs;
// window.vfs = vfs;
```

If it looks like this, change them to the following:

```js
// For debugging purposes
window.Core = Core;
window.Processes = Processes;
window.Security = Security;
window.Libs = Libs;
window.vfs = vfs;
```

[Continue to Making your first App →](./02-making-an-app.md)

