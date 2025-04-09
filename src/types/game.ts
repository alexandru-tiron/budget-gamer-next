

export type FreeGame = {
    id: string;
    name: string;
    cover: string;
    cover_portrait: string;
    description: string;
    developer: string;
    start_date: EpochTimeStamp;
    end_date: EpochTimeStamp;
    free: boolean;
    giveaway: boolean;
    platform_ids: string;
    provider_id: string;
    provider_url: string;
    publisher: string;
    release_date: EpochTimeStamp;
};

export type SubscriptionGame = {
    cover: string;
    cover_portrait: string;
    description: string;
    developer: string;
    start_date: EpochTimeStamp;
    end_date: EpochTimeStamp;
    giveaway: boolean;
    id: string;
    name: string;
    platform_ids: string;
    provider_id: string;
    provider_url: string;
    publisher: string;
    release_date: EpochTimeStamp;
}

export type Article = {
    id: string;
    cover: string;
    description: string;
    link: string;
    domain: string;
    start_date: EpochTimeStamp;
    end_date: EpochTimeStamp;
    title: string;
    uid?: string;
}
