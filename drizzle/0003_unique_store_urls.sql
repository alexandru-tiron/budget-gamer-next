-- Remove duplicate rows before adding the unique indexes, keeping the newest row for each URL
DELETE FROM "budget-gamer-next_articles" a USING "budget-gamer-next_articles" b WHERE a."link" = b."link" AND a."id" < b."id";--> statement-breakpoint
DELETE FROM "budget-gamer-next_free_games" a USING "budget-gamer-next_free_games" b WHERE a."provider_url" = b."provider_url" AND a."id" < b."id";--> statement-breakpoint
DELETE FROM "budget-gamer-next_subscription_games" a USING "budget-gamer-next_subscription_games" b WHERE a."provider_url" = b."provider_url" AND a."id" < b."id";--> statement-breakpoint
CREATE UNIQUE INDEX "articles_link_idx" ON "budget-gamer-next_articles" USING btree ("link");--> statement-breakpoint
CREATE UNIQUE INDEX "free_games_provider_url_idx" ON "budget-gamer-next_free_games" USING btree ("provider_url");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_games_provider_url_idx" ON "budget-gamer-next_subscription_games" USING btree ("provider_url");
