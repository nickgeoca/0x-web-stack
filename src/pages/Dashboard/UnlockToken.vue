<template>
<div id="ethToWeth">
  <form>
    <div class="form-row">
      <base-input v-model="sellSymbol"
                  label="Sell Symbol"
                  class="col-md-2"
                  type="text"
                  placeholder="symbol">
      </base-input>
      <base-button type="default" v-on:click="unlockToken">Unlock Token</base-button>
  </div>
  </form>
</div>
</template>
<script>
import { BaseAlert } from '@/components';

import { generatePseudoRandomSalt
       , BigNumber
       , assetDataUtils
       , orderHashUtils
       , signatureUtils } from '0x.js';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { State } from './../../main';
import { NULL_ADDRESS, ZERO } from '../../utils';
import { ETHER_TOKEN, TOKENS_BY_NETWORK } from '../../tokens';
import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses';
import { NETWORK_CONFIGS } from './../../config';

export default {
  data() {
    return { symbol: '' }
  },
  methods: {
    unlockToken: async function (event) { 
      const contractWrappers = State.contractWrappers;
      const web3Wrapper = State.web3Wrapper;
      const addresses = await web3Wrapper.getAvailableAddressesAsync();
      const makerAddress = addresses[0];

      const networkId = await web3Wrapper.getNetworkIdAsync();
      const makerToken = TOKENS_BY_NETWORK[networkId][this.sellSymbol].address;

      await makerApproveExchangeToSpendERC20Async(contractWrappers, makerToken, makerAddress);
    }
  }
}
// Allow the 0x ERC20 Proxy to move ZRX on behalf of makerAccount
var makerApproveExchangeToSpendERC20Async = async (contractWrappers, token, maker) => await contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(token, maker);

</script>
