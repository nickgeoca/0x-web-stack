<template>

<div id="getOrders">
  <form>
    <base-input v-model="amount"
                type="text"
                placeholder="Amount">
    </base-input>
    <base-button type="default" v-on:click="getOrders">Get Orders</base-button>
  </form>
</div>

</template>

<script>
import { BigNumber, ContractWrappers } from '0x.js';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { State } from './../../main'
import { ETHER_TOKEN, TOKENS_BY_NETWORK } from '../../tokens';
import { NETWORK_CONFIGS } from './../../config'; 
import { HttpClient } from '@0x/connect';

export default {
  data() {
    return { amount: '' }
  },
  methods: {
    getOrders: async function (event) {
      // assetDataUtils
      // makerToken
      const web3Wrapper = State.web3Wrapper;
      const networkId = await web3Wrapper.getNetworkIdAsync();
      const tokensForNetwork = TOKENS_BY_NETWORK[networkId];
      const makerToken = tokensForNetwork['ZRX'];
      assetDataUtils.encodeERC20AssetData(makerToken.address);
      const orderbookRequest = { baseAssetData: makerAssetData, quoteAssetData: takerAssetData };

      const httpClient = new HttpClient('http://localhost:3000/v2/');
      const response = await httpClient.getOrderbookAsync(orderbookRequest, { networkId: NETWORK_CONFIGS.networkId });
      if (response.asks.total === 0) {
        throw new Error('No orders found on the SRA Endpoint');
      }
      console.log(response);
      return response;
    }
  }
}

const onTxSubmitted = txHash => { console.log(txHash); };

var wrapOrUnwrapEthAsync = async (wrap, amount) => {
  const web3Wrapper = State.web3Wrapper;
  const contractWrappers = State.contractWrappers;

  const etherTokenAddress = contractWrappers.forwarder.etherTokenAddress;

  if (etherTokenAddress) {
    // List all of the available addresses
    const addresses = await web3Wrapper.getAvailableAddressesAsync();

    // The first address is one the which deposits or withdraws Eth
    const account = addresses[0];

    // Amounts are in ETH, this needs to be converted into their base unit wei
    const ethAmount = new BigNumber(amount);
    const weiAmount = Web3Wrapper.toBaseUnitAmount(ethAmount, 18);

    // Call deposit or withdraw on the ethertoken
    const txHash = wrap
          ? await contractWrappers.etherToken.depositAsync(etherTokenAddress, weiAmount, account)
          : await contractWrappers.etherToken.withdrawAsync(etherTokenAddress, weiAmount, account);

    if (txHash) {
      onTxSubmitted(txHash);
    }
  }
}

</script>
<style>
</style>
