ALTER TABLE "budget-gamer-next_free_games" ALTER COLUMN "start_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "budget-gamer-next_free_games" ALTER COLUMN "end_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "budget-gamer-next_free_games" ALTER COLUMN "free" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "budget-gamer-next_free_games" ALTER COLUMN "platform_ids" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "budget-gamer-next_free_games" ALTER COLUMN "publisher" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "budget-gamer-next_subscription_games" ALTER COLUMN "start_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "budget-gamer-next_subscription_games" ALTER COLUMN "end_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "budget-gamer-next_subscription_games" ALTER COLUMN "platform_ids" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "budget-gamer-next_subscription_games" ALTER COLUMN "publisher" DROP NOT NULL;