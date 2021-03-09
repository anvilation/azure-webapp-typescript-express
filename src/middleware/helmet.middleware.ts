import helmet from "helmet";
import { ExpressMiddlewareInterface, Middleware } from "routing-controllers";

@Middleware({ type: 'before' })
export class HelmetMiddleware implements ExpressMiddlewareInterface {
  public use(request: any, response: any, next?: (err?: any) => any): any {

    return helmet()(request, response, next);
  }
}
