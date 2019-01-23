/* eslint-disable import/no-mutable-exports */
let connection = null;
const Connection = require("../devtools-rx/Connection").default;
connection = new Connection("three_panel");
export default connection;
