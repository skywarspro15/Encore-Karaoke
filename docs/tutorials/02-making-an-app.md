[← Back to Tutorials](./README.md)  
[← Previous Tutorial: Setting up the workspace](./01-setting-up-workspace.md)

# Making your first App

This guide will show you how to make an app that works with the CherryTree core.

## Prerequisites

This guide assumes you already have a [workspace set up](01-setting-up-workspace.md).

## Creating the app file

Let's make an app file to store the contents of your app. 

Think of a name for your app, and place it in this path: `/pkgs/apps/[Name].js`. In this example, I'll call mine `MyApp.js`.

You can follow along by starting with this boilerplate example app code:

```js
// Example app
const pkg = {
  // The name of the app
  name: "MyApp",
  // The type (usually app)
  type: "app",
  // Whether or not to grant privileges
  privs: 0,
  // The starting function for your app
  async start(Root) {
    console.log("Hi!");
  },
  // The ending function for your app
  async end() {
    console.log("Bye!");
  },
};

// Allow other code to use this package
export default pkg;
```

You may change parts of this code as you want, for example:

- Remove the comments
- Change the name
- Change the console logged messages

## Testing the app

If you already have your workspace set up, visit [localhost:5501](http://localhost:5501) (or your other server port).

Open DevTools (usually CTRL + SHIFT + I or F12) and navigate to the `Console` tab. Once in the Console tab, you can use the following code to run your app:

```js
Core.pkg.run("apps:MyApp");
```

If you see the text "Hi!" in the console, your app has run successfully!

[Continue to Importing Libraries →](./03-importing-libs.md)