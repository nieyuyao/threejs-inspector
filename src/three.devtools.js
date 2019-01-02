/**
 * Access to the chrome.devtools apis
 */

import {
  tap,
  switchMap,
  map,
  publishReplay,
  refCount,
  take,
  filter,
  merge
} from "rxjs/operators";
import Connection from "./devtools-rx/Connection";
import { debug } from "./services/config";
import Panel from "./devtools-rx/Panel";

/* eslint-disable no-console */
debug && console.info("three.devtools");
/* eslint-enable */
const connection = new Connection("devtools_page");

//监听DETECTED消息，如果监听到的话，返回INSTANCES消息
const threeDetected$ = connection.on("DETECTED").pipe(
  merge(
    connection
      .to("content_scripts")
      .stream("INSTANCES")
      .pipe(filter(message => message.data.length > 0))
  )
);
const panel$ = threeDetected$.pipe(
  take(1),
  map(() => new Panel("Three", "icon.png", "three.panel.html")),
  publishReplay(1),
  refCount(1)
);
panel$.subscribe();

//如果devtools打开了，开始检测，可能THREE还没有准备好，此时再次发送DETECT消息
connection.to("content_scripts").send("DETECT");

// Stream the visibility to the three_panel
connection
  .on("PANEL_VISIBLE")
  .pipe(
    switchMap(command =>
      panel$.pipe(
        switchMap(panel => panel.visible$),
        tap(visible => {
          command.respond("PANEL_VISIBLE", visible);
        })
      )
    )
  )
  .subscribe();
