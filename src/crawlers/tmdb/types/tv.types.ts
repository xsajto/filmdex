/* eslint-disable */
/* tslint:disable */


// TV Series-related types extracted from generated TMDB API types

export interface TvSeriesDetailsParams {
  seriesId: number;
  /** comma separated list of endpoints within this namespace, 20 items max */
  append_to_response?: string;
  /** @default "en-US" */
  language?: string;
}

export interface TvSeriesDetailsData {
  /**
   * @default true
   * @example false
   */
  adult?: boolean;
  /** @example "/6LWy0jvMpmjoS9fojNgHIKoWL05.jpg" */
  backdrop_path?: string;
  created_by?: {
    /**
     * @default 0
     * @example 9813
     */
    id?: number;
    /** @example "5256c8c219c2956ff604858a" */
    credit_id?: string;
    /** @example "David Benioff" */
    name?: string;
    /**
     * @default 0
     * @example 2
     */
    gender?: number;
    /** @example "/xvNN5huL0X8yJ7h3IZfGG4O2zBD.jpg" */
    profile_path?: string;
  }[];
  episode_run_time?: number[];
  /** @example "2011-04-17" */
  first_air_date?: string;
  genres?: {
    /**
     * @default 0
     * @example 10765
     */
    id?: number;
    /** @example "Sci-Fi & Fantasy" */
    name?: string;
  }[];
  /** @example "http://www.hbo.com/game-of-thrones" */
  homepage?: string;
  /**
   * @default 0
   * @example 1399
   */
  id?: number;
  /**
   * @default true
   * @example false
   */
  in_production?: boolean;
  languages?: string[];
  /** @example "2019-05-19" */
  last_air_date?: string;
  last_episode_to_air?: {
    /**
     * @default 0
     * @example 1551830
     */
    id?: number;
    /** @example "The Iron Throne" */
    name?: string;
    /** @example "In the aftermath of the devastating attack on King's Landing, Daenerys must face the survivors." */
    overview?: string;
    /**
     * @default 0
     * @example 4.809
     */
    vote_average?: number;
    /**
     * @default 0
     * @example 241
     */
    vote_count?: number;
    /** @example "2019-05-19" */
    air_date?: string;
    /**
     * @default 0
     * @example 6
     */
    episode_number?: number;
    /** @example "806" */
    production_code?: string;
    /**
     * @default 0
     * @example 80
     */
    runtime?: number;
    /**
     * @default 0
     * @example 8
     */
    season_number?: number;
    /**
     * @default 0
     * @example 1399
     */
    show_id?: number;
    /** @example "/zBi2O5EJfgTS6Ae0HdAYLm9o2nf.jpg" */
    still_path?: string;
  };
  /** @example "Game of Thrones" */
  name?: string;
  next_episode_to_air?: any;
  networks?: {
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
  }[];
  /**
   * @default 0
   * @example 73
   */
  number_of_episodes?: number;
  /**
   * @default 0
   * @example 8
   */
  number_of_seasons?: number;
  origin_country?: string[];
  /** @example "en" */
  original_language?: string;
  /** @example "Game of Thrones" */
  original_name?: string;
  /** @example "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north. Amidst the war, a neglected military order of misfits, the Night's Watch, is all that stands between the realms of men and icy horrors beyond." */
  overview?: string;
  /**
   * @default 0
   * @example 346.098
   */
  popularity?: number;
  /** @example "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg" */
  poster_path?: string;
  production_companies?: {
    /**
     * @default 0
     * @example 76043
     */
    id?: number;
    /** @example "/9RO2vbQ67otPrBLXCaC8UMp3Qat.png" */
    logo_path?: string;
    /** @example "Revolution Sun Studios" */
    name?: string;
    /** @example "US" */
    origin_country?: string;
  }[];
  production_countries?: {
    /** @example "GB" */
    iso_3166_1?: string;
    /** @example "United Kingdom" */
    name?: string;
  }[];
  seasons?: {
    /** @example "2010-12-05" */
    air_date?: string;
    /**
     * @default 0
     * @example 272
     */
    episode_count?: number;
    /**
     * @default 0
     * @example 3627
     */
    id?: number;
    /** @example "Specials" */
    name?: string;
    /** @example "" */
    overview?: string;
    /** @example "/kMTcwNRfFKCZ0O2OaBZS0nZ2AIe.jpg" */
    poster_path?: string;
    /**
     * @default 0
     * @example 0
     */
    season_number?: number;
    /**
     * @default 0
     * @example 0
     */
    vote_average?: number;
  }[];
  spoken_languages?: {
    /** @example "English" */
    english_name?: string;
    /** @example "en" */
    iso_639_1?: string;
    /** @example "English" */
    name?: string;
  }[];
  /** @example "Ended" */
  status?: string;
  /** @example "Winter Is Coming" */
  tagline?: string;
  /** @example "Scripted" */
  type?: string;
  /**
   * @default 0
   * @example 8.438
   */
  vote_average?: number;
  /**
   * @default 0
   * @example 21390
   */
  vote_count?: number;
}

