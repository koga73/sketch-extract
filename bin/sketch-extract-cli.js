#!/usr/bin/env node
/*
* sketch-extract v1.0.1 Copyright (c) 2020 AJ Savino
* https://github.com/koga73/sketch-extract
* MIT License
*/
const fs = require("fs");

const SketchExtract = require("../sketch-extract.js");

module.exports = (function(params){
	var _instance = null;

	const _consts = {
		NAME:"Sketch Extract",
		VERSION:"1.0.1",

		DEFAULT_OUTPUT_PATH:"./output/" //If not specified
	};

	const _vars = {
		outputPath:_consts.DEFAULT_OUTPUT_PATH,

		_sketchExtract:null
	};

	const _methods = {
		init:function(){
			process.on('uncaughtException', _methods._handler_uncaught_exception);

			//Create Sketch Extract instance
			_vars._sketchExtract = new SketchExtract();

			//Parse args
			let args = process.argv;
			let argsLen = args.length;
			if (argsLen < 2){
				_methods._displayCommands();
				process.exit(0);
			}

			//Start at arg 2 to skip node.exe and executing script
			for (let i = 2; i < argsLen; i++){
				let arg = args[i];
				switch (arg){
					case "-o": //Output path
						arg = _methods._getArg(i + 1);
						if (arg){
							i++;
							_instance.outputPath = arg;
						}
						break;

					case "-d": //Delimeter
						arg = _methods._getArg(i + 1);
						if (arg){
							i++;
							_vars._sketchExtract.layerNameDelimeter = arg;
						}
						break;

					case "-v": //Verbose
						_vars._sketchExtract.debug = true;
						break;

					default:
						//If does not start with hyphen then treat as sketch file
						arg = _methods._getArg(i);
						if (arg){
							_vars._sketchExtract.addFile(arg);
						}
						break;
				}
			}
		},

		destroy:function(){
			if (_vars._sketchExtract){
				_vars._sketchExtract = null;
			}

			process.removeListener('uncaughtException', _methods._handler_uncaught_exception);
		},

		run:async function(){
			try {
				//Make directory
				if (fs.existsSync(_instance.outputPath)){
					if (!fs.lstatSync(_instance.outputPath).isDirectory()){
						throw new Error("Output path is not a directory");
					}
				} else {
					console.log("MAKING DIRECTORY:", _instance.outputPath);
					fs.mkdirSync(_instance.outputPath);
				}

				//RUN
				let pages = await _vars._sketchExtract.run();

				//Loop through output pages
				let pagesLen = pages.length;
				for (let i = 0; i < pagesLen; i++){
					let page = pages[i];
					let filePath = _instance.outputPath + page.name.replace(/[\/\\]/g, "-") + ".json";
					console.log(filePath);

					//Write JSON file per-page
					console.log("WRITING FILE:", filePath);
					await _methods._writeFile(filePath, JSON.stringify(page.data, null, "\t"));
					console.log("SUCCESS!", filePath);
				}
				console.log("COMPLETE!");
			} catch (err){
				console.error(err);
				_instance.exit(1);
			}
			process.exit();
		},

		exit:function(){
			_instance.destroy();
			process.exit(0);
		},

		_displayCommands:function(){
			console.log();
			console.log(_consts.NAME + " " + _consts.VERSION);
			console.log();
			console.log("node ./sketch-extract-cli.js [sketchFile1] [sketchFile2] [-o [output file path]] [-d [delimeter]] [-v]");
			console.log();
			console.log("Usage examples:");
			console.log("    node ./test.sketch");
			console.log("    node ./test.sketch -o ./output/");
			console.log("    node ./test.sketch -d _");
			console.log("    node ./test1.sketch ./test2.sketch -o ./output/ -d _ -v");
			console.log();
			console.log("-o | output file path		| Default: ./");
			console.log("-d | layer name delimeter	| Default: ::");
			console.log("-v | verbose logging		| Default: false");
			console.log();
		},

		_getArg:function(argIndex){
			if (argIndex >= process.argv.length){
				return null;
			}
			let arg = process.argv[argIndex];
			//If does not start with hyphen then return arg
			if (!/^-/.test(arg)){
				return arg;
			}
			return null;
		},

		_handler_uncaught_exception:function(error){
			console.error("UNCAUGHT FATAL ERROR:\n", error);
			process.exit(1); //Uncaught fatal error
		},

		_writeFile:function(filePath, strData){
			return new Promise((resolve, reject) => {
				fs.writeFile(filePath, strData, (err) => {
					if (err){
						reject(err);
					} else {
						resolve(filePath);
					}
				});
			});
		}
	};

	_instance = {
		outputPath:_vars.outputPath,

		init:_methods.init,
		destroy:_methods.destroy,
		run:_methods.run,
		exit:_methods.exit
	};
	for (let param in params){
		_instance[param] = params[param];
	}
	_instance.init();
	_instance.run();
	return _instance;
})();