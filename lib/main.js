import BaseLogger from "./baseLogger";



const log = ()=> {
	let logger = new BaseLogger("test");
	logger.context("ctx1", "val1").log("this is a log message");
}

export {
	log
}
