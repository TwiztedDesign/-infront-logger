(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.logger = {}));
})(this, function(exports2) {
  "use strict";
  require("winston-daily-rotate-file");
  const { format, createLogger, transports, addColors } = require("winston");
  const { inspect } = require("util");
  const MAX_FILE_SIZE = "30m";
  const MAX_FILES = 2;
  const colors = {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "white"
  };
  addColors(colors);
  const OPTIONS = {
    dirname: "logs",
    levels: {
      error: 0,
      warn: 1,
      info: 2,
      http: 3,
      debug: 4
    },
    level: "info",
    zippedArchive: false,
    dateFormat: "YYYY-MM-DD HH:mm:ss:ms",
    maxFiles: MAX_FILES,
    maxFileSize: MAX_FILE_SIZE,
    filename: "logs.log",
    errorFilename: "error.log",
    console: true,
    exclude: [],
    createSymlink: true,
    symlinkName: "logs.log"
  };
  function errorToJSON(error) {
    const { message, name, stack } = error;
    const errorJSON = {
      message,
      name,
      stack
    };
    return errorJSON;
  }
  function fileFormatter(options) {
    return format.combine(
      // format.errors({stack: true}),
      {
        transform: (info) => {
          const args = [info.message, ...info[Symbol.for("splat")] || []];
          info.message = args.filter(Boolean).map((arg) => {
            if (arg instanceof Error) {
              return errorToJSON(arg);
            }
            return arg;
          });
          const msg = args.map((arg) => {
            if (typeof arg == "object")
              return inspect(arg, { compact: false, depth: Infinity });
            return arg;
          }).join(" ");
          info[Symbol.for("message")] = `${info[Symbol.for("level")]}: ${msg}${info.stack ? " " + info.stack : ""}`;
          if (options.exclude.some((string) => msg.includes(string)))
            return null;
          return info;
        }
      },
      format.timestamp({ format: options.dateFormat }),
      format.json()
    );
  }
  function consoleFormatter(options) {
    return format.timestamp({ format: options.dateFormat }), format.colorize({ all: true });
  }
  function getFormatter(type, options) {
    switch (type) {
      case "file":
        return fileFormatter(options);
      case "access":
        break;
      case "console":
        return consoleFormatter(optipns);
    }
  }
  function createTransport(options) {
    let formatter = getFormatter(options.format, options);
    if (formatter) {
      options.format = formatter;
    } else {
      delete options.format;
    }
    return new transports.DailyRotateFile(options);
  }
  class Logger {
    constructor(options = {}) {
      this.options = { ...OPTIONS, ...options };
      let transports1 = [
        createTransport({
          ...this.options,
          filename: this.options.filename,
          symlinkName: this.options.filename
        }),
        createTransport({
          ...this.options,
          filename: this.options.errorFilename,
          symlinkName: this.options.errorFilename,
          level: "error"
        })
      ];
      if (options.console) {
        transports1.push(new transports.Console({
          format: getFormatter("console", this.options)
        }));
      }
      this.logger = createLogger({
        level: this.options.level,
        levels: this.options.levels,
        exitOnError: false,
        // format,
        transports: transports1,
        exceptionHandlers: [
          new transports.Console(),
          new transports.File({ filename: `${this.options.dirname}/${this.options.errorFilename}` })
        ]
      });
    }
  }
  const v8 = require("v8");
  function toFixedNumber(num, digits, base) {
    const pow = Math.pow(base ?? 10, digits);
    return Math.round(num * pow) / pow;
  }
  function bytesToMB(b) {
    return toFixedNumber(b / 1024 / 1024, 2, 10);
  }
  function stats() {
    try {
      let h = v8.getHeapStatistics();
      return {
        "total_heap_size": bytesToMB(h.total_heap_size),
        "total_heap_size_executable": bytesToMB(h.total_heap_size_executable),
        "total_physical_size": bytesToMB(h.total_physical_size),
        "total_available_size": bytesToMB(h.total_available_size),
        "used_heap_size": bytesToMB(h.used_heap_size),
        "heap_size_limit": bytesToMB(h.heap_size_limit),
        "malloced_memory": bytesToMB(h.malloced_memory),
        "peak_malloced_memory": bytesToMB(h.peak_malloced_memory),
        "does_zap_garbage": h.does_zap_garbage,
        "number_of_native_contexts": h.number_of_native_contexts,
        "number_of_detached_contexts": h.number_of_detached_contexts
      };
    } catch (err) {
      return {};
    }
  }
  class BaseLogger {
    constructor(group, options) {
      let l = new Logger(options);
      this.logger = l.logger.child({ component: group });
      this.ctx = {};
      this.startTime = Date.now();
      this.absaluteStartTime = Date.now();
    }
    session(id) {
      this.ctx.sessionID = id;
      return this;
    }
    log() {
      this.logger.info(...arguments, this.ctx);
      this._stopMemProfile();
    }
    info() {
      this.logger.info(...arguments, this.ctx);
      this._stopMemProfile();
    }
    error() {
      this.logger.error(...arguments, this.ctx);
      this._stopMemProfile();
    }
    profile(action, options = {}) {
      this.ctx.profiler = this.ctx.profiler || {};
      if (action) {
        let startTime = this.ctx.profiler[action] ? Date.now() - this.ctx.profiler[action] : this.startTime;
        this.ctx.profiler[action] = Date.now() - startTime;
      }
      this.ctx.profiler.totalTime = Date.now() - this.absaluteStartTime;
      if (!options.continue)
        this.startTime = Date.now();
      return this;
    }
    _stopMemProfile() {
      if (this.memProfileInterval)
        clearInterval(this.memProfileInterval);
    }
    profileMem(options = {}) {
      this.ctx.maxMemory = this.ctx.maxMemory || 0;
      this.ctx.memoryStats = this.ctx.memoryStats || [];
      this.ctx.memoryUsage = this.ctx.memoryUsage || [];
      this.ctx.memoryStatsIntervalMS = options.interval || 1e3;
      this._stopMemProfile();
      this.memProfileInterval = setInterval(() => {
        let mem = stats();
        this.ctx.memoryStats.push(mem);
        this.ctx.memoryUsage.push(mem.used_heap_size);
        if (mem.used_heap_size > this.ctx.maxMemory) {
          this.ctx.maxMemory = mem.used_heap_size;
        }
      }, this.ctx.memoryStatsIntervalMS);
      return this;
    }
    context(key, value) {
      this.ctx[key] = value;
      return this;
    }
  }
  const log = () => {
    let logger = new BaseLogger("test");
    logger.context("ctx1", "val1").log("this is a log message");
  };
  exports2.log = log;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
