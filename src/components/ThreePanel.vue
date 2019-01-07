<template>
  <div 
    :class="{'dark-mode': darkMode, 'platform-mac': platformClass === 'platform-mac', 'platform-windows': platformClass === 'platform-windows'}"
    class="three-panel">
    <Toolbar class="tool-bar">
      <!-- <Toggle icon="node-search" v-if="isConnected" :value="selectMode" @change="toggleSelectMode" title="Select a node in the scene to inspect it"></Toggle> -->
      <button @click="reload">Reconnect</button>
      <input 
        v-model="search" 
        class="three-panel-search"
        type="search" 
        placeholder="Find by name"
        @keyup.enter="searchFilter(search)">
    </Toolbar>
    <div class="three-panel-body">
      <Threes class="renderer-panel-body" v-if="messageVisible"></Threes>
      <SplitView 
        v-if="injected" 
        class="renderer-inject-body">
        <TreeView :search="search"/>
        <DetailView/>
      </SplitView>
      <div 
        v-if="!messageVisible"
        class="renderer-panel-message">
        Looking for
        <span class="renderer-panel-inline-logo">three.js</span> ...
      </div>
      <div 
        v-if="!injected && messageVisible"
        class="renderer-inject-message">
        Choose one renderer for
        <span class="renderer-panel-inline-logo">inspect</span> ...
      </div>
    </div>
  </div>
</template>

<script>
import { of, timer } from "rxjs";
import Toolbar from "./Toolbar.vue";
import Toggle from "./Toggle.vue";
import SplitView from "./SplitView.vue";
import TreeView from "./TreeView.vue";
import DetailView from "./DetailView.vue";
import Threes from './Threes.vue';
import connection from "../services/connection";
import active$ from "../services/active$";
import latestInspector$ from "../services/latestInspector$";
import { map, switchMap, startWith, tap } from "rxjs/operators";
import getPlatForm from "../utils.js"
export default {
  name: 'ThreePanel',
  components: { Toolbar, Toggle, SplitView, TreeView, DetailView, Threes },
  data() {
    return {
      search: "",
      platformClass: "platform-" + getPlatForm()
    };
  },
  computed: {
    darkMode() {
      return (
        typeof chrome !== "undefined" &&
        typeof chrome.devtools !== "undefined" &&
        typeof chrome.devtools.panels !== "undefined" &&
        chrome.devtools.panels.themeName === "dark"
      );
    }
  },
  subscriptions() {
    return {
      injected: latestInspector$.pipe(map(inspector => {
        return inspector !== null
      }
      )),
      messageVisible: active$.pipe(
        switchMap(active => {
          if (active) {
            return timer(100).pipe(
              map(() => true),
              startWith(false)
            );
          }
          return of(false);
        })
      ),
      searchFilter: latestInspector$.method("searchFilter")
    };
  },
  methods: {
    toggleSelectMode(value) {
      this.selectModeSubscription = this.inspector$
        .first()
        .subscribe(inspector => {
          inspector.selectMode(value);
        });
    },
    reload() {
      window.location.reload();
    },
    detect() {
      connection.to("content_scripts").send("DETECT");
    }
  }
};
</script>

<style lang="scss">
.three-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  font-size: 12px;
  color: #222;
  overflow: hidden;
  cursor: default;
  &.platform-mac {
		font-family: Menlo, monospace;
	}
	&.platform-windows {
		font-family: Consolas, "Lucida Console", "Courier New", monospace;
	}
}
.dark-mode {
  color: #bdc6cf;
}
.tool-bar {
  button {
    font-family: Menlo, monospace;
    color: #64b587;
  }
  .three-panel-search {
    padding: 2px 3px 1px 3px;
    border: 1px solid #fff;
    border-radius: 2px;
    font-family: Menlo, monospace;
    font-size: 12px;
    &:focus {
      outline: none;
    }
  }
}
.three-panel-body {
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  .renderer-panel-body {
    width: 20%;
  }
  .renderer-inject-body {
    flex-grow: 1;
  }
  .renderer-panel-message {
    height: 100%;
    font-size: 24px;
    color: rgb(75%, 75%, 75%);
    font-weight: bold;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    .renderer-panel-inline-logo {
      display: inline-block;
      width: 86px;
      height: 31px;
      margin-left: 15px;
      margin-right: 10px;
      color: transparent;
      background-size: contain;
    }
  }
  .renderer-inject-message {
    height: 100%;
    font-size: 24px;
    color: rgb(75%, 75%, 75%);
    font-weight: bold;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    .renderer-inject-inline-logo {
      display: inline-block;
      width: 86px;
      height: 31px;
      margin-left: 15px;
      margin-right: 10px;
      color: transparent;
      background-size: contain;
    }
  }
}



</style>
