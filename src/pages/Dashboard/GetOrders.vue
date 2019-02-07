<template>

<div id="getOrders">
  <form>
    <div class="form-row">
      <base-input v-model="makerSym"
                  label="Buy Symbol"
                  class="col-md-2"
                  type="text"
                  placeholder="symbol">
      </base-input>
      <base-input v-model="takerSym"
                  label="Sell Symbol"
                  class="col-md-6"
                  type="text"
                  placeholder="symbol">
      </base-input>
    </div>
    <base-button type="default" v-on:click="getOrders">Get Orders</base-button>
  </form>
</div>

</template>

<script>
import { BigNumber, ContractWrappers , assetDataUtils } from '0x.js';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { State } from './../../main'
import { ETHER_TOKEN, TOKENS_BY_NETWORK } from '../../tokens';
import { NETWORK_CONFIGS } from './../../config'; 
import { HttpClient } from '@0x/connect';

export default {
  data() {
    return { makerSym: '', takerSym: '' }
  },
  methods: {
    getOrders: async function (event) {
      await getOrdersAsync(this.makerSym, this.takerSym);
    }
  }
}

const onTxSubmitted = txHash => { console.log(txHash); };

var getOrdersAsync = async (makerSym, takerSym) => {
  const web3Wrapper = State.web3Wrapper;
  const networkId = await web3Wrapper.getNetworkIdAsync();
  const tokensForNetwork = TOKENS_BY_NETWORK[networkId];
  const makerToken = tokensForNetwork[makerSym];
  const takerToken = tokensForNetwork[takerSym];

  const makerAssetData = assetDataUtils.encodeERC20AssetData(makerToken.address);
  const takerAssetData = assetDataUtils.encodeERC20AssetData(takerToken.address);
  const orderbookRequest = { baseAssetData: makerAssetData, quoteAssetData: takerAssetData };

  const httpClient = new HttpClient('http://localhost:3000/v2/');
  const response = await httpClient.getOrderbookAsync(orderbookRequest, { networkId: NETWORK_CONFIGS.networkId });
  if (response.asks.total === 0) {
    throw new Error('No orders found on the SRA Endpoint');
  }
  console.log(response);
  return response;
}

</script>
<style>
</style>
