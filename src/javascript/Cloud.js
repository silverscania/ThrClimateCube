/** 
 *	@class Cloud
 *	
 *	Cloud that floats from left to right
 *  has a rain sprite and a functin to randomly
 *	set greyness and rainyness depensing on climate
 *
 *	@param onLoad - on mesh load callback
 *	@inherits THREE.Mesh
 **/
Cloud = function(onLoad) {

	var self = this;

	this.speed = .25 + Math.random() * 1;

	var loader = new THREE.JSONLoader( true );
	loader.load( "objs/Clouds/cloud1.js", function( geometry ) {
		
		var mat = new THREE.MeshBasicMaterial({map: THREE.ImageUtils.loadTexture("textures/Cloud/cloudModel.png")});
	
		//call constructor on inherited class
		//use self work around here too as this function will be called
		//from the context of the loader.
		THREE.Mesh.call( self, geometry, mat);

		self.position.z = -20 + Math.random() * 35;
		self.position.y = 22 + Math.random() * 3;
		self.position.x = -40 + Math.random() * 25;

		self.scale.x = self.scale.y = self.scale.z = 1 + Math.random() * 0.7;

		self.rotation.y = 0; //(2 * Math.PI) / 4;
		self.loadRain();

		onLoad(self);

		},
		"textures/Cloud"
	);
};



Cloud.prototype = new THREE.Mesh();
Cloud.prototype.constructor = Cloud;
Cloud.prototype.supr = THREE.Mesh.prototype;


/**
 * Sets the blackness of the cloud and chance of rain radomly
 * depending on probability passed in
 *
 * @param probability - 0 is definately black, 1 is definately white
 *
 **/
Cloud.prototype.setClimate = function(probability){
	
	if(this.material && this.rain)
	{
		if(Math.random() > probability)
		{
			this.material.color.setHex( 0x777777 );
		}
		else
		{
			this.material.color.setHex( 0xFFFFFF );
		}
		
		if(Math.random() > probability)
		{
			this.rain.material.opacity = 1;
		}
		else
		{
			this.rain.material.opacity = 0;
		}
	}
};

/**
 * 	Call when mesh is loaded, adds a rain sprite to the cloud
 *	loads from a file
 **/
Cloud.prototype.loadRain = function(){

	var loader = new THREE.JSONLoader( true );
	var self = this;

	loader.load( "objs/Billboards/steamBillboard.js", function( geometry ) {
		
		var mat = new AnimatedMaterial( { imageName: "textures/Billboards/Rain/", numFrames:3, duration:1000 } );		
		mat.transparent = true;
		
		//call constructor on inherited class
		//use self work around here too as this function will be called
		//from the context of the loader.
		self.rain = new THREE.Mesh(geometry, mat);

		self.rain.scale.set(1.5,1.5,1.5);
		self.rain.doubleSided = true;

		self.add(self.rain);
		}
	);
};


/**
 * 	Update function, moves clouds and sets
 *	it to be transparent if zoom value is high
 *	enough
 *
 * 	@param currentTime - game time in milliseconds
 *	@param delta - time delta in seconds
 *	@param zoom - zoom value from the camera
 **/
Cloud.prototype.update = function(currentTime, delta, zoom) {

	if(zoom < 30)
	{
		this.material.transparent = true;
		this.material.opacity = 0.35;
	}
	else
	{
		this.material.transparent = false;
		this.material.opacity= 1;
	}
		
	this.position.x += this.speed * delta;

	if(this.position.x > 40)
	{
		this.position.x = -40;
	}

	if(this.rain)
	{
		this.rain.material.update(currentTime, delta);
	}
};
