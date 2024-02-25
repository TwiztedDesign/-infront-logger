import BaseLogger from "./baseLogger";

const MAX_BODY_LENGTH = 128;
const redact = (data, ...sensitiveKeysList) => {
	if (typeof data === 'object' && data !== null && !data?.constructor?.name?.startsWith('model')) {
		if (Array.isArray(data)) {
			return data.map(item => redact(item, ...sensitiveKeysList));
		}

		const redactedData = {};

		for (const key in data) {
			if(data?.hasOwnProperty(key)){
				if (sensitiveKeysList.includes(key)) {
					redactedData[key] = '*****'; // replace password with *
				} else {
					// Recursively redact sensitive keys within nested objects
					redactedData[key] = redact(data[key], ...sensitiveKeysList);
				}
			}
		}

		return redactedData;
	} else {
		return data;
	}
};
const pick = (obj, ...keys) => Object.fromEntries(
	keys
		.filter(key => key in obj)
		.map(key => [key, obj[key]])
);
const trim = (data, length) => {
	try{
		let str = JSON.stringify(data)
		if(str.length > length){
			return str.substring(0, length) + "... [TRIMMED]";
		}
		return data;
	} catch(err){
		return '';
	}

}
const omit = (obj, ...keys) => {
	const result = { ...obj };
	keys.forEach(function(prop) {
		delete result[prop];
	});
	return result;
}
function formatBytes(bytes, decimals = 2) {
	if (!+bytes) return '0 Bytes'

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))}${sizes[i]}`
}
class HTTPLogger extends BaseLogger{
	constructor(startTime) {
		super('http');
		this.logger = httpLogger.child({component : 'http'});
		this.startTime = startTime;
	}
	request(req){
		this.session(req.sessionID);
		this.req = req;
		return this;
	}
	response(res){
		this.res = res;
		return this;
	}
	body(data){
		this.data = data;
		return this;
	}
	_prepare(){
		let req = this.req;
		let res = this.res;
		let body = this.data;
		this.ctx.request = {
			headers: redact(req.headers, 'cookie'),
			host: req.headers.host,
			baseUrl: req.baseUrl,
			url: req.originalUrl || req.url,
			method: req.method,
			body: redact(req.body, 'password'),
			params: req?.params,
			query: redact(req?.query, 'password'),
			clientIP: req?.headers['x-forwarded-for']?.split(',')[0] ?? req?.socket.remoteAddress,
		};
		this.ctx.response = {
			headers: omit(res.getHeaders(), 'set-cookie', 'x-powered-by'),
			statusCode: res.statusCode,
			body : trim(body, MAX_BODY_LENGTH)
		};
		this.ctx.responseTimeMs = Date.now() - this.startTime;
		this.ctx.responseSizeBytes = this.data? JSON.stringify(this.data).length : 0;
		this.ctx.user = req?.user?.id;
	}
	_message(msg){
		let remoteAddress           = this.req.ip || this.req._remoteAddress || (this.req.connection && this.req.connection.remoteAddress) || undefined;
		let ip                      = this.ctx.request.clientIP;
		let method                  = this.ctx.request.method;
		let url                     = this.ctx.request.url;
		let statusCode              = this.ctx.response.statusCode;
		let responseTimeMs   = this.ctx.responseTimeMs + 'ms';
		let responseSize     = formatBytes(JSON.stringify(this.data)?.length);
		return `${method} ${url} ${statusCode} ${responseTimeMs} ${responseSize} ${ip} ${remoteAddress} ${msg || ''}`;
	}

	success(req ,res, body){
		if(req) this.request(req);
		if(res) this.response(res);
		if(body) this.body(body);

		this._prepare();

		super.info(this._message());
	}
	error(err){
		this._prepare();
		super.error(this._message(err));
	}
}

module.exports = HTTPLogger;
