/** 
 *	@class AnimatedMaterial
 *	
 *	Inherits from THREE.MeshBasicMaterial
 *	
 *	see THREE.MeshBasicMaterial for parameters
 *	additional parameters are
 *	'numFrames' - number of texture files in the animation
 *	'duration' - length of animation in ms
 *	'imageName' - begginning part of image name
 **/
AnimatedMaterial = function(parameters) {

	parameters = parameters || {};
	
	this.images = new Array();

	this.keyframes = parameters.numFrames;

	this.setDuration(parameters.duration);

	for(var i = 0; i < parameters.numFrames; ++i)
	{
		this.images[i] = THREE.ImageUtils.loadTexture( parameters.imageName + String(i+1) + ".png");
	}

	parameters.map = this.images[0];

	THREE.MeshBasicMaterial.call(this, parameters);
};

AnimatedMaterial.prototype = new THREE.MeshBasicMaterial();
AnimatedMaterial.prototype.constructor = AnimatedMaterial;
AnimatedMaterial.prototype.supr = THREE.MeshBasicMaterial.prototype;

AnimatedMaterial.prototype.currentFrame = 1;


/**
 * 	change the duration of the animation to make it speed up or slow down
 *
 * 	@param newDuration - new duration in milliseconds
 **/
AnimatedMaterial.prototype.setDuration = function(newDuration){

	this.duration = newDuration;
	this.interpolation = newDuration / this.keyframes;
};


/**
 * 	Update function, calls doAnimation function
 *
 * 	@param currentTime - game time in milliseconds
 *	@param delta - time delta in seconds
 **/
AnimatedMaterial.prototype.update = function(currentTime, delta){
	this.doAnimation(currentTime);
};
	
	 
	 
/*vars for doAnimation function*/
AnimatedMaterial.prototype.currentKeyframe = 0;


/**
 * 	Handles animation, called by update function
 *
 * 	@param currentTime - game time in milliseconds
 **/
AnimatedMaterial.prototype.doAnimation = function(currentTime){
	
	var time = currentTime % this.duration;
	var keyframe = Math.floor( time / this.interpolation );

	if(this.currentKeyframe != keyframe)
	{
		this.currentKeyframe = keyframe;
		this.map = this.images[keyframe];
		this.map.needsUpdate = true;
	}
};

