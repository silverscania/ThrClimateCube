/** 
 *	@class Car
 *	
 *	Car that drives on a path, inherits from THREE.Mesh
 *	Is pickable
 *	@param path - path to follow
 *	@param onLoad - on mesh load callback
 *	@inherits THREE.Mesh
 **/

Car = function(path, onLoad){

	var self = this;

	//this.path = path;
	//this.noPath = false; //does have a path
	//this.placeOnPath = Math.random() * path.length;
	//this.pathSpeed = 1.5;
	//this.picked = false;

	//this.acceleration = new THREE.Vector3(0, -13, 0);
	//this.dampening = 1;
	//this.velocity = new THREE.Vector3(0,0,0);
	
	this.wheelRotation = 0;
	this.wheels = new Array();
	
	this.wheels.push(new THREE.Mesh(new THREE.CubeGeometry( .25, .25, .05, 1, 1, 1),new THREE.MeshLambertMaterial({color: 0x222222}) ));
	this.wheels[this.wheels.length-1].position.set(0.325, 0, -0.171);
	
	this.wheels.push(new THREE.Mesh(new THREE.CubeGeometry( .25, .25, .05, 1, 1, 1),new THREE.MeshLambertMaterial({color: 0x222222}) ));
	this.wheels[this.wheels.length-1].position.set(0.325, 0, 0.177);
	
	this.wheels.push(new THREE.Mesh(new THREE.CubeGeometry( .25, .25, .05, 1, 1, 1),new THREE.MeshLambertMaterial({color: 0x222222}) ));
	this.wheels[this.wheels.length-1].position.set(-0.291, 0, 0.179);
	
	this.wheels.push(new THREE.Mesh(new THREE.CubeGeometry( .25, .25, .05, 1, 1, 1),new THREE.MeshLambertMaterial({color: 0x222222}) ));
	this.wheels[this.wheels.length-1].position.set(-.291, 0, -0.177);
	

	
	var mat = new THREE.MeshLambertMaterial();
	var rndColor = new THREE.Color();
	rndColor.setHSV(Math.random(), 0.7, .9);
	mat.color = rndColor;
	
	var createSubObject = function(){
		for(i in self.wheels)
		{
			self.add(self.wheels[i]);
		}		
		onLoad(self);
	};
	
	PathFollower.call(self, path, "objs/Car/Car.js", mat, 0, 0, createSubObject); //
	this.pathSpeed = 1.5;
	
	//loader.load( "objs/Car/Car.js", function( geometry ) { createMesh( geometry) } );
};


Car.prototype = new PathFollower();
Car.prototype.constructor = Car
//Car.prototype.supr = AnimatedMesh.prototype;


/**
 *	Call this when the person is picked up and under
 *  controll of the mouse
 *
 **/
Car.prototype.setPicked = function(){

	PathFollower.prototype.setPicked.call(this);
	//this.setDuration(200);

};

/**
 *	Call this when the car is dropped
 *	
 *	Sets appropriate flags and creates a path
 *  to follow to get back to the nearest point
 * 	on its path
 *
 **/
Car.prototype.unsetPicked = function(){

	PathFollower.prototype.unsetPicked.call(this);

	this.rotation.y += Math.PI / 2;
	//this.setDuration(600);
};

/**
 * 	Update function, moves things on path
 * 	Ignores path if picked flag is true
 *
 * 	@param currentTime - game time in milliseconds
 *	@param delta - time delta in seconds
 **/
Car.prototype.update = function(currentTime, delta ) {

	var retVal = PathFollower.prototype.update.call(this, currentTime, delta);
	
	this.wheelRotation += delta * -5;
	
	for(i in this.wheels)
	{
		this.wheels[i].rotation.z = this.wheelRotation;
	}
	
	//if not picked do bobbing
	if(!this.noPath && !this.fellOffEdge)
	{
		//find 90 degree part
		var mod = -(this.wheelRotation * 2) % Math.PI/2;
		 
		 //less than 45 degrees
		if(mod < Math.PI/4)
		{
			//pos = radius of wheel / cos(angle)
			this.position.y = 0.25 / Math.cos(mod);
		}
		else
		{
			this.position.y = (0.25 / Math.cos((Math.PI/2) - mod));
		}
		
		this.rotation.y += Math.PI / 2;
	}
	 
	return retVal;

};
