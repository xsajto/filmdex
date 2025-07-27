/* eslint-disable */
/* tslint:disable */

// Movie-related types extracted from generated TMDB API types


export interface MovieDetailsParams {
  movieId: number;
  /** comma separated list of endpoints within this namespace, 20 items max */
  append_to_response?: string;
  /** @default "en-US" */
  language?: string;
}

export interface MovieDetailsData {
  /**
   * @default true
   * @example false
   */
  adult?: boolean;
  /** @example "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg" */
  backdrop_path?: string;
  belongs_to_collection?: any;
  /**
   * @default 0
   * @example 63000000
   */
  budget?: number;
  genres?: {
    /**
     * @default 0
     * @example 18
     */
    id?: number;
    /** @example "Drama" */
    name?: string;
  }[];
  /** @example "http://www.foxmovies.com/movies/fight-club" */
  homepage?: string;
  /**
   * @default 0
   * @example 550
   */
  id?: number;
  /** @example "tt0137523" */
  imdb_id?: string;
  /** @example "en" */
  original_language?: string;
  /** @example "Fight Club" */
  original_title?: string;
  /** @example "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion." */
  overview?: string;
  /**
   * @default 0
   * @example 61.416
   */
  popularity?: number;
  /** @example "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg" */
  poster_path?: string;
  production_companies?: {
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
  }[];
  production_countries?: {
    /** @example "US" */
    iso_3166_1?: string;
    /** @example "United States of America" */
    name?: string;
  }[];
  /** @example "1999-10-15" */
  release_date?: string;
  /**
   * @default 0
   * @example 100853753
   */
  revenue?: number;
  /**
   * @default 0
   * @example 139
   */
  runtime?: number;
  spoken_languages?: {
    /** @example "English" */
    english_name?: string;
    /** @example "en" */
    iso_639_1?: string;
    /** @example "English" */
    name?: string;
  }[];
  /** @example "Released" */
  status?: string;
  /** @example "Mischief. Mayhem. Soap." */
  tagline?: string;
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
   * @example 26280
   */
  vote_count?: number;
}

// Type aliases for backward compatibility
export type TmdbMovieDetails = MovieDetailsData;
