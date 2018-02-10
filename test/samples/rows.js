var sha256 = require('js-sha256');

var rows = [
  {
    "campaign_id": sha256.hex("campaign1").substring(0, 32),
    "channel_id": sha256.hex("channel1").substring(0, 32),
    "impressions": 100,
    "clicks": 300,
    "conversions": 500
  },
  {
    "campaign_id": sha256.hex("campaign2").substring(0, 32),
    "channel_id": sha256.hex("channel2").substring(0, 32),
    "impressions": 100,
    "clicks": 300,
    "conversions": 500
  }
];

module.exports.rows = rows;
