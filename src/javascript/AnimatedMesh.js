/** 
 *	@class AnimatedMesh
 *	
 *	Inherits from THREE.Mesh but adds
 *  functions for animation
 *	
 *	@param objFile - filename string
 *	@param textureFileName - texture filename string
 *	@param onLoad - on mesh load callback
 *	@param _duration - duration for the animation in milleseconds
 *	@param _keyframes - number of keyframes in the file, must be correct
 *	@inherits THREE.Mesh
 **/
AnimatedMesh = function(objFile, textureFileName, onLoad, _duration, _keyframes) {

	if(objFile && textureFileName && onLoad)
	{
		this.duration = _duration;
		this.keyframes = _keyframes;
		this.interpolation = this.duration / this.keyframes;

		var loader = new THREE.JSONLoader( true );
		var self = this;
		loader.load(objFile, function( geometry ) {
			
			
			var mat;
			
			if(textureFileName instanceof THREE.Material)
			{
				//else if its a material
				mat = textureFileName;
			}
			else //if textureFileName is a string
			{
				mat = new THREE.MeshBasicMaterial( {map: THREE.ImageUtils.loadTexture( textureFileName ), morphTargets:true } );
			}
			
			
			//mat.map.needsUpdate = true;
			//call constructor on inherited class
			//use self work around here too as this function will be called
			//from the context of the loader.
			THREE.Mesh.call( self, geometry, mat);

			onLoad(self);
			} 
			);	
	}
};

AnimatedMesh.prototype = new THREE.Mesh();
AnimatedMesh.prototype.constructor = AnimatedMesh;
AnimatedMesh.prototype.supr = THREE.Mesh.prototype;


//vars for update function
AnimatedMesh.prototype.flagIn = true;
AnimatedMesh.prototype.flagMoving = false;
AnimatedMesh.prototype.pauseStartTime = 0;
AnimatedMesh.prototype.startAnimationFlag = false;
AnimatedMesh.prototype.startAnimationAtTime = 0;
AnimatedMesh.prototype.flagStartTime = 0;

/**
 * 	change the duration of the animation to make it speed up or slow down
 *
 * 	@param newDuration - new duration in milliseconds
 **/
AnimatedMesh.prototype.setDuration = function(newDuration){

	this.duration = newDuration;
	this.interpolation = newDuration / this.keyframes;
};

/**
 * 	make animation begin at a given time
 *
 * 	@param startTime - time to start in milliseconds, use 0 for instant start
 **/
AnimatedMesh.prototype.startAnimation = function(startTime){

	this.startAnimationFlag = true;
	this.startAnimationAtTime = startTime;
};


/**
 * 	Update function, handles animation flags and
 *	calls do animation
 *
 * 	@param currentTime - game time in milliseconds
 *	@param delta - time delta in seconds
 **/
AnimatedMesh.prototype.update = function(currentTime, delta){
	
	//check for start request flag
	if(this.startAnimationFlag && currentTime > this.startAnimationAtTime)
	{
		this.flagMoving = true;
		this.flagStartTime = currentTime;
		//this.flagEndTime = currentTime + duration
		this.startAnimationFlag = false;
	}
	
	//do animtion if its supposed to be moving
	if(this.flagMoving)
	{
		this.doAnimation(currentTime, this.flagIn);
	}				
};
	
	 
	 
/*vars for doAnimation function*/
AnimatedMesh.prototype.lastKeyframe = 1; 
AnimatedMesh.prototype.currentKeyframe = 1;

/**
 * 	Handles animation, called by update function
 *
 * 	@param currentTime - game time in milliseconds
 **/
AnimatedMesh.prototype.doAnimation = function(currentTime){
	
	// Alternate morph targets			
	var time = currentTime - this.flagStartTime; //% this.duration; //ms to seconds

	//stop at the end
	if(time >= this.duration)
	{
		this.flagMoving = false;
		
		this.startAnimationFlag = true;
		this.startAnimationAtTime = 0;	
	}
	else
	{
		//clamp the time value
		if(time >= this.duration) time = this.duration - 1;
		
		//invert if we're going backwards
		if(this.flagIn) time = (this.duration - 1) - time;

		var keyframe = Math.floor( time / this.interpolation ) + 1;
	
		if ( keyframe != this.currentKeyframe ) {
			this.morphTargetInfluences[ this.lastKeyframe ] = 0;
			this.morphTargetInfluences[ this.currentKeyframe ] = 1;
			this.morphTargetInfluences[ keyframe ] = 0;
	
			this.lastKeyframe = this.currentKeyframe;
			this.currentKeyframe = keyframe;
		}
	}
};
