<template>
  <div id="ethToWeth">
    <base-button type="default" v-on:click="ethToWeth">Eth To Weth</base-button>
  </div>
</template>
<script>
import { BigNumber, ContractWrappers } from '0x.js';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { State } from '../../main'

export default {
  methods: {
    ethToWeth: async (event) => {
      await wrapOrUnwrapEthAsync(true);
    }
  }
}

const onTxSubmitted = txHash => { console.log(txHash); };

var wrapOrUnwrapEthAsync = async (wrap) => {
  const web3Wrapper = State.web3Wrapper;
  const contractWrappers = State.contractWrappers;

  const amount = 0.5;
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
