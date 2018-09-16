<template>
  <div class="index">
    {{value}}
  </div>
</template>
<script>
export default {
  data(){
    return{
      value:'Hellor Word'
    }
  },
  methods:{
    initData(){
      console.log('=============Hellor Word============')
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


