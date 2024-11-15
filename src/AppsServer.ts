class AppsServer {

  /**
   * App server definition
   * Requests made successfully through a server object will always return a json response with a body prop
   *   - The body of the response will be either json type, or html type content
   * Requests that error will return a json response with an error prop
   *   - The error of the response will be an object with at minimum a message, but may also have a cause property
   * @param {AppsServerOptions} options 
   */
  static create(options: AppsServerOptions = {}) {
    //TODO: default options
    const debug = options.debug || false;

    const STATUS_CODE: STATUS_CODE_ENUM = {
      SUCCESS: 200,
      CREATED: 201,
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      SERVER_ERROR: 500
    };

    const MIME_TYPES: MIME_TYPE_ENUM = {
      JSON: 'application/json',
      HTML: 'text/html',
      CSV: 'text/csv',
      JS: 'js/object',
      RAW: 'data/raw'
    };

    const parseRouteWithParams = (route: string) => {
      const params: AppsServerParams = {};
      const [routestr, paramstr] = route.split('?');
      if (!paramstr)
        return {
          route: routestr,
          params
        };

      const elements = paramstr.split('&');
      elements.forEach(el => {
        const [prop, val] = el.split('=');
        params[decodeURIComponent(prop)] = decodeURIComponent(val);
      });

      return {
        route: routestr,
        params
      };
    };

    /**
     * Attempts to find and tokenize a matching route with named parames (ie. /home/user/:id)
     * @param {AppsRequest} req - request obj
     * @param {AppsRoutes} method - route methods
     */
    const findTokenRoute = (req: AppsRequest, method: AppsRoutes) => {
      const tokenRoutes = Object.keys(method).filter(key => key.includes(':'));

      for (const route of tokenRoutes) {
        const tk = tokenizeRoute(route);
        if (tk.isMatch(req.route)) {
          req.params = {
            ...req.params,
            ...tk.paramsFromTokens(req.route)
          };
          return method[route];
        }
      }
    };

    // https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
    const escapeStringForRegex = (str: string) => str.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');

    /**
     * Tokenizes a registered route so that it can be used to match a requested route
     * @param {string} route - registered route to tokenize for matching
     */
    const tokenizeRoute = (route: string) => {
      const parts = route.split('/');
      // if theres a part that starts with ':' it means its a route param,
      // so that means we have to pick that part out of the actual route and get that as a param somehow...
      // So the regex could become => :param replace with [^/]* then matching...
      // and the param could remember where it came from (before and after uri, then match within...)

      const tokens: string[][] = [];
      parts.forEach((p, i) => {
        if (p.startsWith(':')) {
          tokens.push([parts[i - 1] || '', p, parts[i + 1] || '']);
        }
      });

      // now we can match the route still...
      const matcher = route.replace(/:[^/]*/g, '[^/]*');
      const isMatch = (sent: string) => new RegExp(matcher).test(sent);

      // and when we get a route, we can match the values
      const paramsFromTokens = (sent: string) => {

        const params: AppsServerParams = {};
        tokens.forEach(t => {
          const key = t[1].replace(':', '');
          const before = t[0];
          const after = t[2];

          const [match] = (sent.match(`(?<=.*/${before !== undefined ? escapeStringForRegex(before) : ''}/)([^/]*)(?=/?${after !== undefined ? escapeStringForRegex(after) : ''}.*)`) || []);
          params[key] = decodeURIComponent(match || '');
        });

        return params;
      };

      return { isMatch, paramsFromTokens };

    };

    const matchRoute = (pattern: string, route: string) => new RegExp(pattern).test(route);

    const middleware: AppsHandlerFunction[] = [];

    const use = (route: string, fn: AppsHandlerFunction) => {
      const matcher = typeof route === 'function'
        ? () => true
        : (requested: string) => matchRoute(route, requested);

      const mw = (req: AppsRequest, res: AppsInternalResponse, next: AppsNextMw) =>
        matcher(req.route)
          ? fn(req, res, next)
          : next();
      middleware.push(mw);
    };

    const errors: AppsErrorHandler[] = [];
    const error = (fn: AppsErrorHandler) => errors.push(fn);

    const gets: AppsRoutes = {};

    const get = (route: string, ...fns: AppsHandlerFunction[]) => {
      gets[route] = fns;
    };

    const posts: AppsRoutes = {};

    const post = (route: string, ...fns: AppsHandlerFunction[]) => {
      posts[route] = fns;
    };

    const deletes: AppsRoutes = {};

    const del = (route: string, ...fns: AppsHandlerFunction[]) => {
      deletes[route] = fns;
    };

    const methods = {
      get: gets,
      post: posts,
      delete: deletes
    };

    /**
     * Print routes
     */
    const inspect = () => {
      let details = 'AppsServer inspect:\n\n';

      details += 'GET ROUTES\n';
      details += '---------------------\n';
      details += Object.keys(gets).join('\n');
      details += '\n---------------------\n\n';

      details += 'POST ROUTES\n';
      details += '---------------------\n';
      details += Object.keys(posts).join('\n');
      details += '\n---------------------\n\n';

      details += 'DELETE ROUTES\n';
      details += '---------------------\n';
      details += Object.keys(deletes).join('\n');
      details += '\n---------------------\n\n';

      console.log(details);
      return details;
    };

    /**
     * Create new response obj
     */
    const response = () => {
      const res: AppsResponse = {
        status: 999,
        headers: {},
        type: MIME_TYPES.JSON,
        body: null,
        toType: () => {
          if (res.type === MIME_TYPES.JSON)
            return JSON.stringify(res);

          if (res.type === MIME_TYPES.RAW)
            return res.body;

          return res;
        }
      };

      const isSuccess = () => res.status >= 200 && res.status < 300;

      const send = <T>(body: T) => {
        res.body = body;
        return res;
      };

      const render = ({ html, file }: { html: string, file: string }, props: object) => {
        const template = html
          // @ts-ignore
          ? HtmlService.createTemplate(html)
          : file
            // @ts-ignore
            ? HtmlService.createTemplateFromFile(file)
            // @ts-ignore
            : HtmlService.createTemplate('');

        template.props = props;
        const output = template.evaluate();

        res.status = STATUS_CODE.SUCCESS;
        res.type = MIME_TYPES.HTML;
        res.body = output;

        return res;
      };

      const type = (ty: AppsMimeType) => {
        res.type = ty;
        return api;
      };

      const status = (code: AppsStatusCode) => {
        res.status = code;
        return api;
      };

      const headers = (hdrs: AppsServerParams) => {
        res.headers = {
          ...res.headers,
          ...hdrs
        };
        return api;
      };

      /** @type {AppsInternalResponse} */
      const api = {
        locals: {},
        isSuccess,
        send,
        render,
        status,
        headers,
        type,
        res
      };

      return api;
    };

    /**
     * Middleware stack composer
     */
    const mwstack = (req: AppsRequest, res: AppsInternalResponse, handlers: AppsHandlerFunction[]) => {
      let index = 0;
      const all = [
        ...middleware,
        ...handlers
      ];

      const nxt = (i: number): any => {
        index = i;

        let mw = all[index];
        if (!mw) {
          // If we have made it to the last element of the stack (which will be the route handler, it is undefined, return NOT_FOUND_RESPONSE)
          if (index === all.length)
            return res.status(STATUS_CODE.NOT_FOUND).send({ message: `${req.route} not a valid route!` });
          else
            throw new Error(`Something went wrong in the mw stack for index ${index}`);
        }

        return mw(req, res, nxt.bind(null, index + 1));
      };

      return nxt(0);
    }

    /**
     * Handles a request from the client
     */
    const request = (req: AppsRequest) => {

      try {
        // @ts-ignore
        req.by = Session.getActiveUser().getEmail();
        req.auth = {};

        req.params = req.params || {};
        req.rawRoute = req.route;

        const parsed = parseRouteWithParams(req.route);
        req.route = parsed.route;
        req.params = {
          ...req.params,
          ...parsed.params
        };

        const res = response();
        const method: AppsRoutes = methods[String(req.method).toLowerCase() as AppsRequestMethod] || {};

        let handler = method[req.route];
        if (!handler)
          handler = findTokenRoute(req, method) || [];

        debug && console.time('mwstack');
        mwstack(req, res, handler);
        debug && console.timeEnd('mwstack');

        return res.res;
      } catch (err) {
        const error: AppsErrorLike = err as AppsErrorLike;
        const res = response();
        console.error(error);
        console.error(error.stack);

        res.status(error.code || STATUS_CODE.SERVER_ERROR)
          .send({
            name: error.name,
            message: error.code ? error.message : 'Something went wrong!',
            stack: debug ? error.stack : undefined
          });

        errors.forEach(handler => {
          try {
            handler(error, req);
          } catch (inner) {
            const handlerError: AppsErrorLike = inner as AppsErrorLike;
            console.error(handlerError);
            console.error(handlerError.stack);
          }
        });

        if (debug) {
          console.log('error-request', req);
          console.log('error-response', res);
        }

        return res.res;
      }

    };

    /**
     * Helper to handle client requests, call this from the top level "api" function in your app
     * @param {AppsRequest} req - request
     */
    const handleClientRequest = (req: AppsRequest | string) => {
      const parsed: Partial<AppsRequest> = !req
        ? {}
        : typeof req === 'string'
          ? JSON.parse(req)
          : req;

      //ignore any additional props of the request so we know the request is clean when it comes in
      const {
        method,
        headers,
        route,
        params,
        body
      } = parsed;

      return request({
        method: method || 'get',
        headers,
        route: route || '',
        params,
        body
      }).toType();
    };

    /**
     * Helper to handle doGet request (just call this with your server obj in your doGet fn)
     */
    // @ts-ignore
    const handleDoGet = (event: GoogleAppsScript.Events.DoGet = {}, { homeroute = '/' } = {}) => {
      const pathInfo = event.pathInfo === undefined ? '' : event.pathInfo
      const path = String(pathInfo).toLowerCase();

      if (path.startsWith('api/')) {
        const response = handleClientRequest({
          method: 'get',
          route: path.slice(3),
          params: event.parameter
        });

        // @ts-ignore
        return ContentService
          .createTextOutput(response)
          // @ts-ignore
          .setMimeType(ContentService.MimeType.JSON);
      }

      const content = request({
        method: 'get',
        route: path !== '' ? `/${path}` : homeroute,
        params: event.parameter
      });

      return content.body;
    };

    /**
     * Helper to handle doPost request (just call this with your server obj in your doPost fn)
     */
    // @ts-ignore
    const handleDoPost = (event: GoogleAppsScript.Events.DoPost = {}) => {
      const pathInfo = event.pathInfo === undefined ? '' : event.pathInfo
      const fullPath = String(pathInfo).toLowerCase();
      const path = fullPath.startsWith('api/')
        ? fullPath.slice(3)
        : `/${fullPath}`;

      const {
        method,
        type = 'application/json'
      } = event.parameter;

      const body = type === 'application/json'
        ? JSON.parse(event.postData.contents)
        : event.postData.contents;

      const response = handleClientRequest({
        method: method || 'post',
        route: path,
        body,
        params: event.parameter
      });

      // @ts-ignore
      return ContentService
        .createTextOutput(response)
        // @ts-ignore
        .setMimeType(ContentService.MimeType.JSON);
    };

    /** @type {AppsServer} */
    return {
      STATUS_CODE,
      MIME_TYPES,
      inspect,
      use,
      error,
      get,
      post,
      delete: del,
      request,
      handleClientRequest,
      handleDoGet,
      handleDoPost
    };
  }

}

class ApiError extends Error {
  code: number;

  constructor(message: string, { code = 400 } = {}) {
    super(message);
    this.code = code;
  }
}