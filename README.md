# @node-libraries/nest-apollo-server samples

Package for calling ApolloServer4 from NestJS.

## Sample

### src/main.js

- Express

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });
  await app.listen(3000);
  console.log('http://localhost:3000/graphql');
}
bootstrap();
```

- Fastify

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter();
  fastifyAdapter.getInstance().removeAllContentTypeParsers();
  fastifyAdapter
    .getInstance()
    .addContentTypeParser('*', { bodyLimit: 0 }, (_request, _payload, done) => {
      done(null, null);
    });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
    {
      bodyParser: false,
    },
  );
  await app.listen(3000);
  console.log('http://localhost:3000/graphql');
}
bootstrap();
```

### src/graphql/graphql.controller.ts

- Create command  
  `nest g co graphql`

```ts
import { promises as fs } from 'fs';
import {
  All,
  Controller,
  Req,
  Res,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ApolloServer } from '@apollo/server';
import {
  executeHTTPGraphQLRequest,
  FormidableFile,
  Raw,
  Request,
  Response,
} from '@node-libraries/nest-apollo-server';

export const typeDefs = `
  # Return date
  scalar Date
  type Query {
    date: Date!
  }

  # Return file information
  type File {
    name: String!
    type: String!
    value: String!
  }
  scalar Upload
  type Mutation {
    upload(file: Upload!): File!
  }
`;

export const resolvers = {
  Query: {
    date: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return new Date();
    },
  },
  Mutation: {
    upload: async (_context, { file }: { file: FormidableFile }) => {
      return {
        name: file.originalFilename,
        type: file.mimetype,
        value: await fs.readFile(file.filepath, { encoding: 'utf8' }),
      };
    },
  },
};

@Controller('/graphql')
export class GraphqlController implements OnModuleInit, OnModuleDestroy {
  apolloServer: ApolloServer;
  onModuleInit() {
    console.log('init');
    this.apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
    });
    return this.apolloServer.start();
  }
  onModuleDestroy() {
    this.apolloServer.stop();
  }
  @All()
  async graphql(@Req() req: Request, @Res() res: Response) {
    await executeHTTPGraphQLRequest({
      req,
      res,
      apolloServer: this.apolloServer,
      context: async () => ({ req: Raw(req), res: Raw(res) }),
      options: {
        //Maximum upload file size set at 10 MB
        maxFileSize: 10 * 1024 * 1024,
      },
    });
  }
}
```

### checking the operation

<http://localhost:3000/graphql>
