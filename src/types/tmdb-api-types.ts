// TMDB API Type Definitions extracted from the generated API file
// These types represent the response structures from TMDB API endpoints

export interface TmdbMovieDetails {
    adult?: boolean;
    backdrop_path?: string;
    belongs_to_collection?: {
        id?: number;
        name?: string;
        poster_path?: string;
        backdrop_path?: string;
    };
    budget?: number;
    genres?: {
        id?: number;
        name?: string;
    }[];
    homepage?: string;
    id?: number;
    imdb_id?: string;
    original_language?: string;
    original_title?: string;
    overview?: string;
    popularity?: number;
    poster_path?: string;
    production_companies?: {
        id?: number;
        logo_path?: string;
        name?: string;
        origin_country?: string;
    }[];
    production_countries?: {
        iso_3166_1?: string;
        name?: string;
    }[];
    release_date?: string;
    revenue?: number;
    runtime?: number;
    spoken_languages?: {
        english_name?: string;
        iso_639_1?: string;
        name?: string;
    }[];
    status?: string;
    tagline?: string;
    title?: string;
    video?: boolean;
    vote_average?: number;
    vote_count?: number;
}

export interface TmdbTvSeriesDetails {
    adult?: boolean;
    backdrop_path?: string;
    created_by?: {
        id?: number;
        credit_id?: string;
        name?: string;
        gender?: number;
        profile_path?: string;
    }[];
    episode_run_time?: number[];
    first_air_date?: string;
    genres?: {
        id?: number;
        name?: string;
    }[];
    homepage?: string;
    id?: number;
    in_production?: boolean;
    languages?: string[];
    last_air_date?: string;
    last_episode_to_air?: {
        id?: number;
        name?: string;
        overview?: string;
        vote_average?: number;
        vote_count?: number;
        air_date?: string;
        episode_number?: number;
        production_code?: string;
        runtime?: number;
        season_number?: number;
        show_id?: number;
        still_path?: string;
    };
    name?: string;
    next_episode_to_air?: {
        air_date?: string;
        episode_number?: number;
        name?: string;
        overview?: string;
        season_number?: number;
    };
    networks?: {
        id?: number;
        logo_path?: string;
        name?: string;
        origin_country?: string;
    }[];
    number_of_episodes?: number;
    number_of_seasons?: number;
    origin_country?: string[];
    original_language?: string;
    original_name?: string;
    overview?: string;
    popularity?: number;
    poster_path?: string;
    production_companies?: {
        id?: number;
        logo_path?: string;
        name?: string;
        origin_country?: string;
    }[];
    production_countries?: {
        iso_3166_1?: string;
        name?: string;
    }[];
    seasons?: {
        air_date?: string;
        episode_count?: number;
        id?: number;
        name?: string;
        overview?: string;
        poster_path?: string;
        season_number?: number;
        vote_average?: number;
    }[];
    spoken_languages?: {
        english_name?: string;
        iso_639_1?: string;
        name?: string;
    }[];
    status?: string;
    tagline?: string;
    type?: string;
    vote_average?: number;
    vote_count?: number;
}

export interface TmdbTvSeasonDetails {
    _id?: string;
    air_date?: string;
    episodes?: {
        air_date?: string;
        episode_number?: number;
        id?: number;
        name?: string;
        overview?: string;
        production_code?: string;
        runtime?: number;
        season_number?: number;
        show_id?: number;
        still_path?: string;
        vote_average?: number;
        vote_count?: number;
        crew?: {
            department?: string;
            job?: string;
            credit_id?: string;
            adult?: boolean;
            gender?: number;
            id?: number;
            known_for_department?: string;
            name?: string;
            original_name?: string;
            popularity?: number;
            profile_path?: string;
        }[];
        guest_stars?: {
            credit_id?: string;
            order?: number;
            character?: string;
            adult?: boolean;
            gender?: number;
            id?: number;
            known_for_department?: string;
            name?: string;
            original_name?: string;
            popularity?: number;
            profile_path?: string;
        }[];
    }[];
    id?: number;
    name?: string;
    overview?: string;
    poster_path?: string;
    season_number?: number;
    vote_average?: number;
}

