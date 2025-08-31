[← Back to main documentation page](../README.md)

# Html library

The Html library is a class that can be initialized at any time to create HTML elements in a simple way.

**The examples here use the variable `Html`, it is recommended to import Html from the library, like this:**

```js
import Html from "/libs/html.js";
```

### Examples

For example, I'll show how some layouts can be created in HTML vs the Html class:

```html
<div class="card">
  <span class="h1">This is a heading!</span>
  <span>This is my paragraph text</span>
</div>
```

In Html:

```js
new Html("div")
  .class("card")
  .appendMany(
    new Html("span").class("h1").text("This is a heading!"),
    new Html("span").text("This is my paragraph text")
  );
```

You also have to define where to place the element, using the `.appendTo()` method. Here's an example:

```js
const container = new Html("div").appendTo("body");
// A new div that gets appended to the <body> tag

new Html("span")
  .class("h1")
  .text("Hello, this goes into the container!")
  .appendTo(container);
```

This will create the following layout:

```html
<body>
  <div>
    <span class="h1"> Hello, this goes into the container! </span>
  </div>
</body>
```

### Methods

There are a few more advanced methods to how the Html class works:

- `.style()`  
   Add inline styles
  ```js
  new Html("span").style({
    color: "red",
    // These are CSS style names,
    // so you will have to use dashes..
    "font-size": "18px",
  });
  ```
- `.attr()`  
   Set attributes for the element
  ```js
  new Html("span").attr({
    id: "MySpan",
  });
  // <span id="MySpan"></span>
  ```
- `.class()`  
   Toggle a class
  ```js
  new Html("span").class("my-class");
  // <span class="my-class"></span>
  ```
- `.classOn()`  
   Add a class
  ```js
  new Html("span").classOn("my-class");
  // <span class="my-class"></span>
  ```
- `.classOff()`  
   Remove a class
  ```js
  new Html("span").classOff("my-class");
  // <span></span>
  ```
- `.on(eventName, eventHandler)`  
   Add an event listener

  ```js
  function myEvent(e) {
    console.log(e);
  }

  new Html("span").on("click", myEvent);

  // or

  new Html("span").on("click", function (e) {
    console.log(e);
  });
  ```

- `.un(eventName, eventHandler)`  
   Remove an event listener (if a function is available)

  ```js
  function myEvent(e) {
    console.log(e);
  }

  new Html("span").un("click", myEvent);
  ```

- `.append(elm)`
  Add a new element inside the element
  ```js
  const container = new Html("div").append(
    new Html("span").text("Hello, world!")
  );
  ```
- `.appendMany(...elms)`
  Add multiple elements
  ```js
  new Html("div").appendMany(
    new Html("span").class("h1").text("Hello!"),
    new Html("span").text("Hi!")
  );
  /*
  <div>
    <span class="h1">Hello!</span>
    <span>Hi!</span>
  </div>
  */
  ```
- `.cleanup()`  
  Destroy the element

  ```js
  const div = new Html("div").appendTo("body");

  // later
  div.cleanup();
  ```