import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
	imports: [
    DbModule,
		ConfigModule.forRoot({
			isGlobal: true,
		}),
	AuthModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
