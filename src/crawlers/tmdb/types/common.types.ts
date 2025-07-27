 
/* tslint:disable */


// Common types used across TMDB API

export interface Genre {
  /**
   * @default 0
   * @example 18
   */
  id?: number;
  /** @example "Drama" */
  name?: string;
}

export interface ProductionCompany {
  /**
   * @default 0
   * @example 508
   */
  id?: number;
  /** @example "/7cxRWzi4LsVm4Utfpr1hfARNurT.png" */
  logo_path?: string;
  /** @example "Regency Enterprises" */
  name?: string;
  /** @example "US" */
  origin_country?: string;
}

export interface ProductionCountry {
  /** @example "US" */
  iso_3166_1?: string;
  /** @example "United States of America" */
  name?: string;
}

export interface SpokenLanguage {
  /** @example "English" */
  english_name?: string;
  /** @example "en" */
  iso_639_1?: string;
  /** @example "English" */
  name?: string;
}

export interface Network {
  /**
   * @default 0
   * @example 49
   */
  id?: number;
  /** @example "/tuomPhY2UtuPTqqFnKMVHvSb724.png" */
  logo_path?: string;
  /** @example "HBO" */
  name?: string;
  /** @example "US" */
  origin_country?: string;
}

export interface Video {
  /** @example "en" */
  iso_639_1?: string;
  /** @example "US" */
  iso_3166_1?: string;
  /** @example "Official Trailer" */
  name?: string;
  /** @example "dQw4w9WgXcQ" */
  key?: string;
  /** @example "YouTube" */
  site?: string;
  /**
   * @default 0
   * @example 1080
   */
  size?: number;
  /** @example "Trailer" */
  type?: string;
  /** @default false */
  official?: boolean;
  /** @example "2023-01-01T00:00:00.000Z" */
  published_at?: string;
  /** @example "507f1f77bcf86cd799439011" */
  id?: string;
}

export interface Image {
  /**
   * @default 0
   * @example 1.778
   */
  aspect_ratio?: number;
  /**
   * @default 0
   * @example 800
   */
  height?: number;
  /** @example "en" */
  iso_639_1?: string;
  /** @example "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg" */
  file_path?: string;
  /**
   * @default 0
   * @example 5.622
   */
  vote_average?: number;
  /**
   * @default 0
   * @example 20
   */
  vote_count?: number;
  /**
   * @default 0
   * @example 1422
   */
  width?: number;
}

export interface ExternalIds {
  /** @example "tt0137523" */
  imdb_id?: string;
  /** @example "facebook_id" */
  facebook_id?: string;
  /** @example "instagram_id" */
  instagram_id?: string;
  /** @example "twitter_id" */
  twitter_id?: string;
  /** @example "12345" */
  tvdb_id?: number;
  /** @example "12345" */
  freebase_mid?: string;
  /** @example "12345" */
  freebase_id?: string;
  /** @example "12345" */
  tvrage_id?: number;
  /** @example "12345" */
  wikidata_id?: string;
}

export interface Keyword {
  /**
   * @default 0
   * @example 1234
   */
  id?: number;
  /** @example "boxing" */
  name?: string;
}

export interface Review {
  /** @example "author_name" */
  author?: string;
  author_details?: {
    /** @example "author_name" */
    name?: string;
    /** @example "username" */
    username?: string;
    /** @example "/avatar.jpg" */
    avatar_path?: string;
    /**
     * @default 0
     * @example 8.5
     */
    rating?: number;
  };
  /** @example "Great movie!" */
  content?: string;
  /** @example "2023-01-01T00:00:00.000Z" */
  created_at?: string;
  /** @example "507f1f77bcf86cd799439011" */
  id?: string;
  /** @example "2023-01-01T00:00:00.000Z" */
  updated_at?: string;
  /** @example "https://example.com/review" */
  url?: string;
}

export interface PaginatedResponse<T> {
  /**
   * @default 0
   * @example 1
   */
  page?: number;
  results?: T[];
  /**
   * @default 0
   * @example 100
   */
  total_pages?: number;
  /**
   * @default 0
   * @example 2000
   */
  total_results?: number;
}