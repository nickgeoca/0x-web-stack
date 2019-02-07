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
      <base-input v-model="sellAmount"
                  label="Sell Amount"
                  class="col-md-6"
                  type="text"
                  placeholder="amount">
      </base-input>
    </div>
    <div class="form-row">
      <base-input v-model="buySymbol"
                  label="Buy Symbol"
                  class="col-md-2"
                  type="text"
                  placeholder="symbol">
      </base-input>
      <base-input v-model="buyAmount"
                  label="Buy Amount"
                  class="col-md-6"
                  type="text"
                  placeholder="amount">
      </base-input>
    </div>
    <base-input v-model="expireTime"
                label="Expire Time (seconds)"
                type="text"
                placeholder="seconds">
    </base-input>

    <base-button type="default" v-on:click="createOrder">Create Order</base-button>
  </form>
  <base-button type="default" v-on:click="unlockToken">Unlock Token</base-button>
  <card>
    <base-alert type="success" dismissible> <!-- todo fix this -->
      <strong>Success: </strong> {{ resultMessage }}
    </base-alert>
  </card>
</div>
</template>
<script>
import { BaseAlert } from '@/components';

import { HttpClient } from '@0x/connect';
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
  components: {
    BaseAlert,
  },
  data() {
    return { sellAmount: '', buyAmount: '', sellSymbol: '', buySymbol: '', expireTime: '', resultMessage: '' }
  },
  methods: {
    createOrder: async function (event) { 
      const result = await createOrderAsync( this.sellSymbol, this.sellAmount
                                           , this.buySymbol, this.buyAmount
                                           , this.expireTime); 
      this.resultMessage = result;
    },
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
var makerApproveExchangeToSpendERC20Async = async (contractWrappers, token, maker) => {
  return await contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(token, maker);
}

var createOrderAsync = async (makerTokenSymbol, makerAmount, takerTokenSymbol, takerAmount, deltaExpTime) => {
  const httpClient = new HttpClient('http://localhost:3000/v2/');
  const web3Wrapper = State.web3Wrapper;
  const contractWrappers = State.contractWrappers;

  // Query the available addresses
  const networkId = await web3Wrapper.getNetworkIdAsync();
  const addresses = await web3Wrapper.getAvailableAddressesAsync();
  const makerAddress = addresses[0];

  // Get the Token Metadata, address, decimals
  const tokensForNetwork = TOKENS_BY_NETWORK[networkId];
  const makerToken = tokensForNetwork[makerTokenSymbol];
  const takerToken = tokensForNetwork[takerTokenSymbol];

  // Encode the data as assetData for 0x
  const makerAssetData = assetDataUtils.encodeERC20AssetData(makerToken.address);
  const takerAssetData = assetDataUtils.encodeERC20AssetData(takerToken.address);

  // Amounts are in Unit amounts, 0x requires base units (as many tokens use decimals)
  const makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(makerAmount), makerToken.decimals);
  const takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(takerAmount), takerToken.decimals);
  const exchangeAddress = contractWrappers.exchange.address;

  // Create the order
  const orderConfigRequest = {
    exchangeAddress,
    makerAddress, // maker is the first address
    takerAddress: NULL_ADDRESS, // taker is open and can be filled by anyone
    expirationTimeSeconds: new BigNumber(Date.now() + deltaExpTime), // Time when this order expires
    makerAssetAmount, // The maker asset amount
    takerAssetAmount, // The taker asset amount
    makerAssetData,
    takerAssetData,
    makerFee: new BigNumber(10), // Web3Wrapper.toBaseUnitAmount(new BigNumber(.03), makerToken.decimals), // 0 maker fees
    takerFee: new BigNumber(10), // 0 taker fees
  };

  const orderConfig = await httpClient.getOrderConfigAsync(orderConfigRequest, {
    networkId: NETWORK_CONFIGS.networkId,
  });

  // Create the order
  const order = {
    salt: generatePseudoRandomSalt(),
    ...orderConfigRequest,
    ...orderConfig,
  };

  try {
    // Generate the order hash and sign it
    const orderHashHex = orderHashUtils.getOrderHashHex(order);
    const signature = await signatureUtils.ecSignHashAsync(web3Wrapper._provider, orderHashHex, makerAddress);
    const signedOrder = { ...order, signature };

    // todo fix this
    // await contractWrappers.exchange.validateOrderFillableOrThrowAsync(signedOrder);
    await httpClient.submitOrderAsync(signedOrder, { networkId: NETWORK_CONFIGS.networkId });
    return 'Order sent to relayer';
  } catch (err) {
    return err;
  }

}
</script>
