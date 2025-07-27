 
/* tslint:disable */


// Metadata-related types (videos, keywords, external IDs, etc.)

import { Video, Keyword, ExternalIds, Review, PaginatedResponse } from './common.types';

// Videos
export interface MovieVideosParams {
  movieId: number;
  /** @default "en-US" */
  language?: string;
}

export interface MovieVideosData {
  /**
   * @default 0
   * @example 550
   */
  id?: number;
  results?: Video[];
}

export interface TvSeriesVideosParams {
  seriesId: number;
  /** @default "en-US" */
  language?: string;
}

export interface TvSeriesVideosData {
  /**
   * @default 0
   * @example 1399
   */
  id?: number;
  results?: Video[];
}

// Keywords
export interface MovieKeywordsParams {
  movieId: number;
}

export interface MovieKeywordsData {
  /**
   * @default 0
   * @example 550
   */
  id?: number;
  keywords?: Keyword[];
}

export interface TvSeriesKeywordsParams {
  seriesId: number;
}

export interface TvSeriesKeywordsData {
  /**
   * @default 0
   * @example 1399
   */
  id?: number;
  results?: Keyword[];
}

// External IDs
export interface MovieExternalIdsParams {
  movieId: number;
}

export interface MovieExternalIdsData extends ExternalIds {
  /**
   * @default 0
   * @example 550
   */
  id?: number;
}

export interface TvSeriesExternalIdsParams {
  seriesId: number;
}

export interface TvSeriesExternalIdsData extends ExternalIds {
  /**
   * @default 0
   * @example 1399
   */
  id?: number;
}

export interface PersonExternalIdsParams {
  personId: number;
}

export interface PersonExternalIdsData extends ExternalIds {
  /**
   * @default 0
   * @example 31
   */
  id?: number;
}

// Reviews
export interface MovieReviewsParams {
  movieId: number;
  /** @default "en-US" */
  language?: string;
  /**
   * @format int32
   * @default 1
   */
  page?: number;
}

export interface MovieReviewsData extends PaginatedResponse<Review> {
  /**
   * @default 0
   * @example 550
   */
  id?: number;
}

export interface TvSeriesReviewsParams {
  seriesId: number;
  /** @default "en-US" */
  language?: string;
  /**
   * @format int32
   * @default 1
   */
  page?: number;
}

export interface TvSeriesReviewsData extends PaginatedResponse<Review> {
  /**
   * @default 0
   * @example 1399
   */
  id?: number;
}

// Alternative Titles
export interface AlternativeTitle {
  /** @example "US" */
  iso_3166_1?: string;
  /** @example "Fight Club" */
  title?: string;
  /** @example "original" */
  type?: string;
}

export interface MovieAlternativeTitlesParams {
  movieId: number;
}

export interface MovieAlternativeTitlesData {
  /**
   * @default 0
   * @example 550
   */
  id?: number;
  titles?: AlternativeTitle[];
}

export interface TvSeriesAlternativeTitlesParams {
  seriesId: number;
}

export interface TvSeriesAlternativeTitlesData {
  /**
   * @default 0
   * @example 1399
   */
  id?: number;
  results?: AlternativeTitle[];
}

// Translations
export interface Translation {
  /** @example "US" */
  iso_3166_1?: string;
  /** @example "en" */
  iso_639_1?: string;
  /** @example "English" */
  name?: string;
  /** @example "English" */
  english_name?: string;
  data?: {
    homepage?: string;
    overview?: string;
    runtime?: number;
    tagline?: string;
    title?: string;
  };
}

export interface MovieTranslationsParams {
  movieId: number;
}

export interface MovieTranslationsData {
  /**
   * @default 0
   * @example 550
   */
  id?: number;
  translations?: Translation[];
}

export interface TvSeriesTranslationsParams {
  seriesId: number;
}

export interface TvSeriesTranslationsData {
  /**
   * @default 0
   * @example 1399
   */
  id?: number;
  translations?: Translation[];
}

// Release Dates
export interface ReleaseDate {
  /** @example "US" */
  iso_3166_1?: string;
  release_dates?: {
    /** @example "1999-10-15" */
    release_date?: string;
    /**
     * @default 0
     * @example 3
     */
    type?: number;
    certification?: string;
    /** @example "en" */
    iso_639_1?: string;
    note?: string;
  }[];
}

export interface MovieReleaseDatesParams {
  movieId: number;
}

export interface MovieReleaseDatesData {
  /**
   * @default 0
   * @example 550
   */
  id?: number;
  results?: ReleaseDate[];
}

// Content Ratings (TV equivalent of release dates)
export interface ContentRating {
  /** @example "US" */
  iso_3166_1?: string;
  /** @example "TV-MA" */
  rating?: string;
}

export interface TvSeriesContentRatingsParams {
  seriesId: number;
}

export interface TvSeriesContentRatingsData {
  /**
   * @default 0
   * @example 1399
   */
  id?: number;
  results?: ContentRating[];
}