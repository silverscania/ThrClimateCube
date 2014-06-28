/** 
 *	@class TwitterPlane
 *	
 *	Planes that hang over the buildings, have folding
 *	animation and can draw text on themselves
 *	
 *	Todo: inherit from AnimatedMesh
 *
 *	@param text - string for text to start with
 *	@param onLoad - on mesh load callback
 *	@inherits THREE.Mesh
 **/
TwitterPlane = function(text, onLoad) {

	this.backgroundMargin = 50;

	this.fontSize = 25;
	this.text = text;

	this.img = new Image();  
	//FOR LOCAL VERSION ONLY!!!
	this.img.crossOrigin = "anonymous";
	
	//work around here to make the callback function be in the scope of this class
	//if we didnt encapsulate it with 'self', 'this' in the callback function wouldn't
	//point to this class
	var self = this;
	this.img.onload = function(){ self.onImageLoad(onLoad); }; 
	this.img.src = 'textures/TwitterFlag/twitterPlane.png';

};

TwitterPlane.prototype = new THREE.Mesh();
TwitterPlane.prototype.constructor = TwitterPlane;
TwitterPlane.prototype.supr = THREE.Mesh.prototype;


/**
 *	Function to call when image gets loaded.
 *	Creates canvas object and then creates the mesh,
 *	setting the material of the mesh to be the canvas
 *
 *	@param onLoad - on mesh load callback (pass in from ctor)
 *
 **/
TwitterPlane.prototype.onImageLoad = function (onLoad) {

	//create canvas and context based on image size
	this.canvas = document.createElement("canvas");
	this.canvas.width = this.img.width;
	this.canvas.height = this.img.height;
	this.context = this.canvas.getContext("2d");
	this.context.font = this.fontSize + "pt Arial";
	this.context.textAlign = "center";
	this.context.textBaseline = "middle";
	this.context.fillStyle = "black";
	
	//draw base image and text
	this.context.drawImage(this.img, 0,0, this.canvas.width, this.canvas.height);
	this.context.fillText(this.text, this.canvas.width / 2, this.canvas.height / 2);
	

	this.texture = new THREE.Texture(this.canvas);
		
	var loader = new THREE.JSONLoader( true );
	var self = this;
	loader.load( "objs/TwitterPlanes/twitterPlane.js", function( geometry ) {
			
		var mat = new THREE.MeshBasicMaterial( { map: self.texture, morphTargets:true } );
		
		mat.map.needsUpdate = true;
		//call constructor on inherited class
		//use self work around here too as this function will be called
		//from the context of the loader.
		THREE.Mesh.call( self, geometry, mat);
		
		self.receiveShadow = true;
		//self.loaded = true;
		
		onLoad(self);
		} 
		);
		

};

/**
 *	Starts animation to fold in flag
 *	text will be written when flag is fully folded
 *
 *	@param text - string to write on flag
 *
 **/
TwitterPlane.prototype.updateText = function(text){

	//set flag to start (will be cleared upon animation start)
	this.startAnimation = true;	
	//start now
	this.startAnimationAtTime = 0;
		
	this.text = text;
};


/**
 *	Prints text in this.text onto canvas
 *	and sets material update flag
 **/
TwitterPlane.prototype.writeText = function(){
	
		//if image and mesh have loaded
	if(this.context && this.material)
	{
		this.context.fillStyle = "white";
		
		this.context.fillRect (0, 0, this.canvas.width, this.canvas.height);
		
		this.context.font = this.fontSize + "pt Arial";
		this.context.textAlign = "center";
		this.context.textBaseline = "middle";
		this.context.fillStyle = "black";
	
		this.context.drawImage(this.img, 0,0, this.canvas.width, this.canvas.height);
		
		var lines = wordWrap(this.text, this.canvas.width - this.backgroundMargin * 2, this.context);
		
		var x = this.canvas.width/2;
		//get middle - total height of lines
		var y = (this.canvas.height / 2) - ( (lines.length - 1) * (this.fontSize  + this.fontSize/2) * .5 );
		
		for(var i = 0; i < lines.length; ++i)
		{
			this.context.fillText(lines[i], x, y);
			y += this.fontSize + this.fontSize/2;
		}
		
		this.material.map.needsUpdate = true;	
		
		
	}
};

//static vars for update function
TwitterPlane.prototype.flagIn = true;
TwitterPlane.prototype.flagMoving = false;
TwitterPlane.prototype.pauseStartTime = 0;
TwitterPlane.prototype.startAnimation = false;
TwitterPlane.prototype.startAnimationAtTime = 0;
TwitterPlane.prototype.flagStartTime = 0;

/**
 * 	Update function, looks after animation flags
 *
 * 	@param currentTime - game time in milliseconds
 **/
TwitterPlane.prototype.update = function(currentTime){
	
	//check for start request flag
	if(this.startAnimation && currentTime > this.startAnimationAtTime)
	{
		this.flagMoving = true;
		this.flagStartTime = currentTime;
		//this.flagEndTime = currentTime + duration
		this.startAnimation = false;
	}
	
	//do animtion if its supposed to be moving
	if(this.flagMoving)
	{
		this.doAnimation(currentTime, this.flagIn);
	}
					
};
	 
	 
	 
/*vars for doAnimation function*/
TwitterPlane.prototype.duration = 2600;
TwitterPlane.prototype.keyframes = 64; /*16*/ 
TwitterPlane.prototype.interpolation = TwitterPlane.prototype.duration / TwitterPlane.prototype.keyframes;
TwitterPlane.prototype.lastKeyframe = 64; 
TwitterPlane.prototype.currentKeyframe = 64;


/**
 * 	Handles animation, called by update function
 *
 * 	@param currentTime - game time in milliseconds
 **/
TwitterPlane.prototype.doAnimation = function(currentTime){
	
	// Alternate morph targets			
	var time = currentTime - this.flagStartTime; //% this.duration; //ms to seconds

	//stop at the end
	if(time >= this.duration)
	{
		this.flagMoving = false;

		//flip in/out flag
		this.flagIn = !this.flagIn;
		
		//write text if flag is now in
		if(!this.flagIn)
		{
			this.writeText();
			
			//and roll flag back out again
			this.startAnimation = true;
			this.startAnimationAtTime = currentTime + 3000;
		}
			
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
