# sketch-extract
Extracts text from a sketch file

## CLI Usage
Without global install:
```bash
npx sketch-extract ./myfile.sketch
```

With global install:
```bash
npm i -g sketch-extract
npx sketch-extract ./myfile.sketch
```

## CLI Options:
```
node ./sketch-extract-cli.js [sketchFile1] [sketchFile2] [-o [output file path]] [-d [delimeter]] [-v]

Usage examples:
    node ./test.sketch
    node ./test.sketch -o ./output/
    node ./test.sketch -d _
    node ./test1.sketch ./test2.sketch -o ./output/ -d _ -v

-o | output file path		| Default: ./
-d | layer name delimeter	| Default: ::
-v | verbose logging		| Default: false

```

### JS usage
```bash
npm i sketch-extract
```

```javascript
const SketchExtract = require("sketch-extract");

//All callbacks are optional
(async function(){
	let sketchExtract = new SketchExtract({
		sketchFiles:["myfile.sketch"]
	});

	//Returns an array of pages {name:PAGE_NAME, data:[EXTRACTED_DATA]}
	//Each page has a name and an array of extracted data
	let extractedPages = await sketchExtract.run();

	//TODO: Do something with extracted page data
})();
```

#### Full API
```javascript
(async function(){
	const sketchExtract = new SketchExtract({
		debug:true, //Exposes private methods and constants via public instance
		sketchFiles:["myfile.sketch"],
		layerNameDelimeter:"::"
	});
	sketchExtract.addFile("myfile2.sketch");

	let extractedPages = await sketchExtract.run();
})();
```