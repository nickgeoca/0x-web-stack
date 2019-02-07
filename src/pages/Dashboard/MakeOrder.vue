<template>
</template>
<script>
import { State } from './../../main';

public createOrderAsync = async (makerTokenSymbol, makerAmount, takerTokenSymbol, takerAmount) => {
  const web3Wrapper = State.web3Wrapper;
  const contractWrappers = State.contractWrappers;

  // Query the available addresses
  const addresses = await web3Wrapper.getAvailableAddressesAsync();

  // Retrieve the network for the correct token addresses
  const networkId = await web3Wrapper.getNetworkIdAsync();

  // Use the first account as the maker
  const makerAddress = addresses[0];

  // Get the Token Metadata, address, decimals
  const tokensForNetwork = TOKENS_BY_NETWORK[networkId];
  const makerToken = tokensForNetwork[makerTokenSymbol];
  const takerToken = tokensForNetwork[takerTokenSymbol];

  // Encode the selected makerToken as assetData for 0x
  const makerAssetData = assetDataUtils.encodeERC20AssetData(makerToken.address);

  // Encode the selected takerToken as assetData for 0x
  const takerAssetData = assetDataUtils.encodeERC20AssetData(takerToken.address);

  // Amounts are in Unit amounts, 0x requires base units (as many tokens use decimals)
  const makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(makerAmount), makerToken.decimals);
  const takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(takerAmount), takerToken.decimals);
  const exchangeAddress = contractWrappers.exchange.address;
  // Create the order
  const order: Order = {
    makerAddress, // maker is the first address
    takerAddress: NULL_ADDRESS, // taker is open and can be filled by anyone
    makerAssetAmount, // The maker asset amount
    takerAssetAmount, // The taker asset amount
    expirationTimeSeconds: new BigNumber(Date.now() + 10 * 60), // Time when this order expires
    makerFee: ZERO, // 0 maker fees
    takerFee: ZERO, // 0 taker fees
    feeRecipientAddress: NULL_ADDRESS, // No fee recipient
    senderAddress: NULL_ADDRESS, // Sender address is open and can be submitted by anyone
    salt: generatePseudoRandomSalt(), // Random value to provide uniqueness
    makerAssetData,
    takerAssetData,
    exchangeAddress,
  };
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
}
</script>
