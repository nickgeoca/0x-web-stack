<template>

<div id="ethToWeth">
    <base-button type="default" v-on:click="getBals">GetBals</base-button>
</div>

</template>

<script>
import * as _ from 'lodash';                      // Functional stuff
import { BigNumber, ERC20TokenWrapper } from '0x.js';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { State } from '../../main'
import { ETHER_TOKEN, TOKENS_BY_NETWORK } from '../../tokens';

export default {
  data() {
    return { balances: undefined }
  },
  methods: {
    getBals: async function (event) { this.balances = await fetchAccountDetailsAsync();  }
  }
}

async function  fetchAccountDetailsAsync() {
  const balances = {}
  const web3Wrapper = State.web3Wrapper;
  const erc20TokenWrapper = State.erc20TokenWrapper;

  const networkId = await web3Wrapper.getNetworkIdAsync();
  const tokens = TOKENS_BY_NETWORK[networkId];

  const addresses = await web3Wrapper.getAvailableAddressesAsync();
  const address = addresses[0];
  if (_.isUndefined(address)) { return;  }

  // Fetch all the Balances for all of the tokens
  const allBalancesAsync = _.map(
    tokens,
    async (token) => {
      if (!token.address) {
        return undefined;
      }
      try {
        const balance = await erc20TokenWrapper.getBalanceAsync(token.address, address);
        const allowance = await erc20TokenWrapper.getProxyAllowanceAsync(token.address, address);
        const numberBalance = new BigNumber(balance);
        return { token, balance: numberBalance, allowance };
      } catch (e) {
        console.log(e);
        return undefined;
      }
    },
  );
  
  const results = await Promise.all(allBalancesAsync);
  balances[address] = _.compact(results);

  // Fetch the Balance of Ether
  const weiBalance = await web3Wrapper.getBalanceInWeiAsync(address);
  balances[address] = [
    ...balances[address],
    {
      token: ETHER_TOKEN,
      balance: weiBalance,
      allowance: new BigNumber(0),
    }
  ];

  return balances;
}
</script>
<style>
</style>
