 
/* tslint:disable */


// Search-related types extracted from TMDB API

import { PaginatedResponse } from './common.types';

export interface SearchMovieParams {
  query: string;
  /** @default false */
  include_adult?: boolean;
  /** @default "en-US" */
  language?: string;
  primary_release_year?: string;
  /**
   * @format int32
   * @default 1
   */
  page?: number;
  region?: string;
  year?: string;
}

export interface MovieSearchResult {
  /**
   * @default true
   * @example false
   */
  adult?: boolean;
  /** @example "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg" */
  backdrop_path?: string;
  genre_ids?: number[];
  /**
   * @default 0
   * @example 550
   */
  id?: number;
  /** @example "en" */
  original_language?: string;
  /** @example "Fight Club" */
  original_title?: string;
  /** @example "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy." */
  overview?: string;
  /**
   * @default 0
   * @example 73.433
   */
  popularity?: number;
  /** @example "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg" */
  poster_path?: string;
  /** @example "1999-10-15" */
  release_date?: string;
  /** @example "Fight Club" */
  title?: string;
  /**
   * @default true
   * @example false
   */
  video?: boolean;
  /**
   * @default 0
   * @example 8.433
   */
  vote_average?: number;
  /**
   * @default 0
   * @example 26279
   */
  vote_count?: number;
}

export interface SearchTvParams {
  query: string;
  /**
   * Search only the first air date. Valid values are: 1000..9999
   * @format int32
   */
  first_air_date_year?: number;
  /** @default false */
  include_adult?: boolean;
  /** @default "en-US" */
  language?: string;
  /**
   * @format int32
   * @default 1
   */
  page?: number;
  /**
   * Search the first air date and all episode air dates. Valid values are: 1000..9999
   * @format int32
   */
  year?: number;
}

export interface TvSearchResult {
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
}

export interface SearchPersonParams {
  query: string;
  /** @default false */
  include_adult?: boolean;
  /** @default "en-US" */
  language?: string;
  /**
   * @format int32
   * @default 1
   */
  page?: number;
}

export interface PersonSearchResult {
  /**
   * @default true
   * @example false
   */
  adult?: boolean;
  /**
   * @default 0
   * @example 2
   */
  gender?: number;
  /**
   * @default 0
   * @example 31
   */
  id?: number;
  /** @example "Acting" */
  known_for_department?: string;
  /** @example "Tom Hanks" */
  name?: string;
  /** @example "Tom Hanks" */
  original_name?: string;
  /**
   * @default 0
   * @example 84.631
   */
  popularity?: number;
  /** @example "/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg" */
  profile_path?: string;
  known_for?: {
    /**
     * @default true
     * @example false
     */
    adult?: boolean;
    /** @example "/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg" */
    backdrop_path?: string;
    /**
     * @default 0
     * @example 13
     */
    id?: number;
    /** @example "Forrest Gump" */
    title?: string;
    /** @example "en" */
    original_language?: string;
    /** @example "Forrest Gump" */
    original_title?: string;
    /** @example "A man with a low IQ has accomplished great things in his life..." */
    overview?: string;
    /** @example "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg" */
    poster_path?: string;
    /** @example "movie" */
    media_type?: string;
    genre_ids?: number[];
    /**
     * @default 0
     * @example 67.209
     */
    popularity?: number;
    /** @example "1994-06-23" */
    release_date?: string;
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
  }[];
}

export interface SearchMultiParams {
  query: string;
  /** @default false */
  include_adult?: boolean;
  /** @default "en-US" */
  language?: string;
  /**
   * @format int32
   * @default 1
   */
  page?: number;
}

export interface MultiSearchResult {
  /**
   * @default true
   * @example false
   */
  adult?: boolean;
  /** @example "/aDYSnJAK0BTVeE8osOy22Kz3SXY.jpg" */
  backdrop_path?: string;
  /**
   * @default 0
   * @example 11
   */
  id?: number;
  /** @example "Star Wars" */
  title?: string;
  /** @example "en" */
  original_language?: string;
  /** @example "Star Wars" */
  original_title?: string;
  /** @example "Princess Leia is captured and held hostage by the evil Imperial forces..." */
  overview?: string;
  /** @example "/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg" */
  poster_path?: string;
  /** @example "movie" */
  media_type?: string;
  genre_ids?: number[];
  /**
   * @default 0
   * @example 78.047
   */
  popularity?: number;
  /** @example "1977-05-25" */
  release_date?: string;
  /**
   * @default true
   * @example false
   */
  video?: boolean;
  /**
   * @default 0
   * @example 8.208
   */
  vote_average?: number;
  /**
   * @default 0
   * @example 18528
   */
  vote_count?: number;
}

// Response types
export type SearchMovieData = PaginatedResponse<MovieSearchResult>;
export type SearchTvData = PaginatedResponse<TvSearchResult>;
export type SearchPersonData = PaginatedResponse<PersonSearchResult>;
export type SearchMultiData = PaginatedResponse<MultiSearchResult>;