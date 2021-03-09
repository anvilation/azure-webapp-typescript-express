import { Controller, Get, Req, Res } from 'routing-controllers';

@Controller()
export class IndexController {
  @Get('/')
 
  getApi(@Req() request: any, @Res() response: any) {
    return response.send('<h1>Oh hai world</h1>');
  }
}
