<template>
  <div id="ethToWeth">
    <button v-on:click="ethToWeth">Eth To Weth</button>
  </div>
</template>
<script>
  export default {
    methods: {
      ethToWeth: function (event) {
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
