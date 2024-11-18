"use strict";
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
        const auth = (req, res, next) => {
            const authUsers = [
                'user1',
                'user2'
            ];
            if (authUsers.includes(String(req.by))) {
                next();
            }
            else {
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
function api(request) {
    return MyExampleApp.server().handleClientRequest(request);
}
/**
 * Public handler for all get requests
 */
function doGet(e) {
    return MyExampleApp.server().handleDoGet(e, { homeroute: '/index' });
}
/**
 * Public handler for all post requests
 */
function doPost(e) {
    return MyExampleApp.server().handleDoPost(e);
}
