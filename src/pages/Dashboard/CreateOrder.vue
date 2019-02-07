<template>
<div id="ethToWeth">
  <form>
    <base-input v-model="sellAmount"
                type="text"
                placeholder="Sell Amount">
    </base-input>
    <base-input v-model="buyAmount"
                type="text"
                placeholder="Buy Amount">
    </base-input>
    <base-button type="default" v-on:click="createOrder">Create Order</base-button>
  </form>

  <base-button type="default" v-on:click="unlockToken">Unlock Token</base-button>
</div>
</template>
<script>
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
  data() {
    return { sellAmount: '', buyAmount: '' }
  },
  methods: {
    createOrder: async function (event) { 
      const order = await createOrderAsync( 'ZRX', this.sellAmount
                                          , 'WETH', this.buyAmount
                                          , 10 * 60); 
    },
    unlockToken: async function (event) { 
      const makerTokenSymbol = 'ZRX';

      const contractWrappers = State.contractWrappers;
      const web3Wrapper = State.web3Wrapper;
      const addresses = await web3Wrapper.getAvailableAddressesAsync();
      const makerAddress = addresses[0];

      const networkId = await web3Wrapper.getNetworkIdAsync();
      const makerToken = TOKENS_BY_NETWORK[networkId][makerTokenSymbol].address;

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
    // makerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(.03), makerToken.decimals), // 0 maker fees
    // takerFee: ZERO, // 0 taker fees
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

  // Generate the order hash and sign it
  const orderHashHex = orderHashUtils.getOrderHashHex(order);
  const signature = await signatureUtils.ecSignHashAsync(web3Wrapper._provider, orderHashHex, makerAddress);
  const signedOrder = { ...order, signature };

  console.log(signedOrder);

  // todo fix this
  // await contractWrappers.exchange.validateOrderFillableOrThrowAsync(signedOrder);
  await httpClient.submitOrderAsync(signedOrder, { networkId: NETWORK_CONFIGS.networkId });
  console.log('Sent to httpClient');

/*

  feeRecipientAddress: NULL_ADDRESS, // No fee recipient
  senderAddress: NULL_ADDRESS, // Sender address is open and can be submitted by anyone
  salt: generatePseudoRandomSalt(), // Random value to provide uniqueness

  // Generate the order hash for the order
  const orderHashHex = orderHashUtils.getOrderHashHex(order);
  const provider = web3Wrapper.getProvider();
  // The maker signs the order as a proof
  try {
    const signedOrder = await signatureUtils.ecSignOrderAsync(provider, order, makerAddress);
    return signedOrder;
  } catch (err) {
    console.log(err);
    return null;
  }
*/
  return;
}
</script>
