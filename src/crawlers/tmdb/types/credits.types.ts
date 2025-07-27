 
/* tslint:disable */


// Credits-related types extracted from TMDB API

export interface CastMember {
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
   * @example 819
   */
  id?: number;
  /** @example "Acting" */
  known_for_department?: string;
  /** @example "Edward Norton" */
  name?: string;
  /** @example "Edward Norton" */
  original_name?: string;
  /**
   * @default 0
   * @example 26.99
   */
  popularity?: number;
  /** @example "/8nytsqL59SFJTVYVrN72k6qkGgJ.jpg" */
  profile_path?: string;
  /**
   * @default 0
   * @example 4
   */
  cast_id?: number;
  /** @example "The Narrator" */
  character?: string;
  /** @example "52fe4250c3a36847f80149f3" */
  credit_id?: string;
  /**
   * @default 0
   * @example 0
   */
  order?: number;
}

export interface CrewMember {
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
   * @example 376
   */
  id?: number;
  /** @example "Production" */
  known_for_department?: string;
  /** @example "Arnon Milchan" */
  name?: string;
  /** @example "Arnon Milchan" */
  original_name?: string;
  /**
   * @default 0
   * @example 17.944
   */
  popularity?: number;
  /** @example "/b2hBExX4NnczNAnLuTBF4kmNhZm.jpg" */
  profile_path?: string;
  /** @example "52fe4250c3a36847f8014a05" */
  credit_id?: string;
  /** @example "Production" */
  department?: string;
  /** @example "Producer" */
  job?: string;
}

export interface MovieCreditsParams {
  movieId: number;
  /** @default "en-US" */
  language?: string;
}

export interface MovieCreditsData {
  /**
   * @default 0
   * @example 550
   */
  id?: number;
  cast?: CastMember[];
  crew?: CrewMember[];
}

export interface TvSeriesCreditsParams {
  seriesId: number;
  /** @default "en-US" */
  language?: string;
}

export interface TvSeriesCreditsData {
  /**
   * @default 0
   * @example 1399
   */
  id?: number;
  cast?: CastMember[];
  crew?: CrewMember[];
}

export interface TvSeasonCreditsParams {
  seriesId: number;
  seasonNumber: number;
  /** @default "en-US" */
  language?: string;
}

export interface TvSeasonCreditsData {
  /**
   * @default 0
   * @example 3624
   */
  id?: number;
  cast?: CastMember[];
  crew?: CrewMember[];
}

export interface TvEpisodeCreditsParams {
  seriesId: number;
  seasonNumber: number;
  episodeNumber: number;
  /** @default "en-US" */
  language?: string;
}

export interface TvEpisodeCreditsData {
  /**
   * @default 0
   * @example 63056
   */
  id?: number;
  cast?: CastMember[];
  crew?: CrewMember[];
  guest_stars?: CastMember[];
}

// Type aliases for backward compatibility
export type TmdbCredits = MovieCreditsData | TvSeriesCreditsData;