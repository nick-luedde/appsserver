# AppsServer

This library helps create a REST-like server for Google Apps Script projects. This code was inspired by Express.js and Koa.js and other tools like them.
Just copy the [/dist/AppsServer.js](dist/AppsServer.js) file into your project to get started.

## Using the library

Here's a basic example of using the file:

```JavaScript
function createServer() {
  const server = AppsServer.create();

  const auth = (req, res, next) => {
    const users = [
      'user1',
      'user2'
    ];

    if (users.includes(req.by || '')) {
      next();
    } else {
      return res.status(server.STATUS_CODE.FORBIDDEN).send({ message: 'Not authorized' });
    }
  }

  server.get('/tasks/data', auth, (req, res) => {
    const data = [
      {
        id: 'task-001',
        title: 'Example task'
      },
      {
        id: 'task-002',
        title: 'Another task...'
      }
    ];

    res.status(server.STATUS_CODE.SUCCESS).send(data);
  });

  server.post('/task/save', auth, (req, res) => {
    const taskToSave = req.body;
    console.log(taskToSave);

    res.status(server.STATUS_CODE.SUCCESS).send({ message: 'Task totally saved, and not just logged to the console!' });
  });
  
  
  server.delete('/task/delete', auth, (req, res) => {
    const taskToSave = req.body;
    console.log(taskToSave);

    res.status(server.STATUS_CODE.SUCCESS).send({ message: 'Task totally dlete, and not just logged to the console!' });
  });

  return server;
}
```


For a bit more in-depth look, [check out Example.ts](src/Example.ts)