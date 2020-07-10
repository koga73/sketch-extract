/*
* sketch-extract v1.0.1 Copyright (c) 2020 AJ Savino
* https://github.com/koga73/sketch-extract
* MIT License
*/
const StreamZip = require("node-stream-zip");

module.exports = function(params){
	var _instance = null;

	const _consts = {
		REGEX_ENTRY_PAGE: /^pages\//,

		DEFAULT_LAYER_NAME_DELIMETER: "::"
	};

	var _vars = {
		debug:false,
		sketchFiles:[], //Files specified by user
		layerNameDelimeter:_consts.DEFAULT_LAYER_NAME_DELIMETER
	};

	var _methods = {
		addFile:function(sketchFilePath){
			if (_instance.debug){
				console.log("ADD FILE:", sketchFilePath);
			}

			_instance.sketchFiles.push(sketchFilePath);
		},

		run:function(){
			let sketchFiles = _instance.sketchFiles;
			let sketchFilesLen = sketchFiles.length;

			//Make sure we have minimum parameters specified
			if (!sketchFilesLen){
				throw new Error("Must specify at least one sketch file");
			}

			return new Promise((resolve, reject) => {
				let pages = [];

				for (let i = 0; i < sketchFilesLen; i++){
					let sketchFile = sketchFiles[i];

					let zip = new StreamZip({
						file:sketchFile,
						storeEntries:true
					});
					zip.on("error", reject);
					zip.on("ready", async () => {
						for (const entry of Object.values(zip.entries())){
							if (_consts.REGEX_ENTRY_PAGE.test(entry.name)){
								const desc = entry.isDirectory ? "directory" : `${entry.size} bytes`;
								if (_instance.debug){
									console.log(`Entry ${entry.name}: ${desc}`);
								}

								try {
									let pageJsonBuf = await _methods._readEntry(zip, entry);
									let pageJson = JSON.parse(pageJsonBuf.toString());
									let pageName = pageJson["name"];

									//Flatten layers
									let layers = _methods._flattenLayers(pageJson["layers"], pageName);

									//Simplify layers
									let simpleLayers = layers.map((layer) => {
										return {
											"__rawName":layer["__rawName"],
											"name":layer["name"],
											"_class":layer["_class"],
											"attributedString":layer["attributedString"]
										};
									});

									//Filter only text
									let textLayers = simpleLayers.filter((layer) => layer["_class"] === "text");

									//Extract text
									//NOTE: If we want to we can also extract text attributes such as font-family, font-size, color, etc
									let textLayersLen = textLayers.length;
									let extractedText = [];
									for (let j = 0; j < textLayersLen; j++){
										let layer = textLayers[j];
										extractedTextLayer = {
											"layerName":layer["__rawName"],
											"name":layer["name"],
											"value":layer["attributedString"]["string"]
										};

										if (_instance.debug){
											console.log("TEXT:", extractedTextLayer.value);
										}
										extractedText.push(extractedTextLayer);
									}
									pages.push({
										name:pageName,
										data:extractedText
									});
								} catch (err){
									reject(err);
								}
							}
						}

						zip.close();

						resolve(pages);
					});
				}
			});
		},

		_readEntry:function(zip, entry){
			return new Promise((resolve, reject) => {
				let buf = Buffer.alloc(entry.size);
				zip.stream(entry.name, (err, stm) => {
					if (err){
						reject(err);
					}
					let index = 0;
					stm.on("data", (data) => {
						let dataLen = data.length;
						data.copy(buf, index, 0, dataLen);
						index += dataLen;
					});
					stm.on("end", () => resolve(buf));
					stm.on("error", (err) => reject(err));
				});
			});
		},

		_flattenLayers:function(layers, parentName){
			let flattenedLayers = [];
			let layersLen = layers.length;
			for (let i = 0; i < layersLen; i++){
				let layer = layers[i];
				let layerName = layer["name"];
				let recursiveName = parentName + _instance.layerNameDelimeter + layerName;

				//Add data
				let layerData = Object.assign({}, layer, {
					"__rawName": layerName,
					"name":recursiveName
				});
				delete layerData["layers"];
				flattenedLayers.push(layerData);

				//Recurse
				if ("layers" in layer){
					flattenedLayers = flattenedLayers.concat(_methods._flattenLayers(layer["layers"], recursiveName));
				}
			}
			return flattenedLayers;
		}
	};

	_instance = {
		debug:_vars.debug,
		sketchFiles:_vars.sketchFiles,
		layerNameDelimeter:_vars.layerNameDelimeter,

		addFile:_methods.addFile,
		run:_methods.run,
	};
	for (let param in params){
		_instance[param] = params[param];
	}
	//Expose private proerties for unit tests and debug
	if (_instance.debug){
		_instance._consts = _consts;
		_instance._vars = _vars;
		_instance._methods = _methods;
	}
	return _instance;
};