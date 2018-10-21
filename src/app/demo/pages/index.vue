<template>
  <div class="index">
    {{value}} ggggg
  </div>
</template>
<script>
import api from '../../../config/webapi.js';
export default {
  data(){
    return{
      value:'Hellor Word'
    }
  }
}
</script>
<style lang="scss">
.index{
  display: flex;
  align-items: center;
  justify-content:center;
  height: 100%;
  background-color: #fff;
  font-size: 22px;
}
</style>


