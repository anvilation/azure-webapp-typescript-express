import {
  JsonController,
  Post,
  BodyParam,
  NotAcceptableError,
  Authorized,
  CurrentUser,
  Req,
  Res,
  UnauthorizedError,
  Get
} from 'routing-controllers';
import jwt = require('jsonwebtoken');
import bcrypt from 'bcrypt';
/*
    BIG FAT WARNING
    I am using static usernames and passwords here for illstrative purposes only
*/

@JsonController()
export class LoginController {
  private user = {
    name: 'user',
    password: 'muchcomplex'
  };
  jwtKey = process.env.JWTKEY || 'complexKey';
  private saltRounds = 10;
  constructor() {
    bcrypt.genSalt(this.saltRounds, (err: Error, salt: string) => {
      bcrypt.hash(this.user.password, salt, (hashErr: Error, hash: string) => {
        this.user.password = hash;
      });
    });
  }

  @Post('/login')
  login(@BodyParam('user') user: string, @BodyParam('pass') pass: string) {
    if (!user || !pass) {
      // No data supplied
      throw new NotAcceptableError('No Email or Password provided');
    } else if (user !== this.user.name) {
      // No data supplied
      throw new NotAcceptableError('Username Incorrect');
    } else {
      return new Promise<any>((ok, fail) => {
        bcrypt.compare(
          pass,
          this.user.password,
          (err: Error, result: boolean) => {
            if (result) {
              const token = jwt.sign(
                {
                  exp: Math.floor(Date.now() / 1000) + 60 * 60,
                  data: {
                    username: this.user.name
                  }
                },
                this.jwtKey
              );
              ok({
                token: token
              });
            } else {
              fail(new UnauthorizedError('Password do not match'));
            }
          }
        );
      });
    }
  }

  @Authorized()
  @Get('/routewauth')
  authrequired(@Req() request: any, @Res() response: any) {
    return response.send('<h1>Oh hai authorised world</h1>');
  }

  @Authorized()
  @Get('/routewacurrentuser')
  updatepass(
    @CurrentUser({ required: true }) currentuser: any,
    @Res() response: any
  ) {
    return response.send(`<h1>Oh hai ${currentuser.user} world</h1>`);
  }
}
