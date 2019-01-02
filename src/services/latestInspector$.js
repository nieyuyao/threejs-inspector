import { Observable, of, Subject } from "rxjs";
import {
  map,
  switchMap,
  shareReplay,
  startWith,
  withLatestFrom,
  filter
} from "rxjs/operators";
import AsyncInspector from "./AsyncInspector";
import connection from "./connection";
import instances$ from "./instances$";

const relaySubject = new Subject();

export const renderer$ = instances$.pipe(
  map(frame => {
    if (!frame || frame.length === 0) {
      return null;
    }
    return {
      connection: frame.from,
      frameURL: frame.frameURL,
      data: frame.data
    };
  }),
  filter(frame => frame !== null)
);
renderer$.select = function(query) {
  let queryArray = query.split(".");
  queryArray = queryArray.slice(0, 2);
  const queryObject = {};
  queryObject.threeIndex = Number(queryArray[0]);
  queryObject.rendererIndex = Number(queryArray[1]);
  relaySubject.next(queryObject);
};

/**
 * Create a AsyncInspector for the detected instance
 */
const latestInspector$ = relaySubject.pipe(
  withLatestFrom(renderer$),
  map(([queryObject, frame]) => Object.assign(queryObject, frame)),
  switchMap(instance => {
    if (instance === null) {
      return of(null);
    }
    return connection
      .to(instance.connection)
      .get("INSPECTOR", {
        threeIndex: instance.threeIndex,
        rendererIndex: instance.rendererIndex
      })
      .pipe(
        switchMap(sign =>
          Observable.create(observer => {
            const inspector = new AsyncInspector(sign, {
              frameURL: instance.frameURL
            });
            observer.next(inspector);
            inspector.enable();
            return () => {
              inspector.disable();
            };
          })
        )
      );
  }),
  startWith(null),
  shareReplay(1)
);
latestInspector$.method = function(method) {
  return this.pipe(
    map(
      inspector =>
        function(...args) {
          if (inspector === null) {
            /* eslint-disable no-console */
            console.log("No inspector available");
            /* eslint-enable */
            return;
          }
          return inspector[method](...args);
        }
    )
  );
};

export default latestInspector$;
