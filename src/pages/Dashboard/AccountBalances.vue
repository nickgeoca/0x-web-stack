<template>
  <base-table :data="balancesTable.rows"
              :columns="balancesTable.columnHeaders"
              thead-classes="text-primary">
  </base-table>
</template>
<script>
import * as _ from 'lodash';                      // Functional stuff
import { BigNumber, ERC20TokenWrapper } from '0x.js';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { State } from './../../main';
import { ETHER_TOKEN, TOKENS_BY_NETWORK } from '../../tokens';
import { BaseTable } from "@/components";

export default {
  components: {
    BaseTable
  },
  data: function() {
    return {
      timer: '',
      balancesTable: { columnHeaders: ["Name", "Symbol", "Balance"]
                     , rows: []
                     }
    }
  },
  methods: {
    updateBalances: async function (event) { 
      this.balancesTable.rows = await fetchAccountDetailsAsync();  
    }
  },
  created: function() {
    // this.updateBalances();
    this.timer = window.setInterval(this.updateBalances, 3000);
  },
  beforeDestroy() {
    clearInterval(this.timer)
  }
}

var fetchAccountDetailsAsync =  async () => {
  const web3Wrapper = State.web3Wrapper;
  const erc20TokenWrapper = State.erc20TokenWrapper;

  const balances = {}

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

  // {"token":{"name":"ETH","decimals":18,"symbol":"ETH","isTradeable":true,"isMintable":false,"image":"https://0xproject.com/images/token_icons/WETH.png","address":"0x0b1ba0af832d7c05fd64161e0db78e85978e8082"}
  // ,"balance":"1520000000000000000"
  // ,"allowance":""}
  // balance, allowance 
  // toke: name, decimals, symbol, isTradeable, isMintable, image, address, 
  let i = 0;
  const formatRow = row => { 
    i += 1;
    return { "id": i
           , "name": row.token.name
           , "symbol": row.token.symbol
           , "balance": ((new BigNumber(row.balance)).div((new BigNumber(10)).pow(row.token.decimals))).toString(10)
           }; 
  }
  return _.map(balances[address], formatRow);
}
</script>
<style>
</style>
