/* eslint-disable no-console */
import { mergeMap, tap, filter } from "rxjs/operators";
import relay$ from "./devtools-rx/relay$";
import connection$ from "./devtools-rx/connection$";
import { debug } from "./services/config";
const verbose = false;
console.info("three.background", { debug });

relay$.subscribe();

if (debug && verbose) {
  connection$
    .pipe(
      mergeMap(connection => {
        console.log("new Connection", {
          id: connection.id,
          name: connection.name,
          tabId: connection.tabId
        });
        return connection.message$;
      })
    )
    .subscribe(message => {
      console.log("new Message", message);
    });
}

// Listen to DETECTED messages and show the PageAction icon
connection$
  .pipe(
    mergeMap(connection => {
      const detected$ = connection.message$.pipe(
        filter(message => message.broadcast === "DETECTED")
      );
      return detected$.pipe(
        tap(message => {
          const tabId = connection.tabId;
          debug &&
            console.log("DETECTED", {
              tabId,
              index: message.data.index,
              version: message.data.version
            });
          chrome.pageAction.show(tabId);
          chrome.pageAction.setTitle({
            tabId,
            title: "Three.JS " + message.data.version
          });
          chrome.pageAction.setIcon({
            tabId,
            path: {
              "16": "icon.png",
              "32": "icon.png"
            }
          });
        })
      );
    })
  )
  .subscribe();
