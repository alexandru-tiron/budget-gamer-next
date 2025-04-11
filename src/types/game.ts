

export type FreeGame = {
    id: number;
    name: string;
    cover: string;
    cover_portrait: string;
    description: string;
    developer: string;
    start_date: Date;
    end_date: Date;
    free: boolean;
    platform_ids: string[];
    provider_id: string;
    provider_url: string;
    publisher: string | null;
    release_date: Date | null;
    createdAt: Date;
    updatedAt?: Date |null;    
};

export type SubscriptionGame = {
    id: number;
    name: string;
    cover: string;
    cover_portrait: string;
    description: string;
    developer: string;
    start_date: Date;
    end_date: Date;
    platform_ids: string[];
    provider_id: string;
    provider_url: string;
    publisher: string | null;
    release_date: Date | null;
    createdAt: Date;
    updatedAt?: Date |null;    
}

export type Article = {
    id: number;
    title: string;
    description: string;
    cover: string;
    link: string;
    domain: string;
    start_date: Date;
    end_date: Date;
    createdAt: Date;
    updatedAt?: Date |null;    
}
