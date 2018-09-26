import sha256 from 'js-sha256';

const rows = [];

// keep first one different from others
rows.push([
  {
    campaign_id: sha256.hex('different-campaign1').substring(0, 32),
    channel_id: sha256.hex('different-channel1').substring(0, 32),
    impressions: 10,
    clicks: 333,
    conversions: 5000,
  },
  {
    campaign_id: sha256.hex('campaign2').substring(0, 32),
    channel_id: sha256.hex('channel2').substring(0, 32),
    impressions: 100,
    clicks: 300,
    conversions: 500,
  },
]);

rows.push([
  {
    campaign_id: sha256.hex('campaign1').substring(0, 32),
    channel_id: sha256.hex('channel1').substring(0, 32),
    impressions: 100,
    clicks: 300,
    conversions: 500,
  },
  {
    campaign_id: sha256.hex('campaign2').substring(0, 32),
    channel_id: sha256.hex('channel2').substring(0, 32),
    impressions: 100,
    clicks: 300,
    conversions: 500,
  },
]);

for (let i = 0; i < 200; i += 1) {
  rows.push(rows[1]);
}

export default rows;
