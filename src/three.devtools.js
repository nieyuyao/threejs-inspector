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

// If all pixi instances are already detected, no DETECTED events will fire, but INSTANCES will return an array.
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

// When devtools is opened, start detection again, maybe PIXI wasn't yet ready before.
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
