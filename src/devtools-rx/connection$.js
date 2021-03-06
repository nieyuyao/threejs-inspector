import { publish, refCount, map } from "rxjs/operators";
import fromChromeEvent from "./fromChromeEvent";
import Connection from "./Connection";
let autoIncrement = 1;

export default fromChromeEvent(chrome.runtime.onConnect).pipe(
  map(port => {
    const connection = new Connection(port);
    connection.id = autoIncrement;
    autoIncrement++;
    if (port.sender && port.sender.tab) {
      connection.tabId = port.sender.tab.id;
    }
    return connection;
  }),
  //不会发送任何值直到connect()被调用
  publish(),
  //相当于调用connect()
  refCount()
);
