 
/* tslint:disable */


// Image-related types extracted from TMDB API

import { Image } from './common.types';

export interface MovieImagesParams {
  movieId: number;
  /** specify a comma separated list of ISO-639-1 values to query, for example: `en,null` */
  include_image_language?: string;
  language?: string;
}

export interface MovieImagesData {
  backdrops?: Image[];
  /**
   * @default 0
   * @example 550
   */
  id?: number;
  logos?: Image[];
  posters?: Image[];
}

export interface TvSeriesImagesParams {
  seriesId: number;
  /** specify a comma separated list of ISO-639-1 values to query, for example: `en,null` */
  include_image_language?: string;
  language?: string;
}

export interface TvSeriesImagesData {
  backdrops?: Image[];
  /**
   * @default 0
   * @example 550
   */
  id?: number;
  logos?: Image[];
  posters?: Image[];
}

export interface TvSeasonImagesParams {
  seriesId: number;
  seasonNumber: number;
  /** specify a comma separated list of ISO-639-1 values to query, for example: `en,null` */
  include_image_language?: string;
  language?: string;
}

export interface TvSeasonImagesData {
  /**
   * @default 0
   * @example 3624
   */
  id?: number;
  posters?: Image[];
}

export interface TvEpisodeImagesParams {
  seriesId: number;
  seasonNumber: number;
  episodeNumber: number;
  /** specify a comma separated list of ISO-639-1 values to query, for example: `en,null` */
  include_image_language?: string;
  language?: string;
}

export interface TvEpisodeImagesData {
  /**
   * @default 0
   * @example 63056
   */
  id?: number;
  stills?: Image[];
}