export interface TmdbTvEpisodeDetails {
    air_date?: string;
    crew?: {
        department?: string;
        job?: string;
        credit_id?: string;
        adult?: boolean;
        gender?: number;
        id?: number;
        known_for_department?: string;
        name?: string;
        original_name?: string;
        popularity?: number;
        profile_path?: string;
    }[];
    episode_number?: number;
    guest_stars?: {
        credit_id?: string;
        order?: number;
        character?: string;
        adult?: boolean;
        gender?: number;
        id?: number;
        known_for_department?: string;
        name?: string;
        original_name?: string;
        popularity?: number;
        profile_path?: string;
    }[];
    id?: number;
    name?: string;
    overview?: string;
    production_code?: string;
    runtime?: number;
    season_number?: number;
    still_path?: string;
    vote_average?: number;
    vote_count?: number;
}

export interface TmdbPersonDetails {
    adult?: boolean;
    also_known_as?: string[];
    biography?: string;
    birthday?: string;
    deathday?: string;
    gender?: number;
    homepage?: string;
    id?: number;
    imdb_id?: string;
    known_for_department?: string;
    name?: string;
    place_of_birth?: string;
    popularity?: number;
    profile_path?: string;
    external_ids?: {
        freebase_mid?: string;
        freebase_id?: string;
        imdb_id?: string;
        tvrage_id?: number;
        wikidata_id?: string;
        facebook_id?: string;
        instagram_id?: string;
        tiktok_id?: string;
        twitter_id?: string;
        youtube_id?: string;
    };
    images?: {
        profiles?: Array<{
            aspect_ratio?: number;
            height?: number;
            iso_639_1?: string;
            file_path?: string;
            vote_average?: number;
            vote_count?: number;
            width?: number;
        }>;
    };
}

export interface TmdbCollectionDetails {
    id?: number;
    name?: string;
    overview?: string;
    poster_path?: string;
    backdrop_path?: string;
    parts?: {
        adult?: boolean;
        backdrop_path?: string;
        id?: number;
        title?: string;
        original_language?: string;
        original_title?: string;
        overview?: string;
        poster_path?: string;
        media_type?: string;
        genre_ids?: number[];
        popularity?: number;
        release_date?: string;
        video?: boolean;
        vote_average?: number;
        vote_count?: number;
    }[];
}

export interface TmdbKeywordDetails {
    id?: number;
    name?: string;
}

export interface TmdbNetworkDetails {
    headquarters?: string;
    homepage?: string;
    id?: number;
    logo_path?: string;
    name?: string;
    origin_country?: string;
}

export interface TmdbCompanyDetails {
    description?: string;
    headquarters?: string;
    homepage?: string;
    id?: number;
    logo_path?: string;
    name?: string;
    origin_country?: string;
    parent_company?: {
        id?: number;
        name?: string;
        logo_path?: string;
    };
}

// Credits types
export interface TmdbCastMember {
    adult?: boolean;
    gender?: number;
    id?: number;
    known_for_department?: string;
    name?: string;
    original_name?: string;
    popularity?: number;
    profile_path?: string;
    cast_id?: number;
    character?: string;
    credit_id?: string;
    order?: number;
}

export interface TmdbCrewMember {
    adult?: boolean;
    gender?: number;
    id?: number;
    known_for_department?: string;
    name?: string;
    original_name?: string;
    popularity?: number;
    profile_path?: string;
    credit_id?: string;
    department?: string;
    job?: string;
}

export interface TmdbCredits {
    cast?: TmdbCastMember[];
    crew?: TmdbCrewMember[];
}

// Person credits types
export interface TmdbPersonCastCredit {
    id?: number;
    character?: string;
    credit_id?: string;
    release_date?: string;
    vote_count?: number;
    video?: boolean;
    adult?: boolean;
    vote_average?: number;
    title?: string;
    genre_ids?: number[];
    original_language?: string;
    original_title?: string;
    popularity?: number;
    backdrop_path?: string;
    overview?: string;
    poster_path?: string;
    order?: number;
    media_type?: string;
    // TV specific fields
    name?: string;
    original_name?: string;
    first_air_date?: string;
    episode_count?: number;
}

export interface TmdbPersonCrewCredit {
    id?: number;
    department?: string;
    job?: string;
    credit_id?: string;
    adult?: boolean;
    backdrop_path?: string;
    genre_ids?: number[];
    original_language?: string;
    original_title?: string;
    overview?: string;
    popularity?: number;
    poster_path?: string;
    release_date?: string;
    title?: string;
    video?: boolean;
    vote_average?: number;
    vote_count?: number;
    media_type?: string;
    // TV specific fields
    name?: string;
    original_name?: string;
    first_air_date?: string;
    episode_count?: number;
}

export interface TmdbPersonCredits {
    cast?: TmdbPersonCastCredit[];
    crew?: TmdbPersonCrewCredit[];
}