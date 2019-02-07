<template>
  <base-table :data="table.data"
              :columns="table.columns"
              thead-classes="text-primary">
  </base-table>
</template>
<script>
import { BaseTable } from "@/components";
export default {
  components: {
    BaseTable
  },
  computed: {

    table(){
    const d = { columns: ["Name", "Symbol", "Balance", "Allowance"]
              , data: []
              };

    d.data.push({"id": 1, "name": , "symbol": , "balance": , "allowance"});

      // name, decimals, symbol, isTradeable, isMintable, image, address, balance, allowance
      return 
      {"0x22d5ebe7cd2554b9d02579cfe61436f81ae90b09"
 :[
{"token" : {"name":"0x Protocol Token"
           ,"decimals":18
           ,"symbol":"ZRX"
           ,"isTradeable":true
           ,"isMintable":false
           ,"image":"https://0xproject.com/images/token_icons/ZRX.png"
           ,"address":"0x871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c"
,"balance":"0"
,"allowance":"115792089237316195423570985008687907853269984665640564039457584007913129639935"
      }
    }
  }
</script>
<style>
</style>
