import { of } from "rxjs";
import { switchMap, startWith, merge, map, tap } from "rxjs/operators";
import connection from "./connection";
import active$ from "./active$";
const stageClient = connection.to("content_scripts");
const instances$ = active$.pipe(
  tap(active => {
    active ? stageClient.send("FRONTSTAGE") : stageClient.send("BACKSTAGE");
  }),
  switchMap(active => {
    if (!active) {
      return of([]);
    }
    connection.to("content_scripts").send("DETECT");
    return connection.on("DETECTED").pipe(
      startWith(null),
      switchMap(() => connection.to("content_scripts").stream("INSTANCES")),
      merge(connection.on("DISCONNECTED").pipe(map(() => [])))
    );
  })
);
export default instances$;
