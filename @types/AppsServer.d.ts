type AppsStatusCode = 200 | 201 | 400 |401 | 403 | 404 | 500 | 999;
type STATUS_CODE_ENUM = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
};
type AppsMimeType = 'application/json' | 'text/html' | 'text/csv' | 'js/object' | 'data/raw';
type MIME_TYPE_ENUM = {
  JSON: 'application/json',
  HTML: 'text/html',
  CSV: 'text/csv',
  JS: 'js/object',
  RAW: 'data/raw'
};
type AppsServerOptions = {
  debug?: boolean;
};
type AppsRequestMethod = 'get' | 'post' | 'delete';
type AppsServerParams = { [key: string]: string };

interface AppsServer {
  STATUS_CODE: STATUS_CODE_ENUM;
  MIME_TYPES: MIME_TYPE_ENUM;
  /** Prints route details */
  inspect: () => string;
  /** Registers a middleware handler for the given route regex */
  use: (route: string, fn: AppsHandlerFunction) => void;
  /** Registers an error handler (can have multiple) */
  error: (fn: AppsErrorHandler) => void;
  /** Registers a get request handler */
  get: (route: string, ...fn: AppsHandlerFunction[]) => void;
  /** Registers a post request handler */
  post: (route: string, ...fn: AppsHandlerFunction[]) => void;
  /** Registers a delete request handler */
  delete: (route: string, ...fn: AppsHandlerFunction[]) => void;
  /** Handles processing a request */
  request: (req: AppsRequest) => object;
  /** Helper function for handling a request from the Apps Script client HTML app of a deployed web app */
  handleClientRequest: (req: AppsRequest | string) => string | object | null | AppsResponse;
  /** Helper function for handling a doGet request */
  handleDoGet: (event: GoogleAppsScript.Events.DoGet, options: { homeroute: string }) => GoogleAppsScript.HTML.HtmlOutput | GoogleAppsScript.Content.TextOutput;
  /** Helper function for handling a doPost request */
  handleDoPost: (event: GoogleAppsScript.Events.DoPost) => GoogleAppsScript.Content.TextOutput
};

interface AppsRequest {
  method: AppsRequestMethod;
  headers?: StringObject;
  by?: string;
  auth?: object;
  rawRoute?: string;
  route: string;
  params?: StringObject;
  body?: any
};

interface AppsResponse {
  status: AppsStatusCode;
  type: AppsMimeType;
  headers: StringObject;
  body?: any;
  toType: () => string | object | null | AppsResponse
};

interface AppsInternalResponse {
  res: AppsResponse;
  locals?: object;
  isSuccess: () => boolean;
  send: (body: object) => AppsResponse;
  render: ({ html, file }: { html?: string, file?: string }, props?: object) => AppsResponse;
  type: (ty: AppsMimeType) => AppsInternalResponse;
  status: (code: AppsStatusCode) => AppsInternalResponse;
  headers: (hdrs: StringObject) => AppsInternalResponse
};

type AppsNextMw = (i?: number) => void;
type AppsHandlerFunction = (req: AppsRequest, res: AppsInternalResponse, next: AppsNextMw) => void;
type AppsErrorHandler = (err: Error | ApiError, req: AppsRequest) => void;

interface AppsErrorLike extends Error{
  code?: AppsStatusCode
}

interface AppsRoutes {
  [key: string]: AppsHandlerFunction[]
};