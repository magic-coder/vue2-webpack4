<style scoped lang="less">
.vue-keyboard {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 100%;
  opacity: 0.3;
  z-index: 7888;
}
.keyboard {
  height: 250px;
  width: 100%;
  position: fixed;
  bottom: 0;
  left: 0;
  background: white;
  z-index: 8888;
  box-shadow: 0 0 10px 0 #ddd, 0 2px 4px 0 #ddd;
  .done {
    height: 50px;
    background: #f9f9f9;
    border: 1px solid #eee;
    border-right: none;
    border-left: none;
    padding-right: 10px;
    border-bottom: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .text {
      color: #777;
      font-size: 18px;
      border: 1px solid #e5e5e5;
      border-radius: 3px;
      padding: 3px 10px;
    }
    .keyboard-value {
      padding-left: 10px;
      font-size: 20px;
    }
  }
  .keyboard-list {
    height: 200px;
    .key:active {
      background: #e2e2e2;
    }
    .key {
      height: 25%;
      width: 33%;
      float: left;
      border-right: 0.5px solid #eee;
      border-top: 0.5px solid #eee;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30px;
    }
    .key:nth-child(3n) {
      border-right: none;
    }
    .icon-dot {
      font-size: 25px;
    }
  }
}
.del {
  font-size: 28px;
}
.animated {
  animation-duration: 0.2s;
  animation-fill-mode: both;
}
@keyframes slideInDown {
  from {
    transform: translate3d(0, 0, 0);
    visibility: visible;
  }
  to {
    transform: translate3d(0, 100%, 0);
    display: none;
  }
}
@keyframes slideInUp {
  from {
    transform: translate3d(0, 100%, 0);
    visibility: visible;
  }
  to {
    transform: translate3d(0, 0, 0);
  }
}
.slide-enter-active {
  animation-name: slideInUp;
}
.slide-leave-active {
  animation-name: slideInDown;
}
</style>
<template>
  <div>
    <div @touchstart="complete" @touchstart.stop.prevent="fn" v-if="show" class='vue-keyboard'></div>
    <transition name="slide">
      <div class="keyboard animated" v-show="show" @touchstart.stop.prevent="fn">
        <!-- 完成 按钮-->
        <div class="done">
          <div class='keyboard-value'>
            <span>{{value}}</span>
          </div>
          <div class="text" @touchstart="complete">完成</div>
        </div>
        <!-- 键盘区域 -->
        <div class="keyboard-list">
          <div class="key" v-for="(item,index) in list" :key="index" @touchstart="typing(item,$event)" @touchend="inputEnd($event)">
            <span v-if="item!='.'&&item!='del'">{{item}}</span>
            <i v-if="item=='.'" class="iconfont icon-dot">•</i>
            <i v-if="item=='del'" class="iconfont icon-keyboard-delete del">⇦</i>
          </div>
        </div>

      </div>
    </transition>
  </div>
</template>
<script>	
export default {
  props: {
    show: {
      default: false
    },
    value: {
      default: ''
    },
    max: {//输入最大数
      default: 10
    },
    decimal: {//小数点位数
      default: 2
    },
    isDecimal: {
      default: false //是否保留小数点
    }
  },
  data() {
    return {
      value: '',
      list:['1','2','3','4','5','6','7','8','9','.','0','del']
    }
  },
  methods: {
    /*防止点击完成按钮左边的空白区域收起键盘*/
    fn() { },
    /*输入*/
    typing(val, e) {
      this.highlight(e.currentTarget);
      if (val == '.' && !this.value) {
        return;
      }
      if (val == '.' && this.decimal=='0') {
        return;
      }
      if (val == '.' && this.value.indexOf('.') > -1) {
        return;
      }
      if (this.value.length > (this.max - 1) && val != 'del') {
        return;
      }
      if (this.value.split('.')[1] && this.value.split('.')[1].length > (this.decimal - 1) && val != 'del') {
        return;
      }
      if (val == 'del') {
        this.value = this.value && this.value.substr(0, this.value.length - 1);
      } else {
        this.value = this.value + val;
      }
      this.value = this.value.replace(/^0+/g, '0');
      this.$emit('typing', this.value);
    },
    inputEnd(e) {
      this.unhighlight(e.currentTarget);
    },
    highlight(e) {
      e.style.backgroundColor = '#c3c7cf'
    },
    unhighlight(e) {
      setTimeout(() => {
        e.style.backgroundColor = '#fff'
      }, 100)

    },
    /*点击完成*/
    complete() {
      if (this.value && !this.value.split('.')[1]) {
        if (this.isDecimal) {
          this.value = this.value && parseFloat(this.value).toFixed(parseInt(this.decimal));
        } else {
          this.value = this.value.split('.')[0];
        }
      } else {
        if (this.isDecimal) {
          this.value = this.value && parseFloat(this.value).toFixed(parseInt(this.decimal) + 1);
          this.value = this.value && this.value.substr(0, this.value.length - 1)
        }
      }
      if (this.value.indexOf('.') == -1) {
        this.value = this.value.replace(/^0+/g, '')
      }
      this.$emit('typing', this.value);
      this.$emit('complete');
    }
  }
}
</script>
