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
  // STATUS_CODE;
  // MIME_TYPES;
  inspect: () => string;
  use: (route: string, fn: AppsHandlerFunction) => void;
  error: (fn: AppsErrorHandler) => void;
  get: (route: string, ...fn: AppsHandlerFunction[]) => void;
  post: (route: string, ...fn: AppsHandlerFunction[]) => void;
  delete: (route: string, ...fn: AppsHandlerFunction[]) => void;
  request: (req: AppsRequest) => object;
  handleClientRequest: (req: AppsRequest | string) => object;
  handleDoGet: (event: GoogleAppsScript.Events.DoGet, options: { homeroute: string }) => GoogleAppsScript.HTML.HtmlOutput | GoogleAppsScript.Content.TextOutput;
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
  toType: () => string | object | null | undefined | AppsResponse
};

interface AppsInternalResponse {
  // Internal request structure....
  res: AppsResponse;
  locals?: object;
  isSuccess: () => boolean;
  send: (body: object) => AppsResponse;
  render: ({ html, file }: { html: string, file: string }, props: object) => AppsResponse;
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