PathFollower = function(path, meshFile, texture, duration, keyframes, onLoad){

	if(path && meshFile && texture)
	{
		var self = this;
	
		this.path = path;
		this.noPath = false; //does have a path
		this.placeOnPath = Math.random() * path.length;
		this.pathSpeed = 0.45;
		this.picked = false;
	
		this.acceleration = new THREE.Vector3(0, -13, 0);
		this.dampening = 1;
		this.velocity = new THREE.Vector3(0,0,0);
	
		AnimatedMesh.call(self, meshFile, texture, onLoad, duration, keyframes); 

		var callbackFileLoad = function(fileString){	
			var data = self.decodePathToArray(fileString);
			self.borderEdge = data.points; 
		}
		//read maya type file
		new FileReader("paths/Boundary.pt", callbackFileLoad);	
	}
};


PathFollower.prototype = new AnimatedMesh();
PathFollower.prototype.constructor = PathFollower;
PathFollower.prototype.supr = AnimatedMesh;


/**
 *	Call this when the person is picked up and under
 *  controll of the mouse
 *
 **/
PathFollower.prototype.setPicked = function(){

	this.picked = true;
	this.setDuration(200);
	this.noPath = true;
};

/**
 *	Call this when the car is dropped
 *	
 *	Sets appropriate flags and creates a path
 *  to follow to get back to the nearest point
 * 	on its path
 *
 **/
PathFollower.prototype.unsetPicked = function(){

	this.picked = false;
	this.setDuration(600);

	var pathPoint = this.path.getClosestPoint(this.position);	
	this.placeOnPath = pathPoint[0];

	this.src = this.position.clone();
	this.destination = pathPoint[1];
	this.destinationFraction = 0;
	this.destinationFractionInterval = this.pathSpeed / this.destination.distanceTo(this.position);
	
	var normal = new THREE.Vector3(0,0,1);
	var direction = this.src.clone().subSelf(this.destination);
	diretion = direction.normalize();
	
	this.rotation.y = Math.acos(normal.dot(direction));
	
	//flip depending on x direction
	if(this.src.x < this.destination.x)
			this.rotation.y = -this.rotation.y;
};

/**
 * 	Update function, moves things on path
 * 	Ignores path if picked flag is true
 *
 * 	@param currentTime - game time in milliseconds
 *	@param delta - time delta in seconds
 **/
PathFollower.prototype.update = function(currentTime, delta ) {

	//athFollower.prototype.supr.update.call(this, currentTime, delta);
	AnimatedMesh.prototype.update.call(this, currentTime, delta);
	if(!this.noPath)
	{
		this.placeOnPath += delta * this.pathSpeed;

		if(this.placeOnPath >= this.path.length)
		{
			this.placeOnPath -= this.path.length;
		}

		var positionAndRotation = this.path.getPlaceOnPath(this.placeOnPath);

		this.position = positionAndRotation[0];
		this.rotation.y = positionAndRotation[1];

	}
	else if( !this.picked )//no path and not picked, do fall
	{
		//bounce
		//velocity += acceleration * delta
		this.velocity.addSelf( this.acceleration.clone().multiplyScalar(delta) );	

		//position += velocity * delta
		this.position.addSelf( this.velocity.clone().multiplyScalar(delta) );

		if(this.position.y < 0 && !this.fellOffEdge)
		{
			if(!this.pointIsInPolygon(this.position))
			{
				this.fellOffEdge = true;
			}
			else
			{
				this.velocity.y = -this.velocity.y * .7;
				this.position.y = 0;
			}
		}
		else if(this.position.y < -50)
		{
			//return 1 to delete
			return true;
		}

		//walk towards this.destination
		var positionXZ = this.src.lerpSelf(this.destination, this.destinationFraction);
		this.destinationFraction += this.destinationFractionInterval * delta;
		if(this.destinationFraction >= 1)
		{
			this.position.y = 0;
			this.noPath = false;
		}

		this.position.x = positionXZ.x;
		this.position.z = positionXZ.z;	
	}	
	
	return false;
};


//http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
//http://snippets.dzone.com/posts/show/5295
PathFollower.prototype.pointIsInPolygon = function(pt){

	
	if(this.borderEdge)
	{
		for(var c = false, i = -1, l = this.borderEdge.length, j = l - 1; ++i < l; j = i)
			((this.borderEdge[i].z <= pt.z && pt.z < this.borderEdge[j].z) || (this.borderEdge[j].z <= pt.z && pt.z < this.borderEdge[i].z))
			&& (pt.x < (this.borderEdge[j].x - this.borderEdge[i].x) * (pt.z - this.borderEdge[i].z) / (this.borderEdge[j].z - this.borderEdge[i].z) + this.borderEdge[i].x)
			&& (c = !c);
			
		return c;
	}
  
  return true;
};


/**
 *	Given a string of floats separated by spaces,
 *	build an array of vectors
 *	@param pathString - string of floats
 **/
PathFollower.prototype.decodePathToArray = function(pathString){

	//regex from: http://www.textfixer.com/tutorials/javascript-line-breaks.php
	var pathStrings = pathString.replace(/(\r\n|\n|\r)/gm," ");
	pathStrings = pathStrings.split(" ");

	var pathArray = new Array();

	for(var i = 0; i < pathStrings.length; i += 3)
	{
		pathArray.push( {"x": parseFloat(pathStrings[i]),
				 "y": parseFloat(pathStrings[i+1]),
				"z" : parseFloat(pathStrings[i+2])}
			       );
	}		

	return {"points": pathArray};
};