export interface TvSeasonDetailsParams {
  seriesId: number;
  seasonNumber: number;
  /** comma separated list of endpoints within this namespace, 20 items max */
  append_to_response?: string;
  /** @default "en-US" */
  language?: string;
}

export interface TvSeasonDetailsData {
  /** @example "5256c89f19c2956ff6046d47" */
  _id?: string;
  /** @example "2011-04-17" */
  air_date?: string;
  episodes?: {
    /** @example "2011-04-17" */
    air_date?: string;
    /**
     * @default 0
     * @example 1
     */
    episode_number?: number;
    /**
     * @default 0
     * @example 63056
     */
    id?: number;
    /** @example "Winter Is Coming" */
    name?: string;
    /** @example "Jon Arryn, the Hand of the King, is dead. King Robert Baratheon plans to ask his oldest friend, Eddard Stark, to take Jon's place. Across the sea, Viserys Targaryen plans to wed his sister to a nomadic warlord in exchange for an army." */
    overview?: string;
    /** @example "101" */
    production_code?: string;
    /**
     * @default 0
     * @example 62
     */
    runtime?: number;
    /**
     * @default 0
     * @example 1
     */
    season_number?: number;
    /**
     * @default 0
     * @example 1399
     */
    show_id?: number;
    /** @example "/9hGF3WUkBf7cSjMg0cdMDHJkByd.jpg" */
    still_path?: string;
    /**
     * @default 0
     * @example 7.838
     */
    vote_average?: number;
    /**
     * @default 0
     * @example 291
     */
    vote_count?: number;
    crew?: {
      /** @example "Directing" */
      department?: string;
      /** @example "Director" */
      job?: string;
      /** @example "5256c8a219c2956ff6046e77" */
      credit_id?: string;
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
       * @example 44797
       */
      id?: number;
      /** @example "Directing" */
      known_for_department?: string;
      /** @example "Timothy Van Patten" */
      name?: string;
      /** @example "Timothy Van Patten" */
      original_name?: string;
      /**
       * @default 0
       * @example 6.048
       */
      popularity?: number;
      /** @example "/MzSOFrd99HRdr6pkSRSctk3kBR.jpg" */
      profile_path?: string;
    }[];
    guest_stars?: {
      /** @example "Benjen Stark" */
      character?: string;
      /** @example "5256c8b919c2956ff604836a" */
      credit_id?: string;
      /**
       * @default 0
       * @example 62
       */
      order?: number;
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
       * @example 119783
       */
      id?: number;
      /** @example "Acting" */
      known_for_department?: string;
      /** @example "Joseph Mawle" */
      name?: string;
      /** @example "Joseph Mawle" */
      original_name?: string;
      /**
       * @default 0
       * @example 13.517
       */
      popularity?: number;
      /** @example "/1Ocb9v3h54beGVoJMm4w50UQhLf.jpg" */
      profile_path?: string;
    }[];
  }[];
  /** @example "Season 1" */
  name?: string;
  /** @example "Trouble is brewing in the Seven Kingdoms of Westeros. For the driven inhabitants of this visionary world, control of Westeros' Iron Throne holds the lure of great power. But in a land where the seasons can last a lifetime, winter is coming...and beyond the Great Wall that protects them, an ancient evil has returned. In Season One, the story centers on three primary areas: the Stark and the Lannister families, whose designs on controlling the throne threaten a tenuous peace; the dragon princess Daenerys, heir to the former dynasty, who waits just over the Narrow Sea with her malevolent brother Viserys; and the Great Wall--a massive barrier of ice where a forgotten danger is stirring." */
  overview?: string;
  /**
   * @default 0
   * @example 3624
   */
  id?: number;
  /** @example "/wgfKiqzuMrFIkU1M68DDDY8kGC1.jpg" */
  poster_path?: string;
  /**
   * @default 0
   * @example 1
   */
  season_number?: number;
  /**
   * @default 0
   * @example 8.3
   */
  vote_average?: number;
}

// Episode details data (simplified - extend as needed)
export interface TvEpisodeDetailsData {
  /** @example "2011-04-17" */
  air_date?: string;
  /**
   * @default 0
   * @example 1
   */
  episode_number?: number;
  /**
   * @default 0
   * @example 63056
   */
  id?: number;
  /** @example "Winter Is Coming" */
  name?: string;
  /** @example "Jon Arryn, the Hand of the King, is dead..." */
  overview?: string;
  /** @example "101" */
  production_code?: string;
  /**
   * @default 0
   * @example 62
   */
  runtime?: number;
  /**
   * @default 0
   * @example 1
   */
  season_number?: number;
  /**
   * @default 0
   * @example 1399
   */
  show_id?: number;
  /** @example "/9hGF3WUkBf7cSjMg0cdMDHJkByd.jpg" */
  still_path?: string;
  /**
   * @default 0
   * @example 7.8
   */
  vote_average?: number;
  /**
   * @default 0
   * @example 286
   */
  vote_count?: number;
}

// Type aliases for backward compatibility
export type TmdbTvSeriesDetails = TvSeriesDetailsData;
export type TmdbTvSeasonDetails = TvSeasonDetailsData;
export type TmdbTvEpisodeDetails = TvEpisodeDetailsData;