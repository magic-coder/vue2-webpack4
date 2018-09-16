<template>
  <div class="index">
    {{value}}
  </div>
</template>
<script>
export default {
  data(){
    return{
      value:'Hellor Words'
    }
  }
}
</script>
<style>
.index{
  display: flex;
  align-items: center;
  justify-content:center;
  height: 100%;
  background-color: #fff;
  font-size: 22px;
}
</style>


