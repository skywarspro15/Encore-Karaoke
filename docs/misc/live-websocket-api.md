[← Back to Misc](./README.md)

# Live WebSocket API

The live WebSocket API allows your CherryTree Console session to talk to the server and perform functions in real time.

## Quick overview

This is a basic breakdown of what happens as soon as you log in:

- Your client connects to the server, creating a websocket session.
- The server tells all your currently online friends (through your Cherries account) that you have come online.

If you launch a game, this happens:

- Your client tells the server what game it is going to launch.
- The server then tells all your currently online friends about the game you are playing.

## Breakdown

The WebSocket API is in JSON format, and there is a defined schema.

### Client -> Server message schema 
```ts
interface ClientToServerMessage {
  // The type of message to be sent.
  type: string;
  // The actual message content or data.
  message?: string;
  // The message ID, used as a unique identifier,
  // useful for awaiting incoming messages.
  id?: string;
}
```

For server-side, there is not really a defined schema, but most will respond as follows:
```ts
interface ServerToClientMessage {
  // (if applicable)
  // The ID of the client's message, coming back as the same string.
  id?: string;
  // The type of the incoming message.
  // If it is "message", then expect a "message" property
  // to contain popup message information.
  type: string;
  // Optional message information, not sent with most requests.
  message?: string;
  // Response data, might be a string or other information.
  data: string;
}
```

## Message list

The following lists possible messages that can be sent from client to server using the previously mentioned schema.

### C->S

**Note: most of this is TODO and unfinished! Check back later.**

- type `ping`, message `<none>`   
  S->C: type `pong`, message `<none>`.
- type `now-playing`, message `game name`   
  S->C: (no direct response to you)   
  S->C: (to all your friends)   
  type `message`,   
  message `{"title":"Now playing", "description":"<name> is now playing <game>."}`.       
- type `get`, message `<none>`    
  S->C: type `<none>`, count `number of total users online`
- type `send-friend-request`, message `username to send request to`   
  expect S->C type `success` or `error` with more information.  
- type `get-friend-requests`, message `<none>`  
  expect S->C type `retrieveFriendRequests`, result being all the friend requests.
- type `accept-friend-request`, message `user id to accept`
- type `reject-friend-request`, message `user id to reject`
- type `remove-friend`, message `user id to remove`
- type `get-friends`, message `<none>`