import express from 'express';
import * as createPost from '../lambdas/create-post';
import * as deletePost from '../lambdas/delete-post';
import * as sessionId from '../lambdas/session-id';
import * as signIn from '../lambdas/sign-in';
import * as token from '../lambdas/token';
import * as bot from '../lambdas/bot';

const app = express();
const api = express.Router();

function createEndpointHandler(handler: any) {
  return async (req: express.Request, res: express.Response) => {
    const result = await handler({
      httpMethod: req.method,
      path: req.path,
      queryStringParameters: req.query,
      headers: { Authorization: req.headers.authorization },
      body: req.body,
    });

    const { statusCode, body, headers } = result;
    res.status(statusCode);

    for (const [key, value] of Object.entries(headers || {})) {
      res.setHeader(key, value as any);
    }

    res.send(body);
  };
}

api.use('/sign-in', createEndpointHandler(signIn.handler));
api.use('/create-post', createEndpointHandler(createPost.handler));
api.use('/delete-post', createEndpointHandler(deletePost.handler));
api.use('/session-id', createEndpointHandler(sessionId.handler));
api.use('/token', createEndpointHandler(token.handler));
api.use('/bot', createEndpointHandler(bot.handler));
app.use(express.raw({ type: '*/*' }), api);

app.listen(process.env.PORT, () => console.log('up'));
