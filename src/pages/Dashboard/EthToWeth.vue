<template>

<div id="ethToWeth">
  <form>
    <base-input v-model="amount"
                type="text"
                placeholder="Amount">
    </base-input>
    <base-button type="default" v-on:click="ethToWeth">Eth To Weth</base-button>
    <base-button type="default" v-on:click="wethToEth">Weth To Eth</base-button>
  </form>
</div>

</template>

<script>
import { BigNumber, ContractWrappers } from '0x.js';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { State } from '../../main'

export default {
  data() {
    return { amount: '' }
  },
  methods: {
    ethToWeth: async function (event) { await wrapOrUnwrapEthAsync(true, this.amount);  },
    wethToEth: async function (event) { await wrapOrUnwrapEthAsync(false, this.amount); }
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
