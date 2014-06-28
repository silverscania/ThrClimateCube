/** 
 *	@class JSONReader
 *	
 *	Modified existing loading code from THREE.js
 *  modified to read json array and only do callback if successful
 *	
 *	@param url - file to read
 *	@param callback - function to call on successful read, returns json array
 **/
var JSONReader = function (url, callback){

	var xhr = new XMLHttpRequest();
	var returnString = "";
	
	xhr.onreadystatechange = function() {
	
		if ( xhr.readyState == 4 ) {

			if ( xhr.status == 200 || xhr.status == 0 ) {
				//returnString = xhr.responseText;
				if(xhr.responseText.length > 1)
				{
					var obj = JSON.parse(xhr.responseText);

					callback(obj);
				}
			} else {
				console.error( "Couldn't load [" + url + "] [" + xhr.status + "]" );
			}
		} 
	};
	
	xhr.open( "GET", url, true );
	if ( xhr.overrideMimeType ) xhr.overrideMimeType( "text/plain; charset=x-user-defined" );
	xhr.setRequestHeader( "Content-Type", "text/plain" );
	xhr.send( null );
	
	return returnString;	
};
JSONReader.prototype.constructor = JSONReader;



/** 
 *	@class FileReader
 *	
 *	Existing loading code from THREE.js
 *	
 *	@param url - file to read
 *	@param callback - function to call on successful read, returns string
 **/
var FileReader = function (url, callback){

	var xhr = new XMLHttpRequest();
	var returnString = "";
	
	xhr.onreadystatechange = function() {
	
		if ( xhr.readyState == 4 ) {

			if ( xhr.status == 200 || xhr.status == 0 ) {

				//returnString = xhr.responseText;
				if(xhr.responseText.length > 1)
				{
					callback(xhr.responseText);
				}

			} else {

				console.error( "Couldn't load [" + url + "] [" + xhr.status + "]" );

			}

		} 
	
	};
	
	xhr.open( "GET", url, true );
	if ( xhr.overrideMimeType ) xhr.overrideMimeType( "text/plain; charset=x-user-defined" );
	xhr.setRequestHeader( "Content-Type", "text/plain" );
	xhr.send( null );
	
	return returnString;	
};
FileReader.prototype.constructor = FileReader;
