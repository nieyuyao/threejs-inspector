import { log } from "./services/config";
import Vue from "vue";
import VueRx from "vue-rx";
import ThreePanel from "./components/ThreePanel.vue";
import "./bootstrap.scss";

log.info("three.panel");

if (chrome.extension) {
  Vue.config.devtools = false;
}
if (chrome.extension || process.env.DEV_SERVER) {
  Vue.config.productionTip = false;
}
Vue.use(VueRx);
const vm = new Vue(ThreePanel);
vm.$mount("three-panel");
