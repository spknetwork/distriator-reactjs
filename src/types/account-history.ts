export interface AccountHistoryModel {
  id: number;
  trx_id: string;
  block: number;
  trx_in_block: number;
  op_in_trx: number;
  virtual_op: number;
  timestamp: string;
  op: [string, any];
}

export interface PostDetailModel {
  post_id: number;
  author: string;
  permlink: string;
  category: string;
  title: string;
  body: string;
  json_metadata: string;
  created: string;
  updated: string;
  depth: number;
  children: number;
  net_rshares: number;
  is_paidout: boolean;
  payout_at: string;
  payout: number;
  pending_payout_value: string;
  author_payout_value: string;
  curator_payout_value: string;
  promoted: string;
  replies: any[];
  author_reputation: number;
  stats: {
    hide: boolean;
    gray: boolean;
    total_votes: number;
    flag_weight: number;
  };
  url: string;
  beneficiaries: any[];
  max_accepted_payout: string;
  percent_hbd: number;
  active_votes: any[];
  blacklists: any[];
}

export function createAccountHistoryModel(json: any): AccountHistoryModel {
  return {
    id: json[0],
    trx_id: json[1].trx_id,
    block: json[1].block,
    trx_in_block: json[1].trx_in_block,
    op_in_trx: json[1].op_in_trx,
    virtual_op: json[1].virtual_op,
    timestamp: json[1].timestamp,
    op: json[1].op,
  };
}

export function createPostDetailModel(json: any): PostDetailModel {
  return {
    post_id: json.post_id,
    author: json.author,
    permlink: json.permlink,
    category: json.category,
    title: json.title,
    body: json.body,
    json_metadata: json.json_metadata,
    created: json.created,
    updated: json.updated,
    depth: json.depth,
    children: json.children,
    net_rshares: json.net_rshares,
    is_paidout: json.is_paidout,
    payout_at: json.payout_at,
    payout: json.payout,
    pending_payout_value: json.pending_payout_value,
    author_payout_value: json.author_payout_value,
    curator_payout_value: json.curator_payout_value,
    promoted: json.promoted,
    replies: json.replies,
    author_reputation: json.author_reputation,
    stats: json.stats,
    url: json.url,
    beneficiaries: json.beneficiaries,
    max_accepted_payout: json.max_accepted_payout,
    percent_hbd: json.percent_hbd,
    active_votes: json.active_votes,
    blacklists: json.blacklists,
  };
}