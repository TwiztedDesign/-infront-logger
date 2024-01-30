(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.logger = {}));
})(this, function(exports2) {
  "use strict";
  const log = () => {
    console.log("Hello world");
  };
  exports2.log = log;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
