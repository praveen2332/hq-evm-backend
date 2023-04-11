import { ApiProperty } from '@nestjs/swagger'

export class SimplePriceParams {
  @ApiProperty()
  ids: string

  @ApiProperty()
  vs_currencies: string
}

export class CoinHistoryParams {
  @ApiProperty()
  id: string

  @ApiProperty()
  date: string
}

export interface MarketChartResponse {
  prices: [number, number][]
}

export interface HistoricalPriceResponse {
  id: string
  symbol: string
  name: string
  localization: { [key: string]: string }
  image: {
    thumb: string
    small: string
  }
  market_data: {
    current_price: { [key: string]: number }
    market_cap: { [key: string]: number }
    total_volume: { [key: string]: number }
  }
  community_data: {
    facebook_likes: unknown
    twitter_followers: number
    reddit_average_posts_48h: number
    reddit_average_comments_48h: number
    reddit_subscribers: number
    reddit_accounts_active_48h: string
  }
  developer_data: {
    forks: unknown
    stars: unknown
    subscribers: unknown
    total_issues: unknown
    closed_issues: unknown
    pull_requests_merged: number
    pull_request_contributors: number
    code_additions_deletions_4_weeks: {
      additions: unknown
      deletions: unknown
    }
    commit_count_4_weeks: number
  }
  public_interest_stats: {
    alexa_rank: unknown
    bing_matches: unknown
  }
}

export interface CoinInfoResponse {
  id: string
  symbol: string
  name: string
  detail_platforms: {
    [key: string]: {
      decimal_place: number
      contract_address: string
    }
  }
  image: {
    thumb: string
    small: string
    large: string
  }
}
