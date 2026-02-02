export interface UserGraphModel {
  name: string;
  total: number;
  count: number;
}

export interface ClaimGraphModel {
  consumers: UserGraphModel[];
  business: UserGraphModel[];
  date: UserGraphModel[];
  consumerOnboarder: UserGraphModel[];
  businessOnboarder: UserGraphModel[];
}

export interface CountryClaimModel {
  country: string;
  total: number;
  count: number;
}
