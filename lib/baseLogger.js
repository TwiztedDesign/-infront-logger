import {Logger} from "./logger";
import {stats} from "./memory";

class BaseLogger{
	constructor(component, options) {
		this.logger = (new Logger(options)).logger.child({component});
		this.ctx = {};
		this.startTime = Date.now();
		this.absaluteStartTime = Date.now();
	}

	session(id){
		this.ctx.sessionID = id; //usually set to req.sessionID
		return this;
	}
	log(){
		this.logger.info(...arguments, this.ctx);
		this._stopMemProfile();
	}
	info(){
		this.logger.info(...arguments, this.ctx);
		this._stopMemProfile();
	}
	error(){
		this.logger.error(...arguments, this.ctx);
		this._stopMemProfile();
	}
	profile(action, options = {}){
		this.ctx.profiler = this.ctx.profiler || {};
		if(action){
			let startTime = this.ctx.profiler[action]? Date.now() - this.ctx.profiler[action] : this.startTime;
			this.ctx.profiler[action] = Date.now() - startTime;
		}
		this.ctx.profiler.totalTime = Date.now() - this.absaluteStartTime;
		if(!options.continue) this.startTime = Date.now();
		return this;
	}

	_stopMemProfile(){
		if(this.memProfileInterval) clearInterval(this.memProfileInterval);
	}
	profileMem(options = {}){
		this.ctx.maxMemory = this.ctx.maxMemory || 0;
		this.ctx.memoryStats = this.ctx.memoryStats || [];
		this.ctx.memoryUsage = this.ctx.memoryUsage || [];
		this.ctx.memoryStatsIntervalMS = options.interval || 1000;
		this._stopMemProfile();
		this.memProfileInterval = setInterval(() => {
			let mem = stats();
			this.ctx.memoryStats.push(mem);
			this.ctx.memoryUsage.push(mem.used_heap_size);
			if(mem.used_heap_size > this.ctx.maxMemory){
				this.ctx.maxMemory = mem.used_heap_size;
			}
		}, this.ctx.memoryStatsIntervalMS);
		return this;
	}

	context(key, value){
		this.ctx[key] = value;
		return this;
	}
}

export default BaseLogger;
