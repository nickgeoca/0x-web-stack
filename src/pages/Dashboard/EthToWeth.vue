<template>
  <div id="ethToWeth">
    <base-button type="default" v-on:click="ethToWeth">Eth To Weth</base-button>
  </div>
</template>
<script>
// import { ContractWrappers } from '0x.js';

  export default {
    methods: {
      ethToWeth: function (event) {
        // const etherTokenAddress = contractWrappers.forwarder.etherTokenAddress;
        // console.log(etherTokenAddress);
        
        // `this` inside methods points to the Vue instance
        alert('Hello ' + this.name + '!')
        // `event` is the native DOM event
        if (event) {
          alert(event.target.tagName)
        }
      }
    }
  }
</script>
<style>
</style>

<!--
    public wrapOrUnwrapEthAsync = async (wrap: boolean) => {
        const { web3Wrapper, contractWrappers, onTxSubmitted } = this.props;
        const { amount } = this.state;
        // Retrieve the ether token address
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
-->
