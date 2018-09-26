import { reduce } from 'lodash';
import web3Utils from 'web3-utils';

export default function metricSetHasher(root, rows) {
  const hash = web3Utils.soliditySha3(root);

  return reduce(rows, (_hash, row) => (
    web3Utils.soliditySha3(
      _hash,
      row.campaign_id,
      row.channel_id,
      row.impressions,
      row.clicks,
      row.conversions,
    )
  ), hash);
}
