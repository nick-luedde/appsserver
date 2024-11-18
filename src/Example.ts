/**
 * Example of a server/index.gs type file for an Apps Script web app
 */

class MyExampleApp {

  /**
   * Setup your server to handle all requests
   */
  static server() {
    const server = AppsServer.create();

    /**
     * Auth middleware to check if the request came from an authorized user 
     */
    const auth: AppsHandlerFunction = (req, res, next) => {
      const authUsers = [
        'user1',
        'user2'
      ];

      if (authUsers.includes(String(req.by))) {
        next();
      } else {
        res.status(server.STATUS_CODE.FORBIDDEN).send({ message: 'Not authorized!' });
      }
    };

    /**
     * Index html route for the app UI html
     */
    server.get('/index', auth, (req, res) => {
      res.status(server.STATUS_CODE.SUCCESS)
        .render({
          html: `<h1>Your app html code here (Though you're more likely to use a file huh...</h1>`
        }, {});
    });

    /**
     * Route for getting task data
     */
    server.get('/app/tasks', auth, (req, res) => {
      const tasks = [
        {
          id: 'task-001',
          title: 'Create Examples.ts',
          done: true
        },
        {
          id: 'task-002',
          title: 'Take a break',
          done: false
        }
      ];

      res.status(server.STATUS_CODE.SUCCESS).send(tasks);
    });

    /**
     * Route for saving a task
     */
    server.post('/task/save', auth, (req, res) => {
      const task = req.body;

      console.log(task);
      res.status(server.STATUS_CODE.SUCCESS).send({ message: 'Task totally saved, and not just logged!' });
    });

    return server;
  }

}

/**
 * Public handler function for all client html app requests
 * (Ideally, create no other public handlers unless needed, so all requests route through the server)
 */
function api(request: AppsRequest) {
  return MyExampleApp.server().handleClientRequest(request);
}

/**
 * Public handler for all get requests
 */
function doGet(e: GoogleAppsScript.Events.DoGet) {
  return MyExampleApp.server().handleDoGet(e, { homeroute: '/index' });
}

/**
 * Public handler for all post requests
 */
function doPost(e: GoogleAppsScript.Events.DoPost) {
  return MyExampleApp.server().handleDoPost(e);
}




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