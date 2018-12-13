import sha256 from 'js-sha256';
import web3Utils from 'web3-utils';
import MetricSetHasher from '../helpers/MetricSetHasher';
import sampleRows from './rows';

const createProposals = (verifiersCount, accounts, forceSameProposals) => {
  const verifiersAddr = [];
  const secrets = [];
  const proposals = [];
  const blindedProposals = [];

  const root = sha256.hex('root').substring(0, 32);

  if (verifiersCount > sampleRows.length) { throw new Error(`ERROR: We need more samples rows, have: ${sampleRows.length} need: ${verifiersCount}`); }
  for (let i = 0; i < verifiersCount; i += 1) {
    if (!accounts[i + 1]) throw new Error('there is not enough accounts');
    verifiersAddr.push(accounts[i + 1]);

    secrets.push(web3Utils.soliditySha3(sha256.hex('secret'), i));
    proposals.push(MetricSetHasher(root, sampleRows[forceSameProposals ? 0 : i]));

    blindedProposals.push(web3Utils.soliditySha3(proposals[i], secrets[i]));
  }

  return {
    verifiersAddr, secrets, proposals, blindedProposals,
  };
};


export default createProposals;
