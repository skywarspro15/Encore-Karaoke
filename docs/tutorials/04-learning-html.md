[← Back to Tutorials](./README.md)  
[← Previous Tutorial: Making an app](./02-making-an-app.md)

# Importing Libraries

This guide will show you how to import libraries into your CherryTree Core app.

## Prerequisites

This guide assumes you already have a [workspace set up](01-setting-up-workspace.md), an app file created, and the Html library imported.

## Learning how to use the Html class

Inside your app file, under the `start()` function, add this line:

```js
new Html("h1").text("My first HTML Element!").appendTo("body");
```

Hit save and re-run the code to start your app in the console:

```js
Core.pkg.run("apps:MyApp");
```

Somewhere on the screen, you will see the text "My first HTML Element!" appear. 

This is just some of the basic usage of the Html library. You can learn more at the [Html documentation](../libs/html.md).

