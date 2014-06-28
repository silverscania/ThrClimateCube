/** 
 *	@class Pedestrian
 *	
 *	Man that walks on a path, inherits from AnimatedMesh
 *	Is pickable. Turns into a steak when dropped into a 
 *	chimney.
 *
 *	todo: make car and pedestrian both inherit from a path
 *	following pickable type
 *	
 *	@param path - path to follow
 *	@param onLoad - on mesh load callback
 *	@inherits AnimatedMesh
 **/

Pedestrian = function(path, onLoad){

	var self = this;

	this.isSteak = false;

	var randomTexture = "textures/Pedestrian/man" + String(Math.floor(Math.random() * 3) + 1) + ".png";
	PathFollower.call(self, path, "objs/Pedestrian/man.js", randomTexture, 600, 19,  onLoad); // 
	
	var currTime = new Date().getTime();
	this.startAnimation(currTime + Math.floor(Math.random() * 5000));

	var loader = new THREE.JSONLoader();
	var createSteak = function(geometry){
		self.steak =  new THREE.Mesh( geometry,  new THREE.MeshFaceMaterial());
	};
	loader.load( "objs/Pedestrian/steak.js", function( geometry ) { createSteak( geometry) }, "textures/Pedestrian" );	
};


Pedestrian.prototype = new PathFollower();
Pedestrian.prototype.constructor = Pedestrian;
//Pdestrian.prototype.supr = PathFollower;


/**
 *	Call this when the person is picked up and under
 *  controll of the mouse
 *
 **/
Pedestrian.prototype.setPicked = function(){

	PathFollower.prototype.setPicked.call(this);
	this.setDuration(200);

};

/**
 *	Call this when the car is dropped
 *	
 *	Sets appropriate flags and creates a path
 *  to follow to get back to the nearest point
 * 	on its path
 *
 **/
Pedestrian.prototype.unsetPicked = function(){

	PathFollower.prototype.unsetPicked.call(this);

	if(!this.isSteak && this.position.distanceTo(new THREE.Vector3(-7.5, 3, -13.5)) < 1.5)
	{
		this.add(this.steak);
		this.isSteak= true;
	}
	else if(!this.isSteak && this.position.distanceTo(new THREE.Vector3(-2.5, 3, -13.5)) < 1.5)
	{
		this.add(this.steak);
		this.isSteak = true;
	}
	
	this.setDuration(600);
};

/**
 * 	Update function, moves things on path
 * 	Ignores path if picked flag is true
 *
 * 	@param currentTime - game time in milliseconds
 *	@param delta - time delta in seconds
 **/
Pedestrian.prototype.update = function(currentTime, delta ) {

	return PathFollower.prototype.update.call(this, currentTime, delta);

};
