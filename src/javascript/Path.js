/** 
 *	@class Path
 *	
 *	Set of points and directions with functions
 *	for lerping between them. And a function
 *	to decode file format from maya
 *	
 *	@param filename - file to read
 *	@param onLoad - function to call on successful read
 **/
Path = function(fileName, onLoad){

	var self = this;

	//array will contain arrays with [distance, position, rotation]
	this.points = null;
	this.length = 0;

	var callbackFileLoad = function(fileString){
		//console.log(data.points);		
		var data = self.decodePathToArray(fileString);
		
		self.points = new Array();

		var newVec = new THREE.Vector3(data.points[0][0], 
								data.points[0][1], 
								data.points[0][2]);
	
		self.points[0] = new Array(0, newVec
						);

		//j is index in this array, i is index in JSON array
		var j = 1;

		//+=3 as there are two controll points either side of point
		for(var i = 3; i < data.points.length; i += 3)
		{
				
			var newVec = new THREE.Vector3(data.points[i][0], 
								data.points[i][1], 
								data.points[i][2]);

			//calculate vector from this to previous
			var angleVector = newVec.clone();        
			angleVector.subSelf(self.points[j-1][1]); //angle vector = newVec - self.points[-1]
			angleVector = angleVector.normalize();

			var rotation = Math.acos(angleVector.dot(new THREE.Vector3(0,0,1)));

			//flip rotation depending on whether this vector is > or < previous in Z
			if(newVec.x < self.points[j-1][1].x)
				rotation = -rotation;

			self.length += self.points[j-1][1].distanceTo(newVec);

			self.points[j-1][2] = rotation + Math.PI; //set rotation on previous element
			self.points[j] = new Array(self.length, newVec);

			j++;
		}

		//add first point to join up loop
		newVec = new THREE.Vector3(data.points[0][0], 
						data.points[0][1], 
						data.points[0][2]);

		//calculate vector from this to previous
		var angleVector = newVec.clone();        
		angleVector.subSelf(self.points[j-1][1]); //angle vector = newVec - self.points[-1]
		angleVector = angleVector.normalize();

		var rotation = Math.acos(angleVector.dot(new THREE.Vector3(0,0,1)));

		//flip rotation depending on whether this vector is > or < previous in Z
		if(newVec.x < self.points[j-1][1].x)
			rotation = -rotation;

		self.length += self.points[j-1][1].distanceTo(newVec);

		self.points[j-1][2] = rotation + Math.PI; //set rotation on previous element
		self.points[j] = new Array(self.length, newVec);

		onLoad(self);
	}
		
		
	//read maya type file
	new FileReader(fileName, callbackFileLoad);	
};


Path.prototype.constructor = Path;

/**
 *	returns and array [position, rotation] given
 *	a point on the path
 *
 *	@param distance - from 0 to the total length of the path
 *
 **/
Path.prototype.getPlaceOnPath = function(distance){

	if(this.points)
	{
		for(var i = this.points.length-2; i >= 0; --i)
		{
			//get current segment
			if(distance > this.points[i][0])
			{
				var alpha = distance - this.points[i][0];
				alpha /= this.points[i+1][0] - this.points[i][0] ;

				return [this.points[i][1].lerpSelf(this.points[i+1][1], alpha),  //position
					this.points[i][2] //rotation
					];	 
			}
		}

	}

	//failed
	return [new THREE.Vector3(0,0,0), 0];
};

/**
 *	Returns closest point in path to a given vector.
 *
 *	@param inPos - a vector to search from
 *
 **/
Path.prototype.getClosestPoint = function(inPos){

	var nearestPoint = [9999999, 0];

	for(var i = 0; i < this.points.length; ++i)
	{
		var distSq = this.points[i][1].distanceToSquared(inPos);

		if(distSq < nearestPoint[0])
		{
			nearestPoint[0] = distSq;
			nearestPoint[1] = i;
		}
	}

	return this.points[nearestPoint[1]];
};

/**
 *	Given a string of floats separated by spaces,
 *	build an array of vectors
 *	@param pathString - string of floats
 **/
Path.prototype.decodePathToArray = function(pathString){

	//regex from: http://www.textfixer.com/tutorials/javascript-line-breaks.php
	var pathStrings = pathString.replace(/(\r\n|\n|\r)/gm," ");
	pathStrings = pathStrings.split(" ");

	var pathArray = new Array();

	for(var i = 0; i < pathStrings.length; i += 3)
	{
		pathArray.push( [parseFloat(pathStrings[i]),
				 parseFloat(pathStrings[i+1]),
				 parseFloat(pathStrings[i+2]) ]
			       );
	}		

	return {"points": pathArray};
};

