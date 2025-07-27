 
/* tslint:disable */


// Person-related types extracted from TMDB API

export interface PersonDetailsParams {
  personId: number;
  /** comma separated list of endpoints within this namespace, 20 items max */
  append_to_response?: string;
  /** @default "en-US" */
  language?: string;
}

export interface PersonDetailsData {
  /**
   * @default true
   * @example false
   */
  adult?: boolean;
  also_known_as?: string[];
  /**
   * @example "Thomas Jeffrey Hanks (born July 9, 1956) is an American actor and filmmaker..."
   */
  biography?: string;
  /** @example "1956-07-09" */
  birthday?: string;
  deathday?: string;
  /**
   * @default 0
   * @example 2
   */
  gender?: number;
  homepage?: string;
  /**
   * @default 0
   * @example 31
   */
  id?: number;
  /** @example "nm0000158" */
  imdb_id?: string;
  /** @example "Acting" */
  known_for_department?: string;
  /** @example "Tom Hanks" */
  name?: string;
  /** @example "Concord, California, USA" */
  place_of_birth?: string;
  /**
   * @default 0
   * @example 82.989
   */
  popularity?: number;
  /** @example "/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg" */
  profile_path?: string;
}

export interface PersonMovieCreditsParams {
  personId: number;
  /** @default "en-US" */
  language?: string;
}

export interface PersonMovieCreditsData {
  /**
   * @default 0
   * @example 31
   */
  id?: number;
  cast?: {
    /**
     * @default true
     * @example false
     */
    adult?: boolean;
    /** @example "/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg" */
    backdrop_path?: string;
    genre_ids?: number[];
    /**
     * @default 0
     * @example 13
     */
    id?: number;
    /** @example "en" */
    original_language?: string;
    /** @example "Forrest Gump" */
    original_title?: string;
    /** @example "A man with a low IQ has accomplished great things in his life..." */
    overview?: string;
    /**
     * @default 0
     * @example 67.209
     */
    popularity?: number;
    /** @example "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg" */
    poster_path?: string;
    /** @example "1994-06-23" */
    release_date?: string;
    /** @example "Forrest Gump" */
    title?: string;
    /**
     * @default true
     * @example false
     */
    video?: boolean;
    /**
     * @default 0
     * @example 8.481
     */
    vote_average?: number;
    /**
     * @default 0
     * @example 24525
     */
    vote_count?: number;
    /** @example "Forrest Gump" */
    character?: string;
    /** @example "52fe420dc3a36847f800b131" */
    credit_id?: string;
    /**
     * @default 0
     * @example 0
     */
    order?: number;
  }[];
  crew?: {
    /**
     * @default true
     * @example false
     */
    adult?: boolean;
    /** @example "/vdpE5kqUyFJJoD9eNTp9Lsv0nEc.jpg" */
    backdrop_path?: string;
    genre_ids?: number[];
    /**
     * @default 0
     * @example 862
     */
    id?: number;
    /** @example "en" */
    original_language?: string;
    /** @example "Toy Story" */
    original_title?: string;
    /** @example "Led by Woody, Andy's toys live happily in his room until Andy's birthday brings Buzz Lightyear onto the scene..." */
    overview?: string;
    /**
     * @default 0
     * @example 52.024
     */
    popularity?: number;
    /** @example "/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg" */
    poster_path?: string;
    /** @example "1995-10-30" */
    release_date?: string;
    /** @example "Toy Story" */
    title?: string;
    /**
     * @default true
     * @example false
     */
    video?: boolean;
    /**
     * @default 0
     * @example 7.988
     */
    vote_average?: number;
    /**
     * @default 0
     * @example 17324
     */
    vote_count?: number;
    /** @example "52fe44959251416c750ac9c3" */
    credit_id?: string;
    /** @example "Production" */
    department?: string;
    /** @example "Executive Producer" */
    job?: string;
  }[];
}

export interface PersonTvCreditsParams {
  personId: number;
  /** @default "en-US" */
  language?: string;
}

export interface PersonTvCreditsData {
  /**
   * @default 0
   * @example 31
   */
  id?: number;
  cast?: {
    /**
     * @default true
     * @example false
     */
    adult?: boolean;
    /** @example "/bsNm9z2TJfe0WO3RedPGWQ8mG1X.jpg" */
    backdrop_path?: string;
    genre_ids?: number[];
    /**
     * @default 0
     * @example 1396
     */
    id?: number;
    origin_country?: string[];
    /** @example "en" */
    original_language?: string;
    /** @example "Breaking Bad" */
    original_name?: string;
    /** @example "When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer..." */
    overview?: string;
    /**
     * @default 0
     * @example 298.884
     */
    popularity?: number;
    /** @example "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg" */
    poster_path?: string;
    /** @example "2008-01-20" */
    first_air_date?: string;
    /** @example "Breaking Bad" */
    name?: string;
    /**
     * @default 0
     * @example 8.879
     */
    vote_average?: number;
    /**
     * @default 0
     * @example 11536
     */
    vote_count?: number;
    /** @example "Walter White" */
    character?: string;
    /** @example "52542282760ee313280017f9" */
    credit_id?: string;
    /**
     * @default 0
     * @example 62
     */
    episode_count?: number;
  }[];
  crew?: {
    /**
     * @default true
     * @example false
     */
    adult?: boolean;
    /** @example "/bsNm9z2TJfe0WO3RedPGWQ8mG1X.jpg" */
    backdrop_path?: string;
    genre_ids?: number[];
    /**
     * @default 0
     * @example 1396
     */
    id?: number;
    origin_country?: string[];
    /** @example "en" */
    original_language?: string;
    /** @example "Breaking Bad" */
    original_name?: string;
    /** @example "When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer..." */
    overview?: string;
    /**
     * @default 0
     * @example 298.884
     */
    popularity?: number;
    /** @example "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg" */
    poster_path?: string;
    /** @example "2008-01-20" */
    first_air_date?: string;
    /** @example "Breaking Bad" */
    name?: string;
    /**
     * @default 0
     * @example 8.879
     */
    vote_average?: number;
    /**
     * @default 0
     * @example 11536
     */
    vote_count?: number;
    /** @example "52542272760ee31328001af1" */
    credit_id?: string;
    /** @example "Production" */
    department?: string;
    /**
     * @default 0
     * @example 62
     */
    episode_count?: number;
    /** @example "Executive Producer" */
    job?: string;
  }[];
}

// Type aliases for backward compatibility
export type TmdbPersonDetails = PersonDetailsData;