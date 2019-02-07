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
                  class="col-md-2"
                  type="text"
                  placeholder="symbol">
      </base-input>
    </div>
    <base-button type="default" v-on:click="getOrders">Get Orders</base-button>
  </form>
  <base-table :data="orderTable.rows"
              :columns="orderTable.columnHeaders"
              thead-classes="text-primary">
  </base-table>
  <div>
    <form>
      <base-input v-model="orderNumber"
                  label="Order ID"
                  class="col-md-2"
                  type="text"
                  placeholder="Id">
      </base-input>
      <base-button type="default" v-on:click="fillOrder">Fill Order</base-button>
    </form>
  </div>
</div>

</template>

<script>
import * as _ from 'lodash';                      // Functional stuff
import { BigNumber, ContractWrappers , assetDataUtils } from '0x.js';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { State } from './../../main'
import { ETHER_TOKEN, TOKENS_BY_NETWORK } from '../../tokens';
import { NETWORK_CONFIGS } from './../../config'; 
import { HttpClient } from '@0x/connect';
import { BaseTable } from "@/components";

var orderBook; // todo

export default {
  components: {
    BaseTable
  },
  data() {
    return { makerSym: '', takerSym: '', orderNumber: '',     
             orderTable: { columnHeaders: ["Id", "Price", "Buy", "Sell"]
                            , rows: []
                            }   }
  },
  methods: {
    getOrders: async function (event) {
      const orders = await getOrdersAsync(this.makerSym, this.takerSym);
      console.log(orders.asks.records);
      orderBook = orders;
      this.orderTable.rows = await mapOrdersToTable(orders, this.makerSym, this.takerSym);
    },
    fillOrder: async function (event) {
      const result = await fillOrderAsync(this.orderNumber - 1, orderBook);
      console.log(JSON.stringify(result));
    }
  }
}



var fillOrderAsync = async (orderNum, orderBook) => {
  const sraOrder = orderBook.asks.records[orderNum].order;

  const contractWrappers = State.contractWrappers;

  const web3Wrapper = State.web3Wrapper;
  const networkId = await web3Wrapper.getNetworkIdAsync();
  const tokensForNetwork = TOKENS_BY_NETWORK[networkId];
  const zrxTokenAddress = tokensForNetwork['ZRX'].address;

  const addresses = await web3Wrapper.getAvailableAddressesAsync();
  const taker = addresses[0];

  // If the SRA endpoint has a taker fee the taker will need to be funded
  const takerZRXBalance = await contractWrappers.erc20Token.getBalanceAsync(zrxTokenAddress, taker);
  
  console.log(sraOrder.takerFee.toString(10));
  if (sraOrder.takerFee.greaterThan(takerZRXBalance)) {
    console.log('Not enough ZRX tokens for maker fee!');
    return;
  }
  
  // Validate the order is Fillable given the maker and taker balances
  // todo
  // await contractWrappers.exchange.validateFillOrderThrowIfInvalidAsync(sraOrder, takerAssetAmount, taker);
      
  // Fill the Order via 0x Exchange contract
  txHash = await contractWrappers.exchange.fillOrderAsync(sraOrder, sraOrder.takerAssetAmount, taker);
  txReceipt = await printUtils.awaitTransactionMinedSpinnerAsync('fillOrder', txHash);
  return {txHash, txReceipt}
}

const onTxSubmitted =  txHash => { console.log(txHash); };

var mapOrdersToTable = async (orders, makerSym, takerSym) => {
  const web3Wrapper = State.web3Wrapper;
  const networkId = await web3Wrapper.getNetworkIdAsync();
  const tokensForNetwork = TOKENS_BY_NETWORK[networkId];

  const makerToken = tokensForNetwork[makerSym];
  const takerToken = tokensForNetwork[takerSym];

  const numToEasyString = (amount, token) => amount.div((new BigNumber(10)).pow(token.decimals)).toString(10);

  let i = 0;
  const formatRow = row => { 
    i += 1;
    return {"id": i, "price": row.order.makerAssetAmount.div(row.order.takerAssetAmount).toString(10),"sell": numToEasyString(row.order.makerAssetAmount, makerToken), "buy": numToEasyString(row.order.takerAssetAmount, takerToken)}
  }
  
  return _.map(orders.asks.records, formatRow);
}

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
  return response;
}

</script>
<style>
</style>
