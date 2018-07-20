# firebase-simple-queue

Simple queue implementation for firebase cloud functions and realtime database

> The queue will sequentially run each task added in the queue

## Installation

`yarn add firebase-simple-queue`

or using npm

`npm install firebase-simple-queue`

## Usage

Initialize the queue in cloud functions index

```javascript
// Import the plugin
import * as queue from 'firebase-simple-queue'

/* Define a callback with your custom async logic
 * You callback will receve as parameter witch you have been pushed in the task
 */
function calback(task) {
  return new Promise(resolve => {
    setTimeout(() => {
      // Do whatever you want.
      resolve()
    }, 5000)
  })
}

/* Initialize the queue
 * @param key A key for the realtime database tree
 * @param callback The callback with your custom logic
 */
const { onCreateTask, onFinishTask, onRetryTask } = queue('queue', callback)

// Now register the cloud functions triggers
export {
  // ...another functions
  onCreateTask,
  onFinishTask,
  onRetryTask
}
```

Add an index in database.rules

```json
{
  "rules": {
    "queue": {
      "tasks": {
        ".indexOn": "_error"
      }
    }
  }
}
```

## Example

Now in your client just add a task in the queue

```javascript
const myTaskObject = { attr1: 'Test1', another_attr: 123 }

// Your task can be a number, string or object
database
  .ref('queue')
  .child('tasks')
  .push(myTaskObject)
```

## What about errors

If a task throws an error, the details will be in a `_error` key inside the task. To try run a task with error again, just remove the key `_error`

The task with the key `_error` will be ignored in the execution queue. Ex: If I have 3 tasks in the queue and the first one is in error, the queue will only execute tasks 2 and 3.

## Development

Just edit the code, commit, and run `./publish.sh`

## Contribution

You can open an issue or send a pull request

## Author

Daniel Fernando Lourusso - dflourusso@gmail.com
