import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphqlController } from './graphql/graphql.controller';

@Module({
  imports: [],
  controllers: [AppController, GraphqlController],
  providers: [AppService],
})
export class AppModule {}
