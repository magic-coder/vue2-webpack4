<template>
  <div class='hell'>
    <div class="kboard" @click="getNumber">
      <div>交易金额：</div>
      <div style="flex:1"><input placeholder="请输入金额" v-model="valueNumber" type="text"></div>
      <div>元</div>
    </div>
    <keyboard :show="keyboard" :decimal="decimal" :value="valueNumber" @typing="typing" @complete="blur" />
  </div>
</template>
<script>
import { isBankCard } from "../../../config/gobal.js";
import keyboard from "../../../component/number.vue";
export default {
  data() {
    return {
      title: "ddddd",
      decimal: 2,
      valueNumber: "",
      keyboard: false
    };
  },
  components: {
    keyboard
  },
  methods: {
    typing(value) {
      this.valueNumber = value;
    },
    blur() {
      this.keyboard = false;
    },
    getNumber() {
      this.keyboard = true;
    }
  },
  created() {
    this.title = isBankCard();
  }
};
</script>
<style lang="sass">
.hell {
  height: 100%;
  width: 100%;
  font-size: 30px;
  display: flex;
  background: url("../assets/timg.jpg") no-repeat;
  background-size: 100% 100%;
  .kboard {
    padding: 2px 15px;
    display: flex;
    font-size: 16px;
    border-top: 1px solid #eee;
    border-bottom: 1px solid #eee;
    height: 50px;
    align-items: center;
    width: 100%;
    :nth-child(1) {
      width: 100px;
    }
  }
}
</style>