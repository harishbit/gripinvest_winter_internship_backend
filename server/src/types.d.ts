// Global type declarations to resolve module issues
declare module 'express' {
  export interface Request {
    body: any;
    params: any;
    query: any;
    headers: any;
    path: string;
    method: string;
    originalUrl: string;
  }
  
  export interface Response {
    statusCode: number;
    status(code: number): Response;
    json(body: any): Response;
    send(body: any): Response;
  }
  
  export interface NextFunction {
    (error?: any): void;
  }
  
  export interface Router {
    get(path: string, handler: (req: Request, res: Response) => void): void;
    post(path: string, handler: (req: Request, res: Response) => void): void;
    put(path: string, handler: (req: Request, res: Response) => void): void;
    delete(path: string, handler: (req: Request, res: Response) => void): void;
  }
  
  export interface Application {
    use(...args: any[]): void;
    get(path: string, handler: (req: Request, res: Response) => void): void;
    post(path: string, handler: (req: Request, res: Response) => void): void;
    put(path: string, handler: (req: Request, res: Response) => void): void;
    delete(path: string, handler: (req: Request, res: Response) => void): void;
    listen(port: number | string, callback?: () => void): void;
  }
  
  interface ExpressStatic {
    (): Application;
    json(options?: any): any;
    urlencoded(options?: any): any;
    Router(): Router;
  }
  
  const express: ExpressStatic;
  export default express;
}

declare module 'cors' {
  function cors(options?: any): any;
  export default cors;
}

declare module 'jsonwebtoken' {
  export interface SignOptions {
    expiresIn?: string | number;
    algorithm?: string;
  }
  
  export function sign(payload: any, secret: string, options?: SignOptions): string;
  export function verify(token: string, secret: string): any;
}

declare module 'swagger-jsdoc' {
  function swaggerJSDoc(options: any): any;
  export default swaggerJSDoc;
}

declare module 'swagger-ui-express' {
  export function setup(swaggerDocument: any, options?: any): any;
  export function serve(req: any, res: any, next: any): void;
}

declare module 'drizzle-kit' {
  export interface Config {
    schema: string;
    out: string;
    dialect: string;
    dbCredentials: any;
  }
}
