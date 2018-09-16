<template>
  <transition :name="transitionName">
    <router-view class="child-view"></router-view>
  </transition>
</template>
<script>
export default {
  data() {
    return {
      transitionName: "slide-left"
    };
  },
  name: "App",
  watch: {
    $route(to, from) {
      if (to.meta.index < from.meta.index) {
        this.transitionName = "slide-right";
      } else {
        this.transitionName = "slide-left";
      }
      document.title = to.meta.title;
    }
  }
};
</script>
<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-box-sizing: border-box;
  font-family: "PingFangSC-Regular";
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-size: inherit;
  font-weight: 400;
}

img {
  border: 0;
  vertical-align: top;
}

li {
  list-style: none;
}

input,
textarea {
  border: none;
  background: none;
  appearance: none;
}

input,
textarea,
select {
  border: 0;
  outline: none;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
}

button,
input[type="submit"] {
  border: none;
  background: none;
  appearance: none;
  outline: none;
}

a {
  touch-callout: none;
  text-decoration: none;
  color: #000;
  -webkit-tap-highlight-color: transparent;
}

i,
em {
  font-style: normal;
}

textarea {
  resize: none;
}

button::-moz-focus-inner,
input::-moz-focus-inner,
textarea::-moz-focus-inner {
  border: 0;
  padding: 0;
}

html,
body {
  height: 100%;
  overflow: hidden;
  color: #333;
  font-size: 12px;
  background-color: #f8f8f8;
}
@media (-webkit-min-device-pixel-ratio: 1.5), (min-device-aspect-ratio: 1.5) {
  .border-1px::after {
    -webkit-transform: scaleY(0.7);
    transform: scaleY(0.7);
  }
}

@media (-webkit-min-device-pixel-ratio: 2), (min-device-aspect-ratio: 2) {
  .border-1px::after {
    -webkit-transform: scaleY(0.5);
    transform: scaleY(0.5);
  }
}

body {
  height: 100%;
  font-family: PingFangSC-Regular;
  background: #f5f5f5;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

body ::-webkit-scrollbar {
  display: none;
}

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 16px;
}

.child-view {
  position: absolute;
  width: 100%;
  transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
}
.slide-left-enter,
.slide-right-leave-active {
  opacity: 0;
  -webkit-transform: translate(50px, 0);
  transform: translate(50px, 0);
}
.slide-left-leave-active,
.slide-right-enter {
  opacity: 0;
  -webkit-transform: translate(-50px, 0);
  transform: translate(-50px, 0);
}
</style>
