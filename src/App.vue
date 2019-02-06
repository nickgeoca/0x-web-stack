<template>
  <div>
    <notifications></notifications>
    <router-view :key="$route.fullPath"></router-view>
  </div>
</template>

<script>
import * as _ from 'lodash';                      // Functional stuff
import { Web3Wrapper } from '@0x/web3-wrapper';   // wrap web3
import { ContractWrappers, MetamaskSubprovider, RPCSubprovider, Web3ProviderEngine } from '0x.js';
import { networkToRPCURI } from './utils';
import { State } from './main';

export default {
  methods: {
    disableRTL() {
      if (!this.$rtl.isRTL) {
        this.$rtl.disableRTL();
      }
    },
    toggleNavOpen() {
      let root = document.getElementsByTagName('html')[0];
      root.classList.toggle('nav-open');
    }
  },
  async mounted() {
    await _initializeWeb3Async();
    this.$watch('$route', this.disableRTL, { immediate: true });
    this.$watch('$sidebar.showSidebar', this.toggleNavOpen)
  }
};

var _initializeWeb3Async = async () => {
  let injectedProviderIfExists = window.ethereum;
  if (!_.isUndefined(injectedProviderIfExists)) {
    if (!_.isUndefined(injectedProviderIfExists.enable)) {
      try {
        await injectedProviderIfExists.enable();
      } catch (err) {
        console.log(err);
      }
    }
  } else {
    const injectedWeb3IfExists = window.web3;
    if (!_.isUndefined(injectedWeb3IfExists) && !_.isUndefined(injectedWeb3IfExists.currentProvider)) {
      injectedProviderIfExists = injectedWeb3IfExists.currentProvider;
    } else {
      return undefined;
    }
  }
  if (injectedProviderIfExists) {
    // Wrap Metamask in a compatibility wrapper as some of the behaviour
    // differs
    const networkId = await new Web3Wrapper(injectedProviderIfExists).getNetworkIdAsync();
    const signerProvider =
          injectedProviderIfExists.isMetaMask || injectedProviderIfExists.isToshi
          ? new MetamaskSubprovider(injectedProviderIfExists)
          : new SignerSubprovider(injectedProviderIfExists);
    const provider = new Web3ProviderEngine();
    provider.addProvider(signerProvider);
    provider.addProvider(new RPCSubprovider(networkToRPCURI[networkId]));
    provider.start();
    const web3Wrapper = new Web3Wrapper(provider);
    const contractWrappers = new ContractWrappers(provider, { networkId });
    // Load all of the ABI's into the ABI decoder so logs are decoded
    // and human readable

    _.map(
      [
        contractWrappers.exchange.abi,
        contractWrappers.erc20Token.abi,
        contractWrappers.etherToken.abi,
        contractWrappers.forwarder.abi,
      ],
      abi => web3Wrapper.abiDecoder.addABI(abi),
    );

    State.web3Wrapper = web3Wrapper;
    State.contractWrappers = contractWrappers;
    State.web3 = injectedProviderIfExists;
  }
}

</script>

<style lang="scss"></style>
