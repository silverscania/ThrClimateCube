
/**
 *	Global utility function to wrap
 *	text.
 *
 *	@param text - input text string
 *	@param width - maximum width in pixels
 *	@param context - the context that will be used
 *						for drawing. For text font, size etc.
 *
 **/
function wordWrap(text, width, context){
	//split into words
	var words = text.split(" ");
	
	//array of strings for lines
	var lines = new Array();
	var line = 0;
	lines[0] = "";
	
	//while words is less than max width add to output line width 
	for(var i = 0; i < words.length; ++i)
	{
		//if adding the next word on fits, then add it
		var testWidth = context.measureText(lines[line] + words[i]);
		if(testWidth.width < width)
		{
			lines[line] += words[i] + " ";
		}
		else if( lines[line].length <= 0) //if the line is empty, and it still wont fit, then add it anyway as it wont fit anywhere else
		{
			lines[line] += words[i] + " ";
		}
		else //else go to next line
		{
			line++;
			lines[line] = words[i] + " ";
		}
	}
	
	return lines;
}