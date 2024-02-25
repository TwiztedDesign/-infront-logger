require('winston-daily-rotate-file');
const {format, createLogger, transports, addColors} = require('winston');
const {inspect} = require('util');

const colors = {
	error: 'red',
	warn: 'yellow',
	info: 'green',
	http: 'magenta',
	debug: 'white',
}
addColors(colors);

const OPTIONS = {
	dirname : 'logs',
	levels : {
		error: 0,
		warn: 1,
		info: 2,
		http: 3,
		debug: 4,
	},
	level : 'info',
	zippedArchive: false,
	dateFormat : 'YYYY-MM-DD HH:mm:ss:ms',
	maxFiles: 2,
	maxFileSize: '30m',
	filename : 'logs.log',
	errorFilename : 'error.log',
	console : true,
	exclude : [],
	createSymlink: true,
	symlinkName: 'logs.log',
}

function errorToJSON(error) {
	// Extracting relevant properties from the error object
	const { message, name, stack } = error;

	// Creating a plain JSON object
	return {
		message,
		name,
		stack
	};
}

function fileFormatter(options){
	return format.combine(
		// format.errors({stack: true}),
		{
			transform: (info) => {
				const args = [info.message, ...(info[Symbol.for('splat')] || [])];
				info.message = args.filter(Boolean).map(arg => {
					if(arg instanceof Error){
						return errorToJSON(arg);
					}
					return arg;
				});

				const msg = args.map(arg => {
					if (typeof arg == 'object')
						return inspect(arg, {compact: false, depth: Infinity});
					return arg;
				}).join(' ');

				info[Symbol.for('message')] = `${info[Symbol.for('level')]}: ${msg}${info.stack ? ' ' + info.stack : ''}`;

				if(options.exclude.some(string => msg.includes(string))) return null;

				return info;
			}
		},
		format.timestamp({ format: options.dateFormat }),

		format.json()
	);
}
function consoleFormatter(options){
	return format.timestamp({ format: options.dateFormat }),
		{
			transform: (info) => {
				const args = [info.message, ...(info[Symbol.for('splat')] || [])];
				info.message = args;

				const msg = args.map(arg => {
					if (typeof arg == 'object')
						return inspect(arg, {compact: false, depth: Infinity});
					return arg;
				}).join(' ');

				// info[Symbol.for('message')] = `${info[Symbol.for('level')]}: ${msg}${info.stack ? ' ' + info.stack : ''}`;
				info[Symbol.for('message')] = `${msg}`;

				return info;
			}
		},

		format.colorize({ all: true })
}

function getFormatter(type, options){
	switch (type){
		case 'file':
			return fileFormatter(options);
		case 'access':
			break;
		case 'console':
			return consoleFormatter(options);
	}
}
function createTransport(options){
	let formatter = getFormatter(options.format, options);
	if(formatter) { options.format = formatter; } else { delete options.format; }
	return new transports.DailyRotateFile(options);
}
class Logger {
	constructor(options = {}) {
		this.options = {...OPTIONS, ...options};
		let trans = [
			createTransport({
				...this.options, filename : this.options.filename, symlinkName : this.options.filename
			}),
			createTransport({
				...this.options, filename : this.options.errorFilename, symlinkName : this.options.errorFilename, level : 'error',
			}),
		]
		if(options.console){
			trans.push(new transports.Console({
				format : getFormatter('console', this.options)
			}));
		}

		this.logger = createLogger({

			level: this.options.level,
			levels : this.options.levels,
			exitOnError : false,
			// format,
			transports : trans,
			exceptionHandlers: [
				new transports.Console(),
				new transports.File({ filename: `${this.options.dirname}/${this.options.errorFilename}`})
			]
		});
	}
}

export {
	Logger,
};